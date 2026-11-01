import type { NextRequest, NextResponse } from "next/server";
import { backendRequest, BackendUnavailableError } from "@/lib/auth/backend";
import { ACCESS_COOKIE, REFRESH_COOKIE, applySessionCookies, clearSessionCookies } from "@/lib/auth/cookies";
import { refreshSession } from "@/lib/auth/refresh";
import type { SessionTokens } from "@/lib/auth/tokens";
import { getConfig } from "@/lib/config";
import { isTrustedMutation } from "@/lib/security/origin";
import { resolveBackendPath } from "./policy";
import { copyResponse, problemResponse } from "./responses";

const MAX_BODY_BYTES = 100_000;
const METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

/**
 * Backend-for-frontend: the browser calls /api/bff/..., this function adds the access token from the
 * HttpOnly cookie, refreshes it when it has expired, and returns the API's answer.
 */
export async function forwardToBackend(request: NextRequest, segments: string[]): Promise<NextResponse> {
  const config = getConfig();

  const path = resolveBackendPath(segments);
  if (!path) return problemResponse(404, "Not found");
  if (!METHODS.has(request.method)) return problemResponse(405, "Method not allowed");

  const mutating = request.method !== "GET";
  if (mutating && !isTrustedMutation(request.headers, config.appOrigin)) {
    return problemResponse(403, "Forbidden", "Request origin not allowed.");
  }

  let body: string | undefined;
  if (mutating) {
    body = await request.text();
    if (body.length > MAX_BODY_BYTES) return problemResponse(413, "Request too large");
  }

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  let refreshed: SessionTokens | undefined;
  let sessionEnded = false;

  const tryRefresh = async (): Promise<boolean> => {
    if (!refreshToken) return false;
    const result = await refreshSession(refreshToken);
    if (result.status === "ok") {
      refreshed = result.tokens;
      accessToken = result.tokens.accessToken;
      return true;
    }
    if (result.status === "invalid") sessionEnded = true;
    return false;
  };

  const call = () =>
    backendRequest(`${path}${request.nextUrl.search}`, { method: request.method, body, accessToken });

  try {
    if (!accessToken) await tryRefresh();
    let upstream = await call();
    if (upstream.status === 401 && accessToken && refreshToken && !refreshed) {
      if (await tryRefresh()) upstream = await call();
    }

    const response = await copyResponse(upstream);
    if (refreshed) applySessionCookies(response, refreshed, config.secureCookies);
    else if (sessionEnded) clearSessionCookies(response, config.secureCookies);
    return response;
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      return problemResponse(502, "Service unavailable", "The server cannot be reached. Try again shortly.");
    }
    throw error;
  }
}
