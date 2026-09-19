import { NextResponse } from 'next/server';

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
};

type HistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

type PlaybackInput = {
  videoId?: string;
};

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
          content: `Eres el intérprete de peticiones multimedia de Lore. Determina si el usuario quiere reproducir un contenido concreto de YouTube o si solo está conversando.

REGLAS IMPORTANTES:
- action="play" para peticiones como "pon X", "una de X", "otra de X", "cambia a X", "quiero escuchar/ver X", "esa no, pon X", aunque falte el verbo "poner" si el contexto deja claro que están eligiendo contenido.
- "otra de Korn" es action="play", mediaType="music", requestKind="artist", artist="Korn", avoidCurrent=true.
- "pon Freak on a Leash de Korn" es action="play", requestKind="exact", artist="Korn", title="Freak on a Leash".
- Una petición genérica de género/ambiente como "pon rock", "quiero baladas" o "algo de electrónica" debe ser action="none" y requestKind="generic"; el DJ interno se ocupará.
- Si solo hablan SOBRE una canción, artista, película o noticia y no piden reproducirla, action="none".
- Usa el contexto reciente para resolver referencias como "otra", "esa no", "la anterior", "otra de ellos".
- Puedes corregir errores ortográficos OBVIOS en nombres conocidos de artistas o títulos cuando tengas alta confianza. No inventes canciones ni artistas.
- Para música exacta, query debe ser "ARTISTA TITULO official" cuando conozcas ambos.
- Para artista sin canción concreta, query debe ser "ARTISTA official music video".
- Para reportajes, documentales, entrevistas, trailers u otros videos, conserva nombres y términos relevantes.
- avoidCurrent=true cuando el usuario pide "otra", "diferente", "esa no" o equivalente y ya hay un video activo.
- Si action="none": query="", artist="", title="", mediaType="other" salvo una petición genérica musical, requestKind="generic".

Contexto reciente:
${recentContext}

Hay video reproduciéndose ahora: ${hasCurrentVideo ? 'sí' : 'no'}.`,
        },
        { role: 'user', content: message },
      ],
      temperature: 0,
      reasoning_effort: 'low',
      max_completion_tokens: 220,
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
            },
            required: [
              'action',
              'query',
              'mediaType',
              'requestKind',
              'artist',
              'title',
              'avoidCurrent',
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

function selectBestCandidate(
  items: YouTubeSearchItem[],
  intent: MediaIntent,
  currentVideoId?: string,
) {
  const candidates = items
    .filter((item) => {
      const videoId = item.id?.videoId;
      if (!videoId) return false;
      return !(intent.avoidCurrent && currentVideoId && videoId === currentVideoId);
    })
    .map((item, index) => ({
      item,
      score: candidateScore(item, intent, index),
    }))
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];
  if (!best || !Number.isFinite(best.score)) return null;

  const title = best.item.snippet?.title ?? '';
  const channelTitle = best.item.snippet?.channelTitle ?? '';

  if (intent.mediaType === 'music' && intent.artist) {
    const artistCoverage = tokenCoverage(intent.artist, `${title} ${channelTitle}`);
    if (artistCoverage < 0.5) return null;
  }

  if (intent.requestKind === 'exact' && intent.title) {
    const titleCoverage = tokenCoverage(intent.title, title);
    if (titleCoverage < 0.5) return null;
  }

  return best.item;
}

async function searchYouTube(
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
  const best = selectBestCandidate(data.items ?? [], intent, currentVideoId);
  if (!best?.id?.videoId) return null;

  const snippet = best.snippet;
  return {
    videoId: best.id.videoId,
    title: snippet?.title ?? intent.query,
    channelTitle: snippet?.channelTitle ?? '',
    thumbnail:
      snippet?.thumbnails?.high?.url ??
      snippet?.thumbnails?.medium?.url ??
      snippet?.thumbnails?.default?.url ??
      null,
  };
}

export async function POST(request: Request) {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return NextResponse.json(
      { error: 'El intérprete de peticiones de video no está configurado.' },
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
          action: 'play',
          query: intent.query,
          mediaType: intent.mediaType,
          requestKind: intent.requestKind,
          error: 'La API de YouTube no está configurada en el servidor.',
        },
        { status: 503 },
      );
    }

    const video = await searchYouTube(intent, youtubeApiKey, playback.videoId);
    if (!video) {
      return NextResponse.json(
        {
          action: 'play',
          query: intent.query,
          mediaType: intent.mediaType,
          requestKind: intent.requestKind,
          error: 'No encontré un resultado suficientemente parecido a lo que pediste.',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      action: 'play',
      query: intent.query,
      mediaType: intent.mediaType,
      requestKind: intent.requestKind,
      ...video,
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
