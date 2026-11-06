import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { backendRequest, BackendUnavailableError } from "@/lib/auth/backend";
import { applySessionCookies } from "@/lib/auth/cookies";
import { GOOGLE_OAUTH_COOKIE, googleOAuthCookieOptions, readOAuthState } from "@/lib/auth/google-oauth";
import { parseTokens } from "@/lib/auth/tokens";
import { getConfig } from "@/lib/config";
import { trustedProxyClientIp } from "@/lib/security/client-ip";
import { localeFromPath, localePath, safeNext } from "@/lib/navigation";

/** First 8 hex characters of SHA-256, to compare the shared secret with the API's log line without revealing it. */
const fingerprint = (value: string) => (value ? createHash("sha256").update(value).digest("hex").slice(0, 8) : "NOT SET");

/** Back to the login page in the language the person started from. */
function loginPath(origin: string, reason: string, next?: string) {
  const url = new URL(localePath(next ? localeFromPath(next) : "fr", "/login"), origin);
  url.searchParams.set("oauth", reason);
  return url;
}

/**
 * Server-side only. The person sees a short reason code on the login page; the operator needs the real
 * cause in the logs (for example redirect_uri_mismatch or invalid_client). Never log tokens, codes or secrets.
 */
function logFailure(reason: string, detail: Record<string, unknown> = {}) {
  console.error(`[google-oauth] ${reason}`, detail);
}

/** Google's error answer is JSON like { error: "redirect_uri_mismatch" }; keep only the short code. */
async function googleErrorCode(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  const code = typeof body === "object" && body !== null ? (body as Record<string, unknown>).error : undefined;
  return typeof code === "string" ? code.slice(0, 80) : "unknown";
}

export async function GET(request: NextRequest) {
  const config = getConfig();
  const origin = config.appOrigin;
  let next: string | undefined;
  const fail = (reason: string) => {
    const response = NextResponse.redirect(loginPath(origin, reason, next));
    response.cookies.set(GOOGLE_OAUTH_COOKIE, "", { ...googleOAuthCookieOptions(config.secureCookies), maxAge: 0 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  };

  if (!config.googleClientId || !config.googleClientSecret || !config.googleOAuthStateSecret) {
    logFailure("not_configured", {
      hasClientId: Boolean(config.googleClientId),
      hasClientSecret: Boolean(config.googleClientSecret),
      hasOAuthStateSecret: Boolean(config.googleOAuthStateSecret),
    });
    return fail("not_configured");
  }

  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) {
    // access_denied is the person pressing "Cancel" on Google's page; anything else is worth knowing about.
    if (providerError !== "access_denied") logFailure("provider_error", { error: providerError.slice(0, 80) });
    return fail("cancelled");
  }
  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const oauth = readOAuthState(request.cookies.get(GOOGLE_OAUTH_COOKIE)?.value);
  if (oauth) next = oauth.next;
  if (!code || !returnedState || !oauth || returnedState !== oauth.state) {
    // Usually a missing/expired state cookie (more than 10 minutes on Google's page, or cookies blocked),
    // or GOOGLE_OAUTH_STATE_SECRET differing between instances.
    logFailure("invalid_state", { hasCode: Boolean(code), hasState: Boolean(returnedState), hasCookie: Boolean(oauth) });
    return fail("invalid_state");
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        code, client_id: config.googleClientId, client_secret: config.googleClientSecret,
        redirect_uri: config.googleRedirectUri, grant_type: "authorization_code", code_verifier: oauth.verifier,
      }), cache: "no-store", signal: AbortSignal.timeout(10_000),
    });
    if (!tokenResponse.ok) {
      logFailure("token_exchange_rejected", {
        status: tokenResponse.status,
        googleError: await googleErrorCode(tokenResponse),
        redirectUri: config.googleRedirectUri, // must match the "Authorized redirect URI" in Google Cloud exactly
      });
      return fail("exchange_failed");
    }
    const providerTokens: unknown = await tokenResponse.json().catch(() => null);
    if (typeof providerTokens !== "object" || providerTokens === null) return fail("exchange_failed");
    const idToken = (providerTokens as Record<string, unknown>).id_token;
    if (typeof idToken !== "string" || !idToken) {
      logFailure("no_id_token", { hint: "the openid scope must be granted" });
      return fail("exchange_failed");
    }

    const upstream = await backendRequest("/api/v1/auth/google", {
      method: "POST", body: JSON.stringify({ idToken, nonce: oauth.nonce }),
      clientIp: trustedProxyClientIp(request.headers), bffAuthenticated: true,
    });
    if (!upstream.ok) {
      logFailure("api_rejected", { status: upstream.status, bffSecretFingerprint: fingerprint(config.bffSharedSecret) });
      return fail(upstream.status === 503 ? "not_configured" : upstream.status === 429 ? "rate_limited" : "authentication_failed");
    }
    const tokens = parseTokens(await upstream.json().catch(() => null));
    if (!tokens) {
      logFailure("api_bad_answer");
      return fail("authentication_failed");
    }

    const response = NextResponse.redirect(new URL(safeNext(oauth.next), origin));
    applySessionCookies(response, tokens, config.secureCookies);
    response.cookies.set(GOOGLE_OAUTH_COOKIE, "", { ...googleOAuthCookieOptions(config.secureCookies), maxAge: 0 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      logFailure("api_unreachable");
      return fail("service_unavailable");
    }
    logFailure("unexpected_error", { name: error instanceof Error ? error.name : typeof error });
    return fail("authentication_failed");
  }
}
