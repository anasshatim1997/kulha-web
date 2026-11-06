import { NextRequest, NextResponse } from "next/server";
import { createOAuthState, GOOGLE_OAUTH_COOKIE, googleOAuthCookieOptions } from "@/lib/auth/google-oauth";
import { getConfig } from "@/lib/config";
import { safeNext } from "@/lib/navigation";

export async function GET(request: NextRequest) {
  const config = getConfig();
  if (!config.googleClientId || !config.googleClientSecret || !config.googleOAuthStateSecret) {
    const login = new URL("/login", config.appOrigin);
    login.searchParams.set("oauth", "not_configured");
    return NextResponse.redirect(login);
  }
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const { cookie, state, challenge } = createOAuthState(next);
  const authorization = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorization.searchParams.set("client_id", config.googleClientId);
  authorization.searchParams.set("redirect_uri", config.googleRedirectUri);
  authorization.searchParams.set("response_type", "code");
  authorization.searchParams.set("scope", "openid email profile");
  authorization.searchParams.set("state", state.state);
  authorization.searchParams.set("nonce", state.nonce);
  authorization.searchParams.set("code_challenge", challenge);
  authorization.searchParams.set("code_challenge_method", "S256");
  authorization.searchParams.set("prompt", "select_account");
  const response = NextResponse.redirect(authorization);
  response.cookies.set(GOOGLE_OAUTH_COOKIE, cookie, googleOAuthCookieOptions(config.secureCookies));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
