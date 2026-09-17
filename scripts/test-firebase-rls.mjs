import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Isolated PostgreSQL tests. They test RLS, NOT Firebase signatures or the
// hosted Supabase integration. Never substitute these for live JWT tests.
const db = new PGlite();
let checks = 0;
const oldId = '00000000-0000-4000-8000-000000000001';
const conversationId = '00000000-0000-4000-8000-000000000002';
const sql = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const check = (actual, expected, label) => { assert.deepEqual(actual, expected, label); checks++; console.log(`PASS ${label}`); };
const scalar = async (query) => Object.values((await db.query(query)).rows[0])[0];
const denied = async (query, label) => {
  await assert.rejects(db.exec(query), (error) => error.code === '42501', label);
  checks++;
  console.log(`PASS ${label}`);
};
const login = async (uid, role = 'authenticated') => {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: uid, role })]);
  await db.exec(`set role ${role}`);
};

try {
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.jwt() returns jsonb language sql stable as
      $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
  `);
  // gen_random_uuid is built into PostgreSQL; PGlite doesn't need pgcrypto.
  await db.exec((await sql('supabase/migrations/202609150001_lore_platform.sql')).replace('create extension if not exists pgcrypto;', ''));
  await db.exec(await sql('supabase/migrations/20260916031526_firebase_identity_bridge.sql'));
  await db.exec(`
    insert into auth.users(id,email) values ('${oldId}', 'fixture@example.invalid');
    update public.lore_profiles set firebase_uid='firebase-user-A', credits=7, is_vip=true where id='${oldId}';
    insert into public.lore_chat_conversations(id,user_id,persona_slug) values ('${conversationId}','${oldId}','lore');
    insert into public.lore_chat_messages(conversation_id,role,content) values ('${conversationId}','assistant','Existing message');
    insert into public.lore_credit_transactions(user_id,amount,kind) values ('${oldId}',7,'adjustment');
    insert into public.lore_purchases(user_id,provider,amount_cents) values ('${oldId}','ccbill',100);
    insert into public.lore_media_assets(owner_id,r2_key,mime_type) values ('${oldId}','fixture-key','image/png');
    insert into public.lore_gifts(id,slug,name,credit_cost) values ('00000000-0000-4000-8000-000000000003','fixture','Fixture',1);
    insert into public.lore_gift_transactions(gift_id,sender_id,recipient_persona_slug,credit_cost)
      values ('00000000-0000-4000-8000-000000000003','${oldId}','lore',1);
  `);
  await db.exec(await sql('supabase/migrations/20260917033120_firebase_third_party_auth.sql'));
  check(await scalar("select count(*)::int from lore_profiles where id='firebase-user-A' and credits=7 and is_vip"), 1, 'Migration preserves profile, credits and VIP');
  for (const [table, column] of [['lore_credit_transactions','user_id'], ['lore_purchases','user_id'], ['lore_media_assets','owner_id'], ['lore_gift_transactions','sender_id'], ['lore_chat_conversations','user_id']]) {
    check(await scalar(`select count(*)::int from ${table} where ${column}='firebase-user-A'`), 1, `Migration preserves ${table} ownership`);
  }
  check(await scalar(`select count(*)::int from lore_chat_messages where conversation_id='${conversationId}'`), 1, 'Existing messages preserved');
  check(await scalar('select count(*)::int from auth.users'), 1, 'Legacy auth.users not deleted');
  await login('firebase-user-B');
  const upsertB = `insert into lore_profiles(id,firebase_uid,email,display_name,avatar_url,updated_at)
    values ('firebase-user-B','firebase-user-B','b@example.invalid','B',null,now())
    on conflict(id) do update set id=excluded.id,firebase_uid=excluded.firebase_uid,email=excluded.email,
      display_name=excluded.display_name,avatar_url=excluded.avatar_url,updated_at=excluded.updated_at`;
  await db.exec(upsertB);
  await db.exec(upsertB);
  check(await scalar('select count(*)::int from lore_profiles'), 1, 'First-login profile upsert is idempotent and only own profile visible');
  check(await scalar("select credits::int from lore_profiles where id='firebase-user-B'"), 0, 'New profile starts with default credits');
  check(await scalar("select is_vip from lore_profiles where id='firebase-user-B'"), false, 'New profile is not VIP');
  check(await scalar('select count(*)::int from lore_chat_conversations'), 0, 'Other user conversations hidden');
  check(await scalar('select count(*)::int from lore_chat_messages'), 0, 'Other user messages hidden');
  await denied("insert into lore_profiles(id,firebase_uid) values ('forged-user','forged-user')", 'Cannot create another user profile');
  await denied("update lore_profiles set credits=999 where id='firebase-user-B'", 'Cannot change credits');
  await denied("update lore_profiles set is_vip=true where id='firebase-user-B'", 'Cannot activate VIP');
  await denied("update lore_profiles set id='forged-user',firebase_uid='forged-user' where id='firebase-user-B'", 'Cannot reassign own profile');
  await denied("insert into lore_chat_conversations(user_id,persona_slug) values ('firebase-user-A','camila')", 'Cannot create another user conversation');
  await denied(`insert into lore_chat_messages(conversation_id,role,content) values ('${conversationId}','user','intrusion')`, 'Cannot write another user messages');
  await db.exec("insert into lore_chat_conversations(user_id,persona_slug) values ('firebase-user-B','lore')");
  const ownConversation = await scalar("select id from lore_chat_conversations where user_id='firebase-user-B'");
  await db.exec(`insert into lore_chat_messages(conversation_id,role,content) values ('${ownConversation}','user','hello')`);
  check(await scalar('select count(*)::int from lore_chat_messages'), 1, 'Own chat read/write succeeds');
  await denied(`insert into lore_chat_messages(conversation_id,role,content) values ('${ownConversation}','assistant','forged')`, 'Cannot forge assistant reply');
  await denied("update lore_chat_conversations set user_id='firebase-user-A' where user_id='firebase-user-B'", 'Cannot transfer conversation ownership');
  check((await db.query(`update lore_chat_conversations set persona_slug='forged' where id='${conversationId}' returning id`)).rows.length, 0, 'Cannot update another user conversation');
  check((await db.query(`delete from lore_chat_conversations where id='${conversationId}' returning id`)).rows.length, 0, 'Cannot delete another user conversation');
  await denied("insert into lore_purchases(user_id,provider,amount_cents,credits) values ('firebase-user-B','ccbill',1,999)", 'Cannot forge purchase price or credits');
  await login('firebase-user-A');
  check(await scalar('select count(*)::int from lore_chat_conversations'), 1, 'Migrated user retains own conversation');
  check(await scalar('select count(*)::int from lore_chat_messages'), 1, 'Migrated user retains own message');
  await login('', 'anon');
  check(await scalar('select count(*)::int from lore_profiles'), 0, 'Anonymous cannot read profiles');
  await denied('select * from lore_chat_conversations', 'Anonymous cannot access conversations');
  check(await scalar('select count(*)::int from lore_media_assets'), 1, 'Public media remains accessible');
  console.log(`${checks} isolated PostgreSQL checks passed. Live Firebase/Supabase JWT tests still required.`);
} finally {
  await db.close();
}
