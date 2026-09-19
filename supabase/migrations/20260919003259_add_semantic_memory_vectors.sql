create extension if not exists vector with schema extensions;

alter table public.lore_shared_memories
  add column if not exists embedding extensions.vector(1024),
  add column if not exists embedding_model text;

alter table public.lore_persona_memories
  add column if not exists embedding extensions.vector(1024),
  add column if not exists embedding_model text;

alter table public.lore_user_timeline
  add column if not exists embedding extensions.vector(1024),
  add column if not exists embedding_model text;

create index if not exists lore_shared_memories_embedding_hnsw
  on public.lore_shared_memories
  using hnsw (embedding extensions.vector_cosine_ops)
  where embedding is not null;

create index if not exists lore_persona_memories_embedding_hnsw
  on public.lore_persona_memories
  using hnsw (embedding extensions.vector_cosine_ops)
  where embedding is not null;

create index if not exists lore_user_timeline_embedding_hnsw
  on public.lore_user_timeline
  using hnsw (embedding extensions.vector_cosine_ops)
  where embedding is not null;

create or replace function public.match_lore_memories(
  p_user_id uuid,
  p_persona_slug text,
  query_embedding extensions.vector(1024),
  match_threshold double precision default 0.52,
  match_count integer default 8
)
returns table (
  source_scope text,
  source_id uuid,
  content text,
  similarity double precision,
  importance smallint
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select source_scope, source_id, content, similarity, importance
  from (
    select
      'shared'::text as source_scope,
      m.id as source_id,
      m.memory_value as content,
      1 - (m.embedding <=> query_embedding) as similarity,
      m.importance
    from public.lore_shared_memories m
    where m.user_id = p_user_id
      and m.embedding is not null

    union all

    select
      'persona'::text as source_scope,
      m.id as source_id,
      m.memory_value as content,
      1 - (m.embedding <=> query_embedding) as similarity,
      m.importance
    from public.lore_persona_memories m
    where m.user_id = p_user_id
      and m.persona_slug = p_persona_slug
      and m.embedding is not null

    union all

    select
      'timeline'::text as source_scope,
      t.id as source_id,
      concat_ws(': ', t.title, t.details) as content,
      1 - (t.embedding <=> query_embedding) as similarity,
      t.importance
    from public.lore_user_timeline t
    where t.user_id = p_user_id
      and t.embedding is not null
  ) ranked
  where similarity >= match_threshold
  order by similarity desc, importance desc
  limit least(greatest(match_count, 1), 20);
$$;

revoke all on function public.match_lore_memories(uuid,text,extensions.vector,double precision,integer)
  from public, anon, authenticated;
grant execute on function public.match_lore_memories(uuid,text,extensions.vector,double precision,integer)
  to service_role;
