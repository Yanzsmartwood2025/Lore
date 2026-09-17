const { test } = require('node:test');
const assert = require('node:assert/strict');
const { assignAuthenticatedRole } = require('../claims');

test('adds role without removing unrelated claims', async () => {
  let saved;
  const auth = { getUser: async () => ({ customClaims: { plan: 'free' } }), setCustomUserClaims: async (_uid, claims) => { saved = claims; } };
  assert.equal(await assignAuthenticatedRole(auth, 'fixture'), true);
  assert.deepEqual(saved, { plan: 'free', role: 'authenticated' });
});
test('retries are idempotent', async () => {
  const auth = { getUser: async () => ({ customClaims: { role: 'authenticated' } }), setCustomUserClaims: async () => assert.fail('unexpected write') };
  assert.equal(await assignAuthenticatedRole(auth, 'fixture'), false);
});
test('does not overwrite unexpected roles', async () => {
  const auth = { getUser: async () => ({ customClaims: { role: 'admin' } }), setCustomUserClaims: async () => assert.fail('unexpected write') };
  await assert.rejects(assignAuthenticatedRole(auth, 'fixture'), /Unexpected existing role/);
});
