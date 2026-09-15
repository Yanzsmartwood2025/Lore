import { NextResponse } from 'next/server';

const NOT_FOUND_MESSAGE = 'No encontré esa canción, ¿puedes ser más específico?';

type SongRequest = {
  cancion?: unknown;
  artista?: unknown;
};

type GroqResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

type YouTubeSearchResponse = {
  items?: Array<{
    id?: {
      videoId?: string;
    };
  }>;
};

function stringField(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function extractSongRequest(content: string | null | undefined) {
  if (!content) return null;

  try {
    const parsed: SongRequest = JSON.parse(content);
    const cancion = stringField(parsed.cancion);
    const artista = stringField(parsed.artista);

    return cancion ? { cancion, artista } : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const groqApiKey = process.env.GROQ_API_KEY;
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;

  if (!groqApiKey || !youtubeApiKey) {
    return NextResponse.json(
      { error: 'El servicio de búsqueda musical no está configurado.' },
      { status: 500 },
    );
  }

  let message: unknown;
  try {
    ({ message } = await request.json());
  } catch {
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 400 });
  }

  const userMessage = stringField(message);
  if (!userMessage) {
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 400 });
  }

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Extrae la canción y el artista solicitados por el usuario. Responde exclusivamente JSON válido con las claves "cancion" y "artista". Usa cadenas vacías si no puedes identificar un dato. No inventes canciones ni artistas.',
          },
          { role: 'user', content: userMessage },
        ],
        temperature: 0,
      }),
      cache: 'no-store',
    });

    if (!groqResponse.ok) {
      throw new Error('Groq request failed');
    }

    const groqData: GroqResponse = await groqResponse.json();
    const songRequest = extractSongRequest(groqData.choices?.[0]?.message?.content);
    if (!songRequest) {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    const query = [songRequest.cancion, songRequest.artista].filter(Boolean).join(' ');
    const youtubeUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    youtubeUrl.searchParams.set('part', 'snippet');
    youtubeUrl.searchParams.set('type', 'video');
    youtubeUrl.searchParams.set('maxResults', '1');
    youtubeUrl.searchParams.set('q', query);
    youtubeUrl.searchParams.set('key', youtubeApiKey);

    const youtubeResponse = await fetch(youtubeUrl, { cache: 'no-store' });
    if (!youtubeResponse.ok) {
      throw new Error('YouTube search failed');
    }

    const youtubeData: YouTubeSearchResponse = await youtubeResponse.json();
    const videoId = youtubeData.items?.[0]?.id?.videoId;
    if (!videoId) {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json({ videoId });
  } catch {
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 502 });
  }
}
