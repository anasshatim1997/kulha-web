import type { NextResponse } from "next/server";
import type { SessionTokens } from "./tokens";

export const ACCESS_COOKIE = "kulha_at";
export const REFRESH_COOKIE = "kulha_rt";

const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function baseOptions(secure: boolean) {
  // HttpOnly: JavaScript in the page can never read the tokens.
  // SameSite=Lax: the browser does not send them on cross-site POST requests.
  return { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };
}

export function applySessionCookies(response: NextResponse, tokens: SessionTokens, secure: boolean): void {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...baseOptions(secure),
    maxAge: Math.max(1, Math.floor(tokens.expiresIn)),
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseOptions(secure),
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookies(response: NextResponse, secure: boolean): void {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    response.cookies.set(name, "", { ...baseOptions(secure), maxAge: 0 });
  }
}
