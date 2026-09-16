import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase web configuration is public by design and is included in the
// browser bundle. Database access is still protected by Firebase Auth and RLS.
const firebaseConfig = {
  apiKey: 'AIzaSyAUwHJlfG27QWdAVpeIASLP9jnMIlko4Q4',
  authDomain: 'lore-376a9.firebaseapp.com',
  projectId: 'lore-376a9',
  storageBucket: 'lore-376a9.firebasestorage.app',
  messagingSenderId: '1034653945000',
  appId: '1:1034653945000:web:a0c53d2854cac84ce7069d',
};

export function getFirebaseAuth() {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}
