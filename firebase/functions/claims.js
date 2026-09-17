// Preserve existing claims. Never reset an existing privileged role silently.
async function assignAuthenticatedRole(auth, uid) {
  const user = await auth.getUser(uid);
  const claims = user.customClaims || {};
  if (claims.role === 'authenticated') return false;
  if (claims.role !== undefined) throw new Error('Unexpected existing role; manual review required');
  await auth.setCustomUserClaims(uid, { ...claims, role: 'authenticated' });
  return true;
}

module.exports = { assignAuthenticatedRole };
