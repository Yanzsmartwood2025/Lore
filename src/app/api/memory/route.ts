import { createMemoryEmbedding, MEMORY_EMBEDDING_MODEL } from '@/lib/chat-memory';
import { requireUser } from '@/lib/supabase/server';

const SCOPES = {
  shared: 'lore_shared_memories',
  persona: 'lore_persona_memories',
  timeline: 'lore_user_timeline',
} as const;

type Scope = keyof typeof SCOPES;

function isScope(value: unknown): value is Scope {
  return value === 'shared' || value === 'persona' || value === 'timeline';
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth) {
    return Response.json({ error: 'Inicia sesión para ver tu memoria.' }, { status: 401 });
  }

  const [shared, persona, timeline, relationships] = await Promise.all([
    auth.supabase
      .from('lore_shared_memories')
      .select('id,memory_key,memory_value,memory_type,importance,learned_by_persona_slug,updated_at')
      .eq('user_id', auth.user.id)
      .order('importance', { ascending: false })
      .order('updated_at', { ascending: false }),
    auth.supabase
      .from('lore_persona_memories')
      .select('id,persona_slug,memory_key,memory_value,memory_type,importance,updated_at')
      .eq('user_id', auth.user.id)
      .order('persona_slug', { ascending: true })
      .order('importance', { ascending: false }),
    auth.supabase
      .from('lore_user_timeline')
      .select('id,event_key,title,details,event_type,event_date,recurs_annually,status,is_pinned,importance,learned_by_persona_slug,updated_at')
      .eq('user_id', auth.user.id)
      .order('is_pinned', { ascending: false })
      .order('importance', { ascending: false })
      .order('updated_at', { ascending: false }),
    auth.supabase
      .from('lore_persona_relationship_state')
      .select('persona_slug,interaction_count,relationship_stage')
      .eq('user_id', auth.user.id)
      .order('persona_slug', { ascending: true }),
  ]);

  const error = shared.error || persona.error || timeline.error || relationships.error;
  if (error) {
    console.error('Unable to load Lore memories:', error.message);
    return Response.json({ error: 'No se pudo cargar la memoria.' }, { status: 500 });
  }

  return Response.json({
    shared: shared.data ?? [],
    persona: persona.data ?? [],
    timeline: timeline.data ?? [],
    relationships: relationships.data ?? [],
  });
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if (!auth) {
    return Response.json({ error: 'Inicia sesión para editar tu memoria.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const scope = body.scope;
  const id = typeof body.id === 'string' ? body.id : '';
  if (!isScope(scope) || !id) {
    return Response.json({ error: 'Recuerdo inválido.' }, { status: 400 });
  }

  const changes: Record<string, unknown> = { updated_at: new Date().toISOString() };
  let embeddingText = '';

  if (scope === 'shared' || scope === 'persona') {
    const value = typeof body.value === 'string' ? body.value.trim().slice(0, 1200) : '';
    if (!value) return Response.json({ error: 'El recuerdo no puede quedar vacío.' }, { status: 400 });
    changes.memory_value = value;
    embeddingText = value;
  } else {
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 180) : '';
    const details = typeof body.details === 'string' ? body.details.trim().slice(0, 1600) : '';
    const eventDate =
      typeof body.eventDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.eventDate)
        ? body.eventDate
        : null;
    if (!title || !details) {
      return Response.json({ error: 'Título y detalle son obligatorios.' }, { status: 400 });
    }
    changes.title = title;
    changes.details = details;
    changes.event_date = eventDate;
    changes.last_confirmed_at = new Date().toISOString();
    embeddingText = `${title}: ${details}`;
  }

  const apiKeys = [process.env.MISTRAL_API_KEY_1, process.env.MISTRAL_API_KEY_2].filter(
    (key): key is string => Boolean(key),
  );
  const embedding =
    apiKeys.length > 0 && embeddingText
      ? await createMemoryEmbedding(apiKeys, embeddingText).catch(() => null)
      : null;

  changes.embedding = embedding;
  changes.embedding_model = embedding ? MEMORY_EMBEDDING_MODEL : null;

  const { error } = await auth.supabase
    .from(SCOPES[scope])
    .update(changes)
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) {
    console.error('Unable to update Lore memory:', error.message);
    return Response.json({ error: 'No se pudo actualizar el recuerdo.' }, { status: 500 });
  }

  await auth.supabase
    .from('lore_learned_context')
    .delete()
    .eq('user_id', auth.user.id);

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireUser(request);
  if (!auth) {
    return Response.json({ error: 'Inicia sesión para borrar tu memoria.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const scope = body.scope;
  const id = typeof body.id === 'string' ? body.id : '';
  if (!isScope(scope) || !id) {
    return Response.json({ error: 'Recuerdo inválido.' }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from(SCOPES[scope])
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) {
    console.error('Unable to delete Lore memory:', error.message);
    return Response.json({ error: 'No se pudo borrar el recuerdo.' }, { status: 500 });
  }

  await auth.supabase
    .from('lore_learned_context')
    .delete()
    .eq('user_id', auth.user.id);

  return Response.json({ ok: true });
}
