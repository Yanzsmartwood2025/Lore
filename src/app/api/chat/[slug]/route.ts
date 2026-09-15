import { models } from '@/data/models';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const MAX_MESSAGE_LENGTH = 2_000;
const MAX_HISTORY_MESSAGES = 20;
const MISTRAL_CHAT_URL = 'https://api.mistral.ai/v1/chat/completions';

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as Record<string, unknown>;
  return (
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0 &&
    message.content.length <= MAX_MESSAGE_LENGTH
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const persona = models.find((model) => model.slug === slug && model.isActive);

  if (!persona?.systemPrompt) {
    return Response.json({ error: 'Persona no disponible.' }, { status: 404 });
  }

  let body: { message?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'La solicitud no contiene JSON válido.' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: `El mensaje debe tener entre 1 y ${MAX_MESSAGE_LENGTH} caracteres.` },
      { status: 400 },
    );
  }

  const history = Array.isArray(body.history)
    ? body.history.filter(isChatMessage).slice(-MAX_HISTORY_MESSAGES)
    : [];
  const apiKeys = [process.env.MISTRAL_API_KEY_1, process.env.MISTRAL_API_KEY_2].filter(
    (key): key is string => Boolean(key),
  );

  if (apiKeys.length === 0) {
    return Response.json({ error: 'El chat no está configurado todavía.' }, { status: 503 });
  }

  let lastResponse: Response | undefined;
  for (const apiKey of apiKeys) {
    const response = await fetch(MISTRAL_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          { role: 'system', content: persona.systemPrompt },
          ...history,
          { role: 'user', content: message },
        ],
        temperature: 0.8,
        stream: true,
      }),
    });

    if (response.status === 429) {
      lastResponse = response;
      continue;
    }

    if (!response.ok || !response.body) {
      return Response.json(
        { error: 'No pudimos conectar con el chat. Inténtalo de nuevo.' },
        { status: 502 },
      );
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  return Response.json(
    { error: 'El chat está muy solicitado. Vuelve a intentarlo en un momento.' },
    { status: lastResponse?.status ?? 503 },
  );
}
