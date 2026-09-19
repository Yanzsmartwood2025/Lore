import { NextResponse } from 'next/server';

type GroqResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

type YouTubeSearchResponse = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      channelTitle?: string;
      thumbnails?: {
        medium?: { url?: string };
        high?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
};

type MediaIntent = {
  action: 'play' | 'none';
  query: string;
  mediaType: 'music' | 'video' | 'reportage' | 'documentary' | 'movie' | 'trailer' | 'other';
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
  const query = typeof record.query === 'string' ? record.query.trim().slice(0, 180) : '';
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

  if (!action) return null;
  if (action === 'play' && !query) return null;
  return { action, query, mediaType };
}

async function classifyMediaIntent(message: string, groqApiKey: string) {
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
          content: `Detecta si el usuario está pidiendo de forma explícita reproducir, poner, buscar para ver/escuchar o mostrar contenido de YouTube.

REGLAS:
- action="play" solo cuando hay una petición clara de reproducir/ver/escuchar/poner/buscar un contenido.
- Si solo está conversando SOBRE una película, canción, noticia, reportaje o artista, action="none".
- Para música, query debe incluir artista + canción cuando el usuario los dé.
- Para reportajes, documentales, películas, tráileres, noticias, entrevistas, conciertos u otros videos, conserva los nombres y datos importantes que dio el usuario.
- No inventes títulos, artistas, personas ni sucesos.
- Si el usuario pide "pon algo de X" o "quiero ver algo sobre X", crea una query útil y breve con X.
- Si action="none", query debe ser una cadena vacía y mediaType="other".`,
        },
        { role: 'user', content: message },
      ],
      temperature: 0,
      reasoning_effort: 'low',
      max_completion_tokens: 180,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'youtube_media_intent',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['play', 'none'],
              },
              query: {
                type: 'string',
              },
              mediaType: {
                type: 'string',
                enum: ['music', 'video', 'reportage', 'documentary', 'movie', 'trailer', 'other'],
              },
            },
            required: ['action', 'query', 'mediaType'],
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

async function searchYouTube(query: string, apiKey: string) {
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '5',
    q: query,
    key: apiKey,
    videoEmbeddable: 'true',
    safeSearch: 'moderate',
    relevanceLanguage: 'es',
  });

  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube search failed: ${response.status} ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as YouTubeSearchResponse;
  const first = data.items?.find((item) => item.id?.videoId);
  if (!first?.id?.videoId) return null;

  const snippet = first.snippet;
  return {
    videoId: first.id.videoId,
    title: snippet?.title ?? query,
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
  try {
    const body = (await request.json()) as { message?: unknown };
    message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';
  } catch {
    // La validación siguiente cubre JSON inválido.
  }

  if (!message) {
    return NextResponse.json({ error: 'Escribe una petición.' }, { status: 400 });
  }

  try {
    const intent = await classifyMediaIntent(message, groqApiKey);
    if (!intent || intent.action === 'none') {
      return NextResponse.json({ action: 'none' });
    }

    const youtubeApiKey = getYouTubeApiKey();
    if (!youtubeApiKey) {
      return NextResponse.json(
        {
          action: 'play',
          query: intent.query,
          mediaType: intent.mediaType,
          error: 'La API de YouTube no está configurada en el servidor.',
        },
        { status: 503 },
      );
    }

    const video = await searchYouTube(intent.query, youtubeApiKey);
    if (!video) {
      return NextResponse.json(
        {
          action: 'play',
          query: intent.query,
          mediaType: intent.mediaType,
          error: 'No encontré un video reproducible para esa petición.',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      action: 'play',
      query: intent.query,
      mediaType: intent.mediaType,
      ...video,
    });
  } catch (error) {
    console.error(
      'Unable to resolve YouTube request:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'No pude buscar ese contenido en YouTube.' },
      { status: 502 },
    );
  }
}
