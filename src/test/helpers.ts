import { NextRequest } from "next/server";
import { vi } from "vitest";

export const APP_ORIGIN = "http://localhost:3000";

export function stubFetch() {
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export function problem(status: number, title: string) {
  return new Response(JSON.stringify({ type: "about:blank", title, status }), {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });
}

export function request(
  path: string,
  options: { method?: string; cookies?: Record<string, string>; origin?: string | null; body?: unknown } = {},
) {
  const headers: Record<string, string> = {};
  if (options.cookies) {
    headers.cookie = Object.entries(options.cookies).map(([k, v]) => `${k}=${v}`).join("; ");
  }
  if (options.origin !== null && options.origin !== undefined) headers.origin = options.origin;
  if (options.body !== undefined) headers["content-type"] = "application/json";
  return new NextRequest(`${APP_ORIGIN}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

export function setCookies(response: Response): string[] {
  return response.headers.getSetCookie();
}

export function authorizationOf(call: unknown[]): string | undefined {
  const init = call[1] as RequestInit | undefined;
  return (init?.headers as Record<string, string> | undefined)?.Authorization;
}
