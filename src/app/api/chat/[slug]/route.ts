import { models } from '@/data/models';
import { cleanNarratedActions } from '@/lib/chat-format';
import { buildChatPrompt } from '@/lib/chat-policy';
import { createServiceClient, requireUser } from '@/lib/supabase/server';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const MAX_MESSAGE_LENGTH = 2_000;
const MAX_HISTORY_MESSAGES = 20;
const MISTRAL_CHAT_URL = 'https://api.mistral.ai/v1/chat/completions';

function readAssistantContent(payload: string) {
  let content = '';

  for (const line of payload.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;

    const data = trimmed.slice(5).trim();
    if (!data || data === '[DONE]') continue;

    try {
      content += JSON.parse(data).choices?.[0]?.delta?.content ?? '';
    } catch {
      // Mistral can send keep-alive or metadata events without JSON content.
    }
  }

  return content;
}

function createAssistantStream(content: string) {
  const event = JSON.stringify({ choices: [{ delta: { content } }] });
  return `${`data: ${event}`}\n\ndata: [DONE]\n\n`;
}

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
  const auth = await requireUser(request);
  if (!auth) return Response.json({ error: 'Inicia sesión para usar el chat.' }, { status: 401 });
  const { slug } = await params;
  const persona = models.find((model) => model.slug === slug && model.isActive);

  if (!persona?.systemPrompt) {
    return Response.json({ error: 'Persona no disponible.' }, { status: 404 });
  }

  let body: { message?: unknown };
  try {
    body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body');
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
  // Never trust assistant messages supplied by the browser. This conversation
  // was resolved using the verified user's ID and the server-selected persona.
  const { data: savedHistory, error: historyError } = await auth.supabase
    .from('lore_chat_messages').select('role, content')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false }).order('id', { ascending: false })
    .limit(MAX_HISTORY_MESSAGES);
  if (historyError) return Response.json({ error: 'No se pudo cargar la conversación.' }, { status: 500 });
  const history = (savedHistory ?? []).filter(isChatMessage).reverse()
    .map(({ role, content }) => ({ role, content: role === 'assistant' ? cleanNarratedActions(content) : content }))
    .filter(({ content }) => content.length > 0);
  const { error: messageError } = await auth.supabase.from('lore_chat_messages')
    .insert({ conversation_id: conversation.id, role: 'user', content: message });
  if (messageError) return Response.json({ error: 'No se pudo guardar el mensaje.' }, { status: 500 });

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
          { role: 'system', content: buildChatPrompt(persona.systemPrompt) },
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

    const mistralPayload = await response.text();
    const rawContent = readAssistantContent(mistralPayload);
    const content = cleanNarratedActions(rawContent);

    if (!content) {
      return Response.json(
        { error: 'El chat no devolvió una respuesta válida. Inténtalo de nuevo.' },
        { status: 502 },
      );
    }

    // Only the server can persist assistant messages. The conversation above
    // was resolved under the caller's JWT/RLS; never accept its ID from input.
    const { error: assistantError } = await createServiceClient().rpc('save_lore_assistant_message', {
      p_conversation_id: conversation.id,
      p_user_id: auth.user.id,
      p_content: content,
    });
    if (assistantError) return Response.json({ error: 'No se pudo guardar la respuesta.' }, { status: 500 });

    return new Response(createAssistantStream(content), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'private, no-store, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  return Response.json(
    { error: 'El chat está muy solicitado. Vuelve a intentarlo en un momento.' },
    { status: lastResponse?.status ?? 503 },
  );
}
