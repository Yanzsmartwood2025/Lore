create extension if not exists pgcrypto;

create table public.lore_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  credits bigint not null default 0 check (credits >= 0),
  is_vip boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lore_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lore_profiles(id) on delete cascade,
  amount bigint not null check (amount <> 0),
  kind text not null check (kind in ('purchase','gift_sent','gift_received','chat','adjustment','refund')),
  reference_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.lore_content_packs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  credits bigint not null default 0 check (credits >= 0),
  currency text not null default 'USD' check (char_length(currency) = 3),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.lore_media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.lore_profiles(id) on delete set null,
  pack_id uuid references public.lore_content_packs(id) on delete set null,
  persona_slug text,
  r2_key text unique not null,
  mime_type text not null,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  is_vip boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.lore_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lore_profiles(id) on delete restrict,
  pack_id uuid references public.lore_content_packs(id) on delete set null,
  provider text not null check (provider in ('ccbill','nowpayments')),
  provider_payment_id text,
  status text not null default 'pending' check (status in ('pending','confirmed','failed','refunded')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'USD',
  credits bigint not null default 0 check (credits >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (provider, provider_payment_id)
);

create table public.lore_gifts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  credit_cost bigint not null check (credit_cost > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.lore_gift_transactions (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.lore_gifts(id),
  sender_id uuid not null references public.lore_profiles(id) on delete restrict,
  recipient_persona_slug text not null,
  credit_cost bigint not null check (credit_cost > 0),
  message text,
  created_at timestamptz not null default now()
);

create table public.lore_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lore_profiles(id) on delete cascade,
  persona_slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, persona_slug)
);

create table public.lore_chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.lore_chat_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 20000),
  created_at timestamptz not null default now()
);

create index on public.lore_credit_transactions(user_id, created_at desc);
create index on public.lore_media_assets(pack_id);
create index on public.lore_purchases(user_id, created_at desc);
create index on public.lore_chat_messages(conversation_id, created_at);

alter table public.lore_profiles enable row level security;
alter table public.lore_credit_transactions enable row level security;
alter table public.lore_content_packs enable row level security;
alter table public.lore_media_assets enable row level security;
alter table public.lore_purchases enable row level security;
alter table public.lore_gifts enable row level security;
alter table public.lore_gift_transactions enable row level security;
alter table public.lore_chat_conversations enable row level security;
alter table public.lore_chat_messages enable row level security;

create policy "profiles readable by owner" on public.lore_profiles for select using (auth.uid() = id);
create policy "profiles editable by owner" on public.lore_profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "own credit ledger readable" on public.lore_credit_transactions for select using (auth.uid() = user_id);
create policy "active packs public" on public.lore_content_packs for select using (is_active);
create policy "accessible media metadata" on public.lore_media_assets for select using (
  not is_vip or owner_id = auth.uid() or exists (
    select 1 from public.lore_purchases p
    where p.user_id = auth.uid() and p.pack_id = lore_media_assets.pack_id and p.status = 'confirmed'
  ) or exists (select 1 from public.lore_profiles p where p.id = auth.uid() and p.is_vip)
);
create policy "owners register media" on public.lore_media_assets for insert with check (owner_id = auth.uid());
create policy "own purchases readable" on public.lore_purchases for select using (auth.uid() = user_id);
create policy "users create own pending purchases" on public.lore_purchases for insert with check (auth.uid() = user_id and status = 'pending');
create policy "users attach provider payment id" on public.lore_purchases for update using (auth.uid() = user_id and status = 'pending') with check (auth.uid() = user_id and status = 'pending');
create policy "active gifts public" on public.lore_gifts for select using (is_active);
create policy "own sent gifts readable" on public.lore_gift_transactions for select using (auth.uid() = sender_id);
create policy "own conversations" on public.lore_chat_conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own messages" on public.lore_chat_messages for all using (
  exists (select 1 from public.lore_chat_conversations c where c.id = conversation_id and c.user_id = auth.uid())
) with check (
  exists (select 1 from public.lore_chat_conversations c where c.id = conversation_id and c.user_id = auth.uid())
);

create or replace function public.handle_new_lore_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.lore_profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), new.raw_user_meta_data ->> 'avatar_url');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_lore_user();

create or replace function public.confirm_lore_purchase(p_purchase_id uuid, p_provider_payment_id text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed public.lore_purchases;
begin
  update public.lore_purchases set status='confirmed', provider_payment_id=p_provider_payment_id, confirmed_at=now()
  where id=p_purchase_id and status='pending' returning * into changed;
  if changed.id is null then return false; end if;
  update public.lore_profiles set credits=credits + changed.credits, updated_at=now() where id=changed.user_id;
  insert into public.lore_credit_transactions(user_id, amount, kind, reference_id)
  values(changed.user_id, changed.credits, 'purchase', changed.id::text);
  return true;
end; $$;
revoke all on function public.confirm_lore_purchase(uuid,text) from public, anon, authenticated;
grant execute on function public.confirm_lore_purchase(uuid,text) to service_role;
