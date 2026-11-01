export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  /** Lifetime of the access token, in seconds. */
  expiresIn: number;
};

/** Checks the shape of a token response coming from the API. */
export function parseTokens(data: unknown): SessionTokens | null {
  if (typeof data !== "object" || data === null) return null;
  const { accessToken, refreshToken, expiresIn } = data as Record<string, unknown>;
  if (typeof accessToken !== "string" || accessToken === "") return null;
  if (typeof refreshToken !== "string" || refreshToken === "") return null;
  if (typeof expiresIn !== "number" || !Number.isFinite(expiresIn) || expiresIn <= 0) return null;
  return { accessToken, refreshToken, expiresIn };
}
