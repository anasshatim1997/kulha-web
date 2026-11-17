import { NextRequest } from "next/server";
import { vi } from "vitest";

/** The BFF's default public origin (see `getConfig().appOrigin`); tests that need another one stub APP_ORIGIN. */
export const APP_ORIGIN = "http://localhost:3000";

/** A JSON `Response`, like the Spring API (or Google's token endpoint) would send. */
export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/** An RFC 7807 problem response, as the API sends for failures. */
export function problem(status: number, title: string, detail?: string, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(detail === undefined ? { title, status } : { title, status, detail }), {
    status,
    headers: { "Content-Type": "application/problem+json", ...headers },
  });
}

/** Replaces the global `fetch` with a typed mock. Pair with `vi.unstubAllGlobals()` in `afterEach`. */
export function stubFetch() {
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

type RequestOptions = {
  method?: string;
  /** Sent as the `Origin` header (the CSRF check compares it with APP_ORIGIN). */
  origin?: string;
  cookies?: Record<string, string>;
  /** JSON-encoded into the request body. */
  body?: unknown;
  headers?: Record<string, string>;
};

/** Builds an incoming `NextRequest` for a BFF route handler. */
export function request(path: string, options: RequestOptions = {}): NextRequest {
  const { method = "GET", origin, cookies, body, headers = {} } = options;
  const finalHeaders = new Headers(headers);
  if (origin !== undefined) finalHeaders.set("origin", origin);
  if (cookies && Object.keys(cookies).length > 0) {
    finalHeaders.set("cookie", Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join("; "));
  }
  const hasBody = body !== undefined && method !== "GET" && method !== "HEAD";
  if (hasBody && !finalHeaders.has("content-type")) finalHeaders.set("content-type", "application/json");
  return new NextRequest(new URL(path, APP_ORIGIN), {
    method,
    headers: finalHeaders,
    body: hasBody ? JSON.stringify(body) : undefined,
  });
}

/** Every `Set-Cookie` header on a response, one string per cookie. */
export function setCookies(response: Response): string[] {
  return response.headers.getSetCookie();
}

/** The `Authorization` header the code under test sent on a recorded `fetch` call (undefined if none). */
export function authorizationOf(call: Parameters<typeof fetch> | readonly unknown[]): string | undefined {
  const init = call[1] as RequestInit | undefined;
  const headers = init?.headers;
  if (!headers) return undefined;
  if (headers instanceof Headers) return headers.get("authorization") ?? undefined;
  if (Array.isArray(headers)) return headers.find(([name]) => name.toLowerCase() === "authorization")?.[1];
  const record = headers as Record<string, string>;
  const key = Object.keys(record).find((name) => name.toLowerCase() === "authorization");
  return key ? record[key] : undefined;
}
