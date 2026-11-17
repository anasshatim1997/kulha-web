import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { backendRequest, BackendUnavailableError } from "@/lib/auth/backend";
import { getConfig } from "@/lib/config";
import { trustedProxyClientIp } from "@/lib/security/client-ip";
import { isTrustedMutation } from "@/lib/security/origin";
import { resolveBackendPath } from "@/lib/bff/policy";
import { copyPublicResponse, copyResponse, problemResponse } from "@/lib/bff/responses";

/** Anonymous, read-only BFF forwarding for public basket discovery. Session cookies are intentionally ignored. */
export async function forwardPublicOfferRequest(request: NextRequest, segments: string[]) {
  const config = getConfig();
  const path = resolveBackendPath(["offers", ...segments]);
  if (!path) return problemResponse(404, "Not found");

  if (request.method !== "GET") {
    if (!isTrustedMutation(request.headers, config.appOrigin)) {
      return problemResponse(403, "Forbidden", "Request origin not allowed.");
    }
    return problemResponse(405, "Method not allowed");
  }

  const forwardedHeaders: Record<string, string> = {};
  const correlationId = request.headers.get("X-Correlation-Id") ?? randomUUID();
  forwardedHeaders["X-Correlation-Id"] = correlationId;

  try {
    const upstream = await backendRequest(`${path}${request.nextUrl.search}`, {
      method: "GET",
      clientIp: trustedProxyClientIp(request.headers),
      forwardedHeaders,
    });
    return await copyPublicResponse(upstream);
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      return problemResponse(502, "Service unavailable", "The server cannot be reached. Try again shortly.");
    }
    throw error;
  }
}

/** Same-origin, anonymous POST used only for the customer's one-time nearby map search. */
export async function forwardPublicNearbyRequest(request: NextRequest) {
  const config = getConfig();
  const path = resolveBackendPath(["offers", "nearby"]);
  if (!path) return problemResponse(404, "Not found");
  if (request.method !== "POST") return problemResponse(405, "Method not allowed");
  if (!isTrustedMutation(request.headers, config.appOrigin)) {
    return problemResponse(403, "Forbidden", "Request origin not allowed.");
  }

  const body = await request.text();
  if (!body || body.length > 8_192) return problemResponse(body ? 413 : 400, body ? "Payload too large" : "Invalid request");
  try {
    const value: unknown = JSON.parse(body);
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return problemResponse(400, "Invalid request");
    }
  } catch {
    return problemResponse(400, "Invalid request");
  }

  const forwardedHeaders: Record<string, string> = {
    "X-Correlation-Id": request.headers.get("X-Correlation-Id") ?? randomUUID(),
  };

  try {
    const upstream = await backendRequest(path, {
      method: "POST",
      body,
      clientIp: trustedProxyClientIp(request.headers),
      forwardedHeaders,
    });
    return await copyResponse(upstream);
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      return problemResponse(502, "Service unavailable", "The server cannot be reached. Try again shortly.");
    }
    throw error;
  }
}
