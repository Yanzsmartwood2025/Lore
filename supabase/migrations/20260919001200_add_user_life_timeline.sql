create table if not exists public.lore_user_timeline (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lore_profiles(id) on delete cascade,
  event_key text not null check (length(trim(event_key)) between 1 and 100),
  title text not null check (length(trim(title)) between 1 and 180),
  details text not null check (length(trim(details)) between 1 and 1600),
  event_type text not null
    check (event_type in ('birthday','anniversary','life_event','milestone','goal')),
  event_date date,
  recurs_annually boolean not null default false,
  status text not null default 'active'
    check (status in ('active','resolved','historical')),
  is_pinned boolean not null default false,
  importance smallint not null default 3 check (importance between 1 and 5),
  confidence real not null default 0.8 check (confidence >= 0 and confidence <= 1),
  learned_by_persona_slug text references public.lore_persona_registry(slug) on delete set null,
  source_message_id uuid references public.lore_chat_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_confirmed_at timestamptz not null default now(),
  unique (user_id, event_key)
);

create index if not exists lore_user_timeline_recall_idx
  on public.lore_user_timeline
  (user_id, is_pinned desc, importance desc, updated_at desc);
create index if not exists lore_user_timeline_event_date_idx
  on public.lore_user_timeline (user_id, event_date)
  where event_date is not null;
create index if not exists lore_user_timeline_persona_idx
  on public.lore_user_timeline (learned_by_persona_slug)
  where learned_by_persona_slug is not null;
create index if not exists lore_user_timeline_source_message_idx
  on public.lore_user_timeline (source_message_id)
  where source_message_id is not null;

alter table public.lore_user_timeline enable row level security;
revoke all on table public.lore_user_timeline from public, anon, authenticated;
grant select, insert, update, delete on table public.lore_user_timeline to service_role;
