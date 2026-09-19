import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireUser } from '@/lib/supabase/server';

type GroqResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    thumbnails?: {
      medium?: { url?: string };
      high?: { url?: string };
      default?: { url?: string };
    };
  };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
};

type RequestKind = 'exact' | 'artist' | 'topic' | 'generic' | 'none';

type MediaIntent = {
  action: 'play' | 'none';
  query: string;
  mediaType: 'music' | 'video' | 'reportage' | 'documentary' | 'movie' | 'trailer' | 'other';
  requestKind: RequestKind;
  artist: string;
  title: string;
  avoidCurrent: boolean;
  needsChoice: boolean;
};

type HistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

type PlaybackInput = {
  videoId?: string;
};

type RankedCandidate = {
  item: YouTubeSearchItem;
  score: number;
};

const USER_DAILY_SEARCH_LIMIT = 5;
const GLOBAL_DAILY_SEARCH_LIMIT = 90;

function extractJsonObject(raw: string) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}

function parseIntent(raw: string | null | undefined): MediaIntent | null {
  if (!raw) return null;
  const parsed = extractJsonObject(raw.trim());
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  const record = parsed as Record<string, unknown>;
  const action = record.action === 'play' ? 'play' : record.action === 'none' ? 'none' : null;
  const query = typeof record.query === 'string' ? record.query.trim().slice(0, 200) : '';
  const artist = typeof record.artist === 'string' ? record.artist.trim().slice(0, 100) : '';
  const title = typeof record.title === 'string' ? record.title.trim().slice(0, 140) : '';
  const avoidCurrent = record.avoidCurrent === true;
  const needsChoice = record.needsChoice === true;

  const allowedTypes = new Set([
    'music',
    'video',
    'reportage',
    'documentary',
    'movie',
    'trailer',
    'other',
  ]);
  const mediaType =
    typeof record.mediaType === 'string' && allowedTypes.has(record.mediaType)
      ? (record.mediaType as MediaIntent['mediaType'])
      : 'other';

  const allowedKinds = new Set<RequestKind>(['exact', 'artist', 'topic', 'generic', 'none']);
  const requestKind =
    typeof record.requestKind === 'string' && allowedKinds.has(record.requestKind as RequestKind)
      ? (record.requestKind as RequestKind)
      : action === 'none'
        ? 'none'
        : 'topic';

  if (!action) return null;
  if (action === 'play' && !query) return null;

  return {
    action,
    query,
    mediaType,
    requestKind,
    artist,
    title,
    avoidCurrent,
    needsChoice,
  };
}

function sanitizeHistory(value: unknown) {
  if (!Array.isArray(value)) return [] as HistoryItem[];

  return value
    .slice(-8)
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const record = item as Record<string, unknown>;
      const role = record.role === 'user' ? 'user' : record.role === 'assistant' ? 'assistant' : null;
      const content = typeof record.content === 'string' ? record.content.trim().slice(0, 500) : '';
      if (!role || !content) return null;
      return { role, content };
    })
    .filter((item): item is HistoryItem => Boolean(item));
}

function sanitizePlayback(value: unknown): PlaybackInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const videoId = (value as Record<string, unknown>).videoId;
  return typeof videoId === 'string' && /^[A-Za-z0-9_-]{6,20}$/.test(videoId)
    ? { videoId }
    : {};
}


function hasRecentMediaOffer(history: HistoryItem[]) {
  const lastAssistant = [...history].reverse().find((item) => item.role === 'assistant')?.content ?? '';
  const normalized = normalizeText(lastAssistant);
  if (!normalized) return false;

  return (
    /\bquieres que te (?:la|lo|las|los) ponga\b/.test(normalized) ||
    /\bquieres (?:escuchar|oir|ver)\b/.test(normalized) ||
    /\bte (?:la|lo|las|los) pongo\b/.test(normalized) ||
    /\bte busco (?:esa|ese|una|un)\b/.test(normalized) ||
    /\b(?:ponemos|vemos|escuchamos) (?:esa|ese|una|un)\b/.test(normalized)
  );
}

function hasExplicitMediaCue(message: string, history: HistoryItem[]) {
  const normalized = normalizeText(message);
  if (!normalized) return false;

  const startsWithCommand =
    /^(?:pon|ponme|ponla|ponlo|reproduce|reproduceme|cambia|cambiala|cambialo|busca|buscame|escuchemos|oigamos|veamos)\b/.test(
      normalized,
    );

  const explicitListen =
    /\b(?:quiero|quisiera|querria|me gustaria|podemos|vamos a)\s+(?:escuchar|oir)\b/.test(
      normalized,
    );

  const explicitWatch =
    /\b(?:quiero|quisiera|querria|me gustaria|podemos|vamos a)\s+ver\s+(?:(?:un|una|el|la)\s+)?(?:video|pelicula|documental|reportaje|trailer|concierto|entrevista|clip)\b/.test(
      normalized,
    );

  const shortArtistRequest =
    /^(?:otra|una)\s+de\s+(?!las?\b|los?\b|mis?\b|tus?\b|sus?\b|estas?\b|esas?\b|aquellas?\b).{2,80}$/.test(
      normalized,
    ) && normalized.split(/\s+/).length <= 10;

  const shortMediaRequest =
    /^(?:otra|una)\s+(?:cancion|cancioncita|tema|rola|video)\s+de\b/.test(normalized);

  if (
    startsWithCommand ||
    explicitListen ||
    explicitWatch ||
    shortArtistRequest ||
    shortMediaRequest
  ) {
    return true;
  }

  if (!hasRecentMediaOffer(history)) return false;

  return /^(?:si|sí|dale|ok|okay|va|de una|hazlo|esa|ese|esa misma|ese mismo|ponla|ponlo|quiero esa|quiero ese)(?:\b|$)/.test(
    message.trim().toLowerCase(),
  );
}

async function classifyMediaIntent(
  message: string,
  history: HistoryItem[],
  hasCurrentVideo: boolean,
  groqApiKey: string,
) {
  const recentContext = history.length
    ? history.map((item) => `${item.role === 'user' ? 'Usuario' : 'Personaje'}: ${item.content}`).join('\n')
    : 'Sin contexto anterior útil.';

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content: `Eres el intérprete de peticiones multimedia de Lore. Determina si el usuario quiere reproducir contenido de YouTube o si solo está conversando.

REGLAS:
- action="play" para "pon X", "una de X", "otra de X", "cambia a X", "quiero escuchar/ver X", "esa no, pon X" y equivalentes.
- "otra de Korn" => action="play", mediaType="music", requestKind="artist", artist="Korn", avoidCurrent=true, needsChoice=true.
- "pon Freak on a Leash de Korn" => action="play", requestKind="exact", artist="Korn", title="Freak on a Leash", needsChoice=false.
- Si el usuario solo da un artista, un tema amplio, recuerda solo parte del título, escribe algo dudoso o pide "otra", needsChoice=true.
- Si proporciona artista + título concreto con alta confianza, needsChoice=false.
- Una petición genérica de ambiente como "pon rock", "quiero baladas" o "algo de electrónica" => action="none", requestKind="generic"; el DJ interno se ocupa.
- Si solo conversa SOBRE un contenido y no pide reproducirlo => action="none".
- Usa el contexto reciente para resolver "otra", "esa no", "la anterior", "otra de ellos".
- Puedes corregir errores ortográficos obvios en nombres conocidos cuando tengas alta confianza, pero no inventes canciones, programas ni artistas.
- Para música exacta, query debe conservar artista + título y añadir "official".
- Para artista sin canción concreta, query debe ser "ARTISTA official music video".
- Para reportajes, documentales, entrevistas, trailers u otros videos, conserva los términos relevantes.
- avoidCurrent=true cuando pide "otra", "diferente", "esa no" y ya hay un video activo.
- Si action="none": query="", artist="", title="", mediaType="other" salvo petición genérica musical.

Contexto reciente:
${recentContext}

Hay video reproduciéndose ahora: ${hasCurrentVideo ? 'sí' : 'no'}.`,
        },
        { role: 'user', content: message },
      ],
      temperature: 0,
      reasoning_effort: 'low',
      max_completion_tokens: 240,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'youtube_media_intent',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['play', 'none'] },
              query: { type: 'string' },
              mediaType: {
                type: 'string',
                enum: ['music', 'video', 'reportage', 'documentary', 'movie', 'trailer', 'other'],
              },
              requestKind: {
                type: 'string',
                enum: ['exact', 'artist', 'topic', 'generic', 'none'],
              },
              artist: { type: 'string' },
              title: { type: 'string' },
              avoidCurrent: { type: 'boolean' },
              needsChoice: { type: 'boolean' },
            },
            required: [
              'action',
              'query',
              'mediaType',
              'requestKind',
              'artist',
              'title',
              'avoidCurrent',
              'needsChoice',
            ],
            additionalProperties: false,
          },
        },
      },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const rawError = await response.text();
    console.error('Groq YouTube intent failed:', response.status, rawError.slice(0, 300));
    throw new Error(`Groq intent request failed: ${response.status}`);
  }

  const data = (await response.json()) as GroqResponse;
  return parseIntent(data.choices?.[0]?.message?.content);
}

function getYouTubeApiKey() {
  return (
    process.env.YOUTUBE_API_KEY ||
    process.env.YOUTUBE_DATA_API_KEY ||
    process.env.GOOGLE_YOUTUBE_API_KEY ||
    process.env.YOUTUBE_V3_API_KEY ||
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ||
    ''
  );
}

function normalizeText(value: string) {
  return value
    .replace(/&amp;/gi, ' and ')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const SEARCH_NOISE = new Set([
  'official',
  'video',
  'music',
  'audio',
  'lyrics',
  'lyric',
  'hd',
  'hq',
  'remastered',
  'remaster',
  'visualizer',
  'topic',
]);

function meaningfulTokens(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !SEARCH_NOISE.has(token));
}

function tokenCoverage(needle: string, haystack: string) {
  const wanted = meaningfulTokens(needle);
  if (wanted.length === 0) return 0;
  const available = new Set(meaningfulTokens(haystack));
  return wanted.filter((token) => available.has(token)).length / wanted.length;
}

function candidateScore(item: YouTubeSearchItem, intent: MediaIntent, index: number) {
  const videoId = item.id?.videoId;
  const title = item.snippet?.title ?? '';
  const channel = item.snippet?.channelTitle ?? '';
  if (!videoId || !title) return Number.NEGATIVE_INFINITY;

  const searchable = `${title} ${channel}`;
  let score = Math.max(0, 18 - index * 2);

  const artistCoverage = intent.artist ? tokenCoverage(intent.artist, searchable) : 0;
  const titleCoverage = intent.title ? tokenCoverage(intent.title, title) : 0;

  if (intent.artist) {
    score += artistCoverage * 65;
    if (artistCoverage === 0) score -= 80;

    const normalizedArtist = normalizeText(intent.artist);
    const normalizedChannel = normalizeText(channel);
    if (
      normalizedArtist &&
      (normalizedChannel === normalizedArtist ||
        normalizedChannel.startsWith(`${normalizedArtist} `) ||
        normalizedChannel.includes(`${normalizedArtist} topic`))
    ) {
      score += 28;
    }
  }

  if (intent.requestKind === 'exact' && intent.title) {
    score += titleCoverage * 90;
    const normalizedRequestedTitle = normalizeText(intent.title);
    const normalizedCandidateTitle = normalizeText(title);
    if (normalizedRequestedTitle && normalizedCandidateTitle.includes(normalizedRequestedTitle)) {
      score += 35;
    }
    if (titleCoverage < 0.5) score -= 120;
  } else if (intent.title) {
    score += titleCoverage * 45;
  }

  const normalizedCandidate = normalizeText(searchable);
  if (normalizedCandidate.includes('official')) score += 8;
  if (normalizeText(channel).includes('topic')) score += 5;

  return score;
}

function rankCandidates(
  items: YouTubeSearchItem[],
  intent: MediaIntent,
  currentVideoId?: string,
) {
  return items
    .filter((item) => {
      const videoId = item.id?.videoId;
      if (!videoId) return false;
      return !(intent.avoidCurrent && currentVideoId && videoId === currentVideoId);
    })
    .map((item, index) => ({
      item,
      score: candidateScore(item, intent, index),
    }))
    .filter((candidate) => Number.isFinite(candidate.score))
    .sort((a, b) => b.score - a.score);
}

function candidateToPayload(candidate: RankedCandidate, fallbackTitle: string) {
  const snippet = candidate.item.snippet;
  return {
    videoId: candidate.item.id?.videoId ?? '',
    title: snippet?.title ?? fallbackTitle,
    channelTitle: snippet?.channelTitle ?? '',
    thumbnail:
      snippet?.thumbnails?.high?.url ??
      snippet?.thumbnails?.medium?.url ??
      snippet?.thumbnails?.default?.url ??
      null,
  };
}

function isStrongExactMatch(candidate: RankedCandidate | undefined, intent: MediaIntent) {
  if (!candidate?.item.id?.videoId) return false;

  const title = candidate.item.snippet?.title ?? '';
  const channel = candidate.item.snippet?.channelTitle ?? '';

  if (intent.artist) {
    const artistCoverage = tokenCoverage(intent.artist, `${title} ${channel}`);
    if (artistCoverage < 0.5) return false;
  }

  if (intent.title) {
    const titleCoverage = tokenCoverage(intent.title, title);
    if (titleCoverage < 0.7) return false;
  }

  return true;
}

async function fetchYouTubeCandidates(
  intent: MediaIntent,
  apiKey: string,
  currentVideoId?: string,
) {
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '8',
    q: intent.query,
    key: apiKey,
    order: 'relevance',
    videoEmbeddable: 'true',
    videoSyndicated: 'true',
    safeSearch: 'moderate',
  });

  if (intent.mediaType !== 'music') {
    params.set('relevanceLanguage', 'es');
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
    { cache: 'no-store' },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube search failed: ${response.status} ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as YouTubeSearchResponse;
  return rankCandidates(data.items ?? [], intent, currentVideoId);
}

async function consumeSearchQuota(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .rpc('consume_lore_youtube_search_quota', {
      p_user_id: userId,
      p_user_limit: USER_DAILY_SEARCH_LIMIT,
      p_global_limit: GLOBAL_DAILY_SEARCH_LIMIT,
    })
    .single();

  if (error || !data) {
    console.error('Unable to consume YouTube search quota:', error?.message);
    return null;
  }

  return data as {
    allowed: boolean;
    user_used: number;
    user_remaining: number;
    global_used: number;
    global_remaining: number;
    quota_date: string;
  };
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth) {
    return NextResponse.json(
      { action: 'error', error: 'Inicia sesión para buscar contenido en YouTube.' },
      { status: 401 },
    );
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return NextResponse.json(
      { action: 'error', error: 'El intérprete de peticiones de video no está configurado.' },
      { status: 503 },
    );
  }

  let message = '';
  let history: HistoryItem[] = [];
  let playback: PlaybackInput = {};

  try {
    const body = (await request.json()) as {
      message?: unknown;
      history?: unknown;
      playback?: unknown;
    };
    message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';
    history = sanitizeHistory(body.history);
    playback = sanitizePlayback(body.playback);
  } catch {
    // La validación siguiente cubre JSON inválido.
  }

  if (!message) {
    return NextResponse.json({ error: 'Escribe una petición.' }, { status: 400 });
  }

  try {
    if (!hasExplicitMediaCue(message, history)) {
      return NextResponse.json({
        action: 'none',
        requestKind: 'none',
        reason: 'no_explicit_media_intent',
      });
    }

    const intent = await classifyMediaIntent(
      message,
      history,
      Boolean(playback.videoId),
      groqApiKey,
    );

    if (!intent || intent.action === 'none') {
      return NextResponse.json({
        action: 'none',
        requestKind: intent?.requestKind ?? 'none',
      });
    }

    const youtubeApiKey = getYouTubeApiKey();
    if (!youtubeApiKey) {
      return NextResponse.json(
        {
          action: 'error',
          error: 'La búsqueda de YouTube no está disponible en este momento.',
        },
        { status: 503 },
      );
    }

    const quota = await consumeSearchQuota(auth.supabase, auth.user.id);
    if (!quota) {
      return NextResponse.json(
        {
          action: 'error',
          error: 'No pude comprobar el límite de búsquedas. Inténtalo de nuevo.',
        },
        { status: 503 },
      );
    }

    if (!quota.allowed) {
      const userLimitReached = quota.user_remaining <= 0;
      return NextResponse.json(
        {
          action: 'quota',
          error: userLimitReached
            ? 'Ya usaste tus 5 búsquedas de YouTube de hoy. Mañana tendrás 5 nuevas.'
            : 'Las búsquedas de YouTube disponibles para hoy se agotaron. Vuelve mañana.',
          userRemaining: quota.user_remaining,
          quotaDate: quota.quota_date,
        },
        { status: 429 },
      );
    }

    const ranked = await fetchYouTubeCandidates(intent, youtubeApiKey, playback.videoId);
    const top = ranked[0];

    if (!top?.item.id?.videoId) {
      return NextResponse.json(
        {
          action: 'choose',
          query: intent.query,
          mediaType: intent.mediaType,
          suggestions: [],
          userRemaining: quota.user_remaining,
          error: 'No encontré resultados reproducibles para esa petición.',
        },
        { status: 404 },
      );
    }

    const shouldOfferChoices =
      intent.needsChoice ||
      intent.requestKind === 'artist' ||
      intent.requestKind === 'topic' ||
      (intent.requestKind === 'exact' && !isStrongExactMatch(top, intent));

    if (shouldOfferChoices) {
      const suggestions = ranked
        .slice(0, 3)
        .map((candidate) => candidateToPayload(candidate, intent.query))
        .filter((candidate) => candidate.videoId);

      return NextResponse.json({
        action: 'choose',
        query: intent.query,
        mediaType: intent.mediaType,
        requestKind: intent.requestKind,
        suggestions,
        userRemaining: quota.user_remaining,
      });
    }

    return NextResponse.json({
      action: 'play',
      query: intent.query,
      mediaType: intent.mediaType,
      requestKind: intent.requestKind,
      ...candidateToPayload(top, intent.query),
      userRemaining: quota.user_remaining,
    });
  } catch (error) {
    console.error(
      'Unable to resolve YouTube request:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      {
        action: 'error',
        error: 'No pude buscar ese contenido en YouTube.',
      },
      { status: 502 },
    );
  }
}
