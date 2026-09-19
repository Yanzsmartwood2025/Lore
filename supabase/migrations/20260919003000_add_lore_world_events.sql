create table if not exists public.lore_world_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique check (length(trim(event_key)) between 1 and 100),
  title text not null check (length(trim(title)) between 1 and 180),
  summary text not null check (length(trim(summary)) between 1 and 1600),
  involved_personas text[] not null default '{}'::text[],
  status text not null default 'active'
    check (status in ('active','historical')),
  importance smallint not null default 3 check (importance between 1 and 5),
  happened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lore_world_events_recall_idx
  on public.lore_world_events (status, importance desc, happened_at desc nulls last);

alter table public.lore_world_events enable row level security;
revoke all on table public.lore_world_events from public, anon, authenticated;
grant select, insert, update, delete on table public.lore_world_events to service_role;
