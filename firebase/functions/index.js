const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const functions = require('firebase-functions/v1');
const { assignAuthenticatedRole } = require('./claims');

initializeApp();

// Auth onCreate uses first-generation functions (not an HTTP/public endpoint).
exports.assignSupabaseRole = functions
  .region('us-central1')
  .runWith({ failurePolicy: true, memory: '128MB', timeoutSeconds: 60, maxInstances: 2 })
  .auth.user().onCreate(async (user) => {
    await assignAuthenticatedRole(getAuth(), user.uid);
  });
