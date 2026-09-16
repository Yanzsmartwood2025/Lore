import 'server-only';

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

const FIREBASE_PROJECT_ID = 'lore-376a9';
const FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

export type FirebaseIdentity = JWTPayload & {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
};

export async function verifyFirebaseRequest(request: Request): Promise<FirebaseIdentity | null> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      algorithms: ['RS256'],
      audience: FIREBASE_PROJECT_ID,
      issuer: FIREBASE_ISSUER,
    });

    if (!payload.sub) return null;
    return payload as FirebaseIdentity;
  } catch {
    return null;
  }
}
