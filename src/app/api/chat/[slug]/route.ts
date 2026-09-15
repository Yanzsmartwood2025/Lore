import { models } from '@/data/models';
import { requireUser } from '@/lib/supabase/server';

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
  const auth = await requireUser();
  if (!auth) return Response.json({ error: 'Inicia sesión para usar el chat.' }, { status: 401 });
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

  const { data: conversation, error: conversationError } = await auth.supabase
    .from('lore_chat_conversations')
    .upsert({ user_id: auth.user.id, persona_slug: slug, updated_at: new Date().toISOString() }, { onConflict: 'user_id,persona_slug' })
    .select('id').single();
  if (conversationError || !conversation) return Response.json({ error: 'No se pudo abrir la conversación.' }, { status: 500 });
  await auth.supabase.from('lore_chat_messages').insert({ conversation_id: conversation.id, role: 'user', content: message });

  let lastResponse: Response | undefined;
  for (const apiKey of apiKeys) {
    const response = await fetch(MISTRAL_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'open-mistral-7b',
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

    const [browserStream, persistenceStream] = response.body.tee();
    void persistAssistantStream(persistenceStream, auth.supabase, conversation.id);
    return new Response(browserStream, {
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

async function persistAssistantStream(stream: ReadableStream<Uint8Array>, supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>, conversationId: string) {
  const text = await new Response(stream).text();
  let content = '';
  for (const line of text.split('\n')) {
    if (!line.trim().startsWith('data:')) continue;
    try { content += JSON.parse(line.trim().slice(5)).choices?.[0]?.delta?.content ?? ''; } catch { /* final marker */ }
  }
  if (content) await supabase.from('lore_chat_messages').insert({ conversation_id: conversationId, role: 'assistant', content });
}
