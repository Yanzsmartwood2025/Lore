import type { User } from 'firebase/auth';

const pendingClaims = new WeakMap<User, Promise<string>>();

// onCreate is asynchronous: the first sign-in token can predate the claim.
// Bound the wait, deduplicate callers, and never silently fall back to anon.
export function getSupabaseToken(user: User): Promise<string> {
  const pending = pendingClaims.get(user);
  if (pending) return pending;
  const result = (async () => {
    for (const delay of [0, 500, 1000, 2000, 4000, 8000]) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      const token = await user.getIdTokenResult(delay !== 0);
      if (token.claims.role === 'authenticated') return token.token;
    }
    throw new Error('Tu cuenta todavía se está preparando. Vuelve a intentar en unos momentos.');
  })();
  pendingClaims.set(user, result);
  void result.finally(() => pendingClaims.delete(user)).catch(() => undefined);
  return result;
}
