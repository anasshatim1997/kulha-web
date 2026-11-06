import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getConfig } from "@/lib/config";

export const GOOGLE_OAUTH_COOKIE = "kulha_google_oauth";
const MAX_AGE_SECONDS = 10 * 60;

type OAuthState = { state: string; nonce: string; verifier: string; next: string; createdAt: number };

function base64url(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}

function sign(payload: string): string {
  const secret = getConfig().googleOAuthStateSecret;
  if (!secret) throw new Error("Google sign-in requires GOOGLE_OAUTH_STATE_SECRET");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createOAuthState(next: string): { cookie: string; state: OAuthState; challenge: string } {
  const state: OAuthState = {
    state: randomBytes(32).toString("base64url"),
    nonce: randomBytes(32).toString("base64url"),
    verifier: randomBytes(32).toString("base64url"),
    next,
    createdAt: Date.now(),
  };
  const payload = base64url(JSON.stringify(state));
  return { cookie: `${payload}.${sign(payload)}`, state, challenge: createHash("sha256").update(state.verifier).digest("base64url") };
}

export function readOAuthState(value: string | undefined): OAuthState | null {
  if (!value) return null;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  let expected: string;
  try { expected = sign(payload); } catch { return null; }
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as OAuthState;
    if (typeof parsed.state !== "string" || typeof parsed.nonce !== "string" || typeof parsed.verifier !== "string"
      || typeof parsed.next !== "string" || typeof parsed.createdAt !== "number"
      || Date.now() - parsed.createdAt > MAX_AGE_SECONDS * 1000 || parsed.createdAt > Date.now() + 30_000) return null;
    return parsed;
  } catch { return null; }
}

export const googleOAuthCookieOptions = (secure: boolean) => ({
  httpOnly: true, secure, sameSite: "lax" as const, path: "/api/auth/google", maxAge: MAX_AGE_SECONDS,
});
