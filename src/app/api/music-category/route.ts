import { NextResponse } from 'next/server';
import { MUSIC_CATEGORIES, isMusicCategory } from '@/lib/music';

type GroqResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

function normalizeCategory(content: string | null | undefined) {
  if (!content) return null;

  const normalized = content.trim().toLowerCase().replace(/["'`.*]/g, '');
  if (isMusicCategory(normalized)) return normalized;

  const aliases: Array<[string[], keyof typeof MUSIC_CATEGORIES]> = [
    [['old school', 'reggaetón clásico', 'reggaeton clasico', 'perreo viejo'], 'reggaeton_clasico'],
    [['reggaetón', 'reggaeton', 'urbano', 'perreo'], 'reggaeton'],
    [['edm', 'electrónica', 'electronica', 'dance'], 'electronica'],
    [['techno', 'rave'], 'techno'],
    [['rock latino', 'rock en español', 'rock en espanol'], 'rock_latino'],
    [['linkin park', 'evanescence', 'green day', 'rock 2000', 'rock moderno'], 'rock_2000'],
    [['balada en inglés', 'balada en ingles', 'soft rock'], 'baladas_ingles'],
    [['romántica', 'romantica', 'despecho', 'balada'], 'romantica'],
    [['vallenato'], 'vallenato'],
    [['bachata'], 'bachata'],
    [['salsa', 'merengue', 'tropical'], 'tropical'],
    [['pop clásico', 'pop clasico', 'retro', 'oldies'], 'pop_clasicos'],
  ];

  for (const [terms, category] of aliases) {
    if (terms.some((term) => normalized.includes(term))) return category;
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
            content: `Clasifica la preferencia musical del usuario en una sola categoría válida. Distingue reggaeton de reggaeton_clasico; rock_latino para rock en español clásico; rock_2000 para alternative/nu-metal/post-grunge desde los 2000; romantica para baladas en español; baladas_ingles para baladas anglo; electronica para EDM/dance; techno para rave/techno; vallenato, bachata y tropical para sus géneros; pop_clasicos para pop/fiesta retro.`,
          },
          { role: 'user', content: message },
        ],
        temperature: 0,
        reasoning_effort: 'low',
        max_completion_tokens: 120,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'music_category',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  enum: Object.keys(MUSIC_CATEGORIES),
                },
              },
              required: ['category'],
              additionalProperties: false,
            },
          },
        },
      }),
      cache: 'no-store',
    });

    if (!groqResponse.ok) {
      const rawError = await groqResponse.text();
      console.error('Groq music classification failed:', groqResponse.status, rawError.slice(0, 300));
      throw new Error('Groq request failed');
    }

    const data = (await groqResponse.json()) as GroqResponse;
    const rawContent = data.choices?.[0]?.message?.content;
    let category: keyof typeof MUSIC_CATEGORIES | null = null;

    if (rawContent) {
      try {
        const parsed = JSON.parse(rawContent) as { category?: unknown };
        category = isMusicCategory(parsed.category) ? parsed.category : null;
      } catch {
        category = normalizeCategory(rawContent);
      }
    }

    if (!category) throw new Error('Invalid category');

    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: 'No pude elegir un ambiente musical.' }, { status: 502 });
  }
}
