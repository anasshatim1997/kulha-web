import { NextRequest, NextResponse } from "next/server";
import { backendRequest, BackendUnavailableError } from "@/lib/auth/backend";
import { applySessionCookies } from "@/lib/auth/cookies";
import { GOOGLE_OAUTH_COOKIE, googleOAuthCookieOptions, readOAuthState } from "@/lib/auth/google-oauth";
import { parseTokens } from "@/lib/auth/tokens";
import { getConfig } from "@/lib/config";
import { trustedProxyClientIp } from "@/lib/security/client-ip";
import { safeNext } from "@/lib/navigation";

function loginPath(origin: string, reason: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("oauth", reason);
  return url;
}

export async function GET(request: NextRequest) {
  const config = getConfig();
  const origin = config.appOrigin;
  const fail = (reason: string) => {
    const response = NextResponse.redirect(loginPath(origin, reason));
    response.cookies.set(GOOGLE_OAUTH_COOKIE, "", { ...googleOAuthCookieOptions(config.secureCookies), maxAge: 0 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  };

  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) return fail("cancelled");
  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const oauth = readOAuthState(request.cookies.get(GOOGLE_OAUTH_COOKIE)?.value);
  if (!code || !returnedState || !oauth || returnedState !== oauth.state) return fail("invalid_state");

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        code, client_id: config.googleClientId, client_secret: config.googleClientSecret,
        redirect_uri: config.googleRedirectUri, grant_type: "authorization_code", code_verifier: oauth.verifier,
      }), cache: "no-store", signal: AbortSignal.timeout(10_000),
    });
    if (!tokenResponse.ok) return fail("exchange_failed");
    const providerTokens: unknown = await tokenResponse.json().catch(() => null);
    if (typeof providerTokens !== "object" || providerTokens === null) return fail("exchange_failed");
    const idToken = (providerTokens as Record<string, unknown>).id_token;
    if (typeof idToken !== "string" || !idToken) return fail("exchange_failed");

    const upstream = await backendRequest("/api/v1/auth/google", {
      method: "POST", body: JSON.stringify({ idToken, nonce: oauth.nonce }),
      clientIp: trustedProxyClientIp(request.headers), bffAuthenticated: true,
    });
    if (!upstream.ok) {
      if (upstream.status === 429) return fail("rate_limited");
      return fail(upstream.status === 503 ? "not_configured" : "authentication_failed");
    }
    const tokens = parseTokens(await upstream.json().catch(() => null));
    if (!tokens) return fail("authentication_failed");

    const response = NextResponse.redirect(new URL(safeNext(oauth.next), origin));
    applySessionCookies(response, tokens, config.secureCookies);
    response.cookies.set(GOOGLE_OAUTH_COOKIE, "", { ...googleOAuthCookieOptions(config.secureCookies), maxAge: 0 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof BackendUnavailableError) return fail("service_unavailable");
    return fail("authentication_failed");
  }
}
