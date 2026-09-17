const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { assignAuthenticatedRole } = require('../claims');

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Set FIREBASE_PROJECT_ID to the verified Lore project');
  const apply = process.argv.includes('--apply');
  if (apply && process.env.CONFIRM_FIREBASE_PROJECT_ID !== projectId) {
    throw new Error('CONFIRM_FIREBASE_PROJECT_ID must match FIREBASE_PROJECT_ID');
  }
  initializeApp({ credential: applicationDefault(), projectId });
  const auth = getAuth();
  let pageToken;
  const counts = { scanned: 0, alreadySet: 0, missing: 0, updated: 0, failed: 0 };
  do {
    const page = await auth.listUsers(1000, pageToken);
    pageToken = page.pageToken;
    for (const user of page.users) {
      counts.scanned++;
      if (user.customClaims?.role === 'authenticated') { counts.alreadySet++; continue; }
      counts.missing++;
      if (!apply) continue;
      try {
        if (await assignAuthenticatedRole(auth, user.uid)) counts.updated++;
      } catch {
        counts.failed++;
      }
    }
  } while (pageToken);
  // No tokens, emails, UIDs or service-account keys in logs.
  console.log(JSON.stringify({ projectId, dryRun: !apply, ...counts }));
  if (counts.failed) process.exitCode = 1;
}

main().catch(() => {
  console.error('Backfill failed. Verify project ID and Application Default Credentials.');
  process.exitCode = 1;
});
