import { NextResponse, type NextRequest } from "next/server";
import { backendRequest, BackendUnavailableError } from "@/lib/auth/backend";
import { REFRESH_COOKIE, applySessionCookies, clearSessionCookies } from "@/lib/auth/cookies";
import { parseTokens } from "@/lib/auth/tokens";
import { getConfig } from "@/lib/config";
import { isTrustedMutation } from "@/lib/security/origin";
import { trustedProxyClientIp } from "@/lib/security/client-ip";
import { copyResponse, problemResponse } from "./responses";

const MAX_BODY_BYTES = 10_000;

/** Logs in through the API and stores the tokens in HttpOnly cookies. The browser never receives them. */
export async function handleLogin(request: NextRequest): Promise<NextResponse> {
  const config = getConfig();
  if (!isTrustedMutation(request.headers, config.appOrigin)) {
    return problemResponse(403, "Forbidden", "Request origin not allowed.");
  }
  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) return problemResponse(413, "Request too large");

  try {
    const upstream = await backendRequest("/api/v1/auth/login", {
      method: "POST",
      body,
      clientIp: trustedProxyClientIp(request.headers),
    });
    if (upstream.status !== 200) return copyResponse(upstream);

    const tokens = parseTokens(await upstream.json().catch(() => null));
    if (!tokens) return problemResponse(502, "Service unavailable", "Unexpected answer from the server.");

    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    applySessionCookies(response, tokens, config.secureCookies);
    return response;
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      return problemResponse(502, "Service unavailable", "The server cannot be reached. Try again shortly.");
    }
    throw error;
  }
}

/**
 * Confirms an email address with its one-time token. The API answers with a session when the account is
 * active, so the person is signed in right after confirming. Like login, the tokens go into HttpOnly
 * cookies and are never returned to the page, which is why this route is not part of the generic /api/bff proxy.
 */
export async function handleVerifyEmail(request: NextRequest): Promise<NextResponse> {
  const config = getConfig();
  if (!isTrustedMutation(request.headers, config.appOrigin)) {
    return problemResponse(403, "Forbidden", "Request origin not allowed.");
  }
  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) return problemResponse(413, "Request too large");

  try {
    const upstream = await backendRequest("/api/v1/auth/verify-email", {
      method: "POST",
      body,
      clientIp: trustedProxyClientIp(request.headers),
    });
    const headers = { "Cache-Control": "no-store" };
    // 204: the address is confirmed but no session was issued (for example a disabled account).
    if (upstream.status === 204) return NextResponse.json({ ok: true, signedIn: false }, { headers });
    if (upstream.status !== 200) return copyResponse(upstream);

    const tokens = parseTokens(await upstream.json().catch(() => null));
    if (!tokens) return problemResponse(502, "Service unavailable", "Unexpected answer from the server.");

    const response = NextResponse.json({ ok: true, signedIn: true }, { headers });
    applySessionCookies(response, tokens, config.secureCookies);
    return response;
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      return problemResponse(502, "Service unavailable", "The server cannot be reached. Try again shortly.");
    }
    throw error;
  }
}

/** Ends the session on the API (best effort) and clears the cookies. */
export async function handleLogout(request: NextRequest): Promise<NextResponse> {
  const config = getConfig();
  if (!isTrustedMutation(request.headers, config.appOrigin)) {
    return problemResponse(403, "Forbidden", "Request origin not allowed.");
  }
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    try {
      await backendRequest("/api/v1/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) });
    } catch {
      // The cookies are cleared anyway; the refresh token expires on its own.
    }
  }
  const response = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  clearSessionCookies(response, config.secureCookies);
  return response;
}
