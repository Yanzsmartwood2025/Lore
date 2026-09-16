import { NextResponse } from 'next/server';
import { MUSIC_CATEGORIES, isMusicCategory } from '@/lib/music';

type GroqResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

function normalizeCategory(content: string | null | undefined) {
  if (!content) return null;

  const normalized = content.trim().toLowerCase().replace(/["'`.*]/g, '');
  if (isMusicCategory(normalized)) return normalized;
  if (normalized.includes('romántica') || normalized.includes('romantica') || normalized.includes('despecho')) {
    return 'romantica';
  }
  if (normalized.includes('reggaetón') || normalized.includes('reggaeton') || normalized.includes('fiesta')) {
    return 'reggaeton';
  }
  return null;
}

export async function POST(request: Request) {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return NextResponse.json({ error: 'El clasificador musical no está configurado.' }, { status: 500 });
  }

  let message = '';
  try {
    const body = (await request.json()) as { message?: unknown };
    message = typeof body.message === 'string' ? body.message.trim() : '';
  } catch {
    // La validación de abajo devuelve el mismo error para JSON inválido.
  }

  if (!message) {
    return NextResponse.json({ error: 'Escribe un mensaje para elegir el ambiente.' }, { status: 400 });
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
        messages: [
          {
            role: 'system',
            content: `Clasifica el estado de ánimo del usuario para elegir música. Responde únicamente una de estas claves, sin explicación: ${Object.keys(MUSIC_CATEGORIES).join(', ')}. Usa romantica para tristeza, amor o despecho; usa reggaeton para fiesta, energía o baile.`,
          },
          { role: 'user', content: message },
        ],
        temperature: 0,
        max_completion_tokens: 20,
      }),
      cache: 'no-store',
    });

    if (!groqResponse.ok) throw new Error('Groq request failed');

    const data = (await groqResponse.json()) as GroqResponse;
    const category = normalizeCategory(data.choices?.[0]?.message?.content);
    if (!category) throw new Error('Invalid category');

    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: 'No pude elegir un ambiente musical.' }, { status: 502 });
  }
}
