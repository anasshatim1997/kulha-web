import { backendRequest, BackendUnavailableError } from "./backend";
import { parseTokens, type SessionTokens } from "./tokens";

export type RefreshResult =
  | { status: "ok"; tokens: SessionTokens }
  | { status: "invalid" } // the API refused the refresh token: the session is over
  | { status: "unavailable" }; // network error, rate limit or API error: the session may still be fine

/**
 * The API rotates refresh tokens and treats the reuse of an old one as theft, which ends the session.
 * A page that fires several requests at once, all with the same expired access token, would make
 * every one of them refresh with the same refresh token. So the first refresh is shared: concurrent
 * and slightly later requests (before the browser has stored the new cookies) get the same result.
 */
const REUSE_WINDOW_MS = 10_000;
const results = new Map<string, { promise: Promise<RefreshResult>; startedAt: number }>();

export function refreshSession(
  refreshToken: string,
  now: number = Date.now(),
  clientIp?: string,
): Promise<RefreshResult> {
  for (const [key, entry] of results) {
    if (now - entry.startedAt > REUSE_WINDOW_MS) results.delete(key);
  }
  const existing = results.get(refreshToken);
  if (existing) return existing.promise;

  const promise = callRefreshEndpoint(refreshToken, clientIp);
  results.set(refreshToken, { promise, startedAt: now });
  void promise.then((result) => {
    // A temporary failure must not be remembered: the next request may try again.
    if (result.status === "unavailable") results.delete(refreshToken);
  });
  return promise;
}

/** For tests. */
export function resetRefreshCache(): void {
  results.clear();
}

async function callRefreshEndpoint(refreshToken: string, clientIp?: string): Promise<RefreshResult> {
  try {
    const response = await backendRequest("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
      clientIp,
    });
    if (response.status === 200) {
      const tokens = parseTokens(await response.json().catch(() => null));
      return tokens ? { status: "ok", tokens } : { status: "unavailable" };
    }
    if (response.status === 400 || response.status === 401) return { status: "invalid" };
    return { status: "unavailable" };
  } catch (error) {
    if (error instanceof BackendUnavailableError) return { status: "unavailable" };
    return { status: "unavailable" };
  }
}
