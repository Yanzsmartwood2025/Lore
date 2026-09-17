import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSupabaseToken } from '../src/lib/firebase/claims.ts';

test('uses current authenticated token without forced refresh', async () => {
  const user = { getIdTokenResult: async (force) => {
    assert.equal(force, false);
    return { token: 'fixture-token', claims: { role: 'authenticated' } };
  } };
  assert.equal(await getSupabaseToken(user), 'fixture-token');
});
test('deduplicates concurrent refreshes and handles onCreate delay', async () => {
  let calls = 0;
  const user = { getIdTokenResult: async (force) => {
    calls++;
    if (calls === 1) return { token: 'old-token', claims: {} };
    assert.equal(force, true);
    return { token: 'new-token', claims: { role: 'authenticated' } };
  } };
  const first = getSupabaseToken(user);
  const second = getSupabaseToken(user);
  assert.equal(first, second);
  assert.equal(await first, 'new-token');
  assert.equal(calls, 2);
});
test('does not hide Firebase token failures', async () => {
  const user = { getIdTokenResult: async () => { throw new Error('revoked'); } };
  await assert.rejects(getSupabaseToken(user), /revoked/);
});
