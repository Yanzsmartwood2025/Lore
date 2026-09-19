create table if not exists public.lore_learned_context (
  user_id uuid not null references public.lore_profiles(id) on delete cascade,
  persona_slug text not null references public.lore_persona_registry(slug) on delete cascade,
  relationship_summary text not null default '',
  active_topics jsonb not null default '[]'::jsonb,
  story_summary text not null default '',
  recent_arc text not null default '',
  last_refreshed_interaction bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, persona_slug)
);

alter table public.lore_persona_relationship_state
  add column if not exists trust_score smallint not null default 0
    check (trust_score between 0 and 100),
  add column if not exists conflict_score smallint not null default 0
    check (conflict_score between 0 and 100),
  add column if not exists relationship_stage text not null default 'new'
    check (relationship_stage in ('new','familiar','close','bonded'));

create index if not exists lore_learned_context_persona_idx
  on public.lore_learned_context (persona_slug);

alter table public.lore_learned_context enable row level security;
revoke all on table public.lore_learned_context from public, anon, authenticated;
grant select, insert, update, delete on table public.lore_learned_context to service_role;
