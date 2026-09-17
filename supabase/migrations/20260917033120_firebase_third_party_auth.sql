-- Apply only after the official Firebase integration and claims are configured.
-- All changes, including existing identity remapping, are atomic.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

lock table public.lore_profiles, public.lore_credit_transactions,
  public.lore_media_assets, public.lore_purchases, public.lore_gift_transactions,
  public.lore_chat_conversations, public.lore_chat_messages in access exclusive mode;

create temporary table lore_identity_remap on commit drop as
  select id::text as old_id, firebase_uid as new_id
  from public.lore_profiles where firebase_uid is not null;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_lore_user();

drop policy "profiles readable by owner" on public.lore_profiles;
drop policy "profiles editable by owner" on public.lore_profiles;
drop policy "own credit ledger readable" on public.lore_credit_transactions;
drop policy "accessible media metadata" on public.lore_media_assets;
drop policy "owners register media" on public.lore_media_assets;
drop policy "own purchases readable" on public.lore_purchases;
drop policy "users create own pending purchases" on public.lore_purchases;
drop policy "users attach provider payment id" on public.lore_purchases;
drop policy "own sent gifts readable" on public.lore_gift_transactions;
drop policy "own conversations" on public.lore_chat_conversations;
drop policy "own messages" on public.lore_chat_messages;

alter table public.lore_profiles drop constraint lore_profiles_id_fkey;
alter table public.lore_credit_transactions drop constraint lore_credit_transactions_user_id_fkey;
alter table public.lore_media_assets drop constraint lore_media_assets_owner_id_fkey;
alter table public.lore_purchases drop constraint lore_purchases_user_id_fkey;
alter table public.lore_gift_transactions drop constraint lore_gift_transactions_sender_id_fkey;
alter table public.lore_chat_conversations drop constraint lore_chat_conversations_user_id_fkey;

alter table public.lore_profiles alter column id type text using id::text;
alter table public.lore_credit_transactions alter column user_id type text using user_id::text;
alter table public.lore_media_assets alter column owner_id type text using owner_id::text;
alter table public.lore_purchases alter column user_id type text using user_id::text;
alter table public.lore_gift_transactions alter column sender_id type text using sender_id::text;
alter table public.lore_chat_conversations alter column user_id type text using user_id::text;

update public.lore_credit_transactions t set user_id = m.new_id from lore_identity_remap m where t.user_id = m.old_id;
update public.lore_media_assets t set owner_id = m.new_id from lore_identity_remap m where t.owner_id = m.old_id;
update public.lore_purchases t set user_id = m.new_id from lore_identity_remap m where t.user_id = m.old_id;
update public.lore_gift_transactions t set sender_id = m.new_id from lore_identity_remap m where t.sender_id = m.old_id;
update public.lore_chat_conversations t set user_id = m.new_id from lore_identity_remap m where t.user_id = m.old_id;
update public.lore_profiles t set id = m.new_id from lore_identity_remap m where t.id = m.old_id;

-- Keep unlinked legacy users and auth.users intact. Never link accounts by email.
alter table public.lore_profiles add constraint lore_profiles_id_not_blank check (length(trim(id)) > 0);
alter table public.lore_credit_transactions add constraint lore_credit_transactions_user_id_fkey
  foreign key (user_id) references public.lore_profiles(id) on update cascade on delete cascade;
alter table public.lore_media_assets add constraint lore_media_assets_owner_id_fkey
  foreign key (owner_id) references public.lore_profiles(id) on update cascade on delete set null;
alter table public.lore_purchases add constraint lore_purchases_user_id_fkey
  foreign key (user_id) references public.lore_profiles(id) on update cascade on delete restrict;
alter table public.lore_gift_transactions add constraint lore_gift_transactions_sender_id_fkey
  foreign key (sender_id) references public.lore_profiles(id) on update cascade on delete restrict;
alter table public.lore_chat_conversations add constraint lore_chat_conversations_user_id_fkey
  foreign key (user_id) references public.lore_profiles(id) on update cascade on delete cascade;

-- Firebase UIDs are NOT UUIDs. auth.uid() would throw on these subjects.
create policy "profiles readable by owner" on public.lore_profiles for select to authenticated
  using ((select auth.jwt()->>'sub') = id);
create policy "profiles created by owner" on public.lore_profiles for insert to authenticated
  with check ((select auth.jwt()->>'sub') = id and firebase_uid = id);
create policy "profiles editable by owner" on public.lore_profiles for update to authenticated
  using ((select auth.jwt()->>'sub') = id)
  with check ((select auth.jwt()->>'sub') = id and firebase_uid = id);
create policy "own credit ledger readable" on public.lore_credit_transactions for select to authenticated
  using ((select auth.jwt()->>'sub') = user_id);
create policy "accessible media metadata" on public.lore_media_assets for select to anon, authenticated using (
  not is_vip or owner_id = (select auth.jwt()->>'sub') or exists (
    select 1 from public.lore_purchases p
    where p.user_id = (select auth.jwt()->>'sub') and p.pack_id = lore_media_assets.pack_id and p.status = 'confirmed'
  ) or exists (select 1 from public.lore_profiles p where p.id = (select auth.jwt()->>'sub') and p.is_vip)
);
create policy "owners register media" on public.lore_media_assets for insert to authenticated
  with check (owner_id = (select auth.jwt()->>'sub'));
create policy "own purchases readable" on public.lore_purchases for select to authenticated
  using ((select auth.jwt()->>'sub') = user_id);
create policy "own sent gifts readable" on public.lore_gift_transactions for select to authenticated
  using ((select auth.jwt()->>'sub') = sender_id);
create policy "own conversations" on public.lore_chat_conversations for all to authenticated
  using ((select auth.jwt()->>'sub') = user_id)
  with check ((select auth.jwt()->>'sub') = user_id);
create policy "own messages readable" on public.lore_chat_messages for select to authenticated using (
  exists (select 1 from public.lore_chat_conversations c where c.id = conversation_id and c.user_id = (select auth.jwt()->>'sub'))
);
create policy "own user messages inserted" on public.lore_chat_messages for insert to authenticated with check (
  role = 'user' and exists (
    select 1 from public.lore_chat_conversations c where c.id = conversation_id and c.user_id = (select auth.jwt()->>'sub')
  )
);

-- RLS controls rows; column privileges additionally protect money/VIP status.
revoke all on public.lore_profiles, public.lore_credit_transactions, public.lore_purchases,
  public.lore_gift_transactions, public.lore_chat_conversations, public.lore_chat_messages,
  public.lore_media_assets from public, anon, authenticated;
grant select on public.lore_profiles, public.lore_credit_transactions, public.lore_purchases,
  public.lore_gift_transactions, public.lore_chat_conversations, public.lore_chat_messages,
  public.lore_media_assets, public.lore_content_packs, public.lore_gifts to authenticated;
-- Media's policy references these tables; anon receives no rows through their RLS.
grant select on public.lore_profiles, public.lore_purchases, public.lore_media_assets,
  public.lore_content_packs, public.lore_gifts to anon;
grant insert (id, firebase_uid, email, display_name, avatar_url, updated_at),
  update (id, firebase_uid, email, display_name, avatar_url, updated_at)
  on public.lore_profiles to authenticated;
grant insert, update, delete on public.lore_chat_conversations to authenticated;
grant insert on public.lore_chat_messages, public.lore_media_assets to authenticated;
grant all on public.lore_profiles, public.lore_credit_transactions, public.lore_purchases,
  public.lore_gift_transactions, public.lore_chat_conversations, public.lore_chat_messages,
  public.lore_media_assets to service_role;

-- Purchase creation/pricing and assistant messages are trusted server operations.
-- The payment-confirmation RPC remains service_role-only as in the base migration.
create function public.save_lore_assistant_message(p_conversation_id uuid, p_user_id text, p_content text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare message_id uuid;
begin
  -- Lock while checking ownership: a conversation cannot be deleted/replaced
  -- by another account between the ownership check and the privileged insert.
  perform 1 from public.lore_chat_conversations
    where id = p_conversation_id and user_id = p_user_id for share;
  if not found then
    raise exception 'Conversation unavailable' using errcode = '42501';
  end if;
  insert into public.lore_chat_messages(conversation_id, role, content)
    values (p_conversation_id, 'assistant', p_content) returning id into message_id;
  return message_id;
end; $$;
revoke all on function public.save_lore_assistant_message(uuid,text,text) from public, anon, authenticated;
grant execute on function public.save_lore_assistant_message(uuid,text,text) to service_role;

notify pgrst, 'reload schema';
commit;
