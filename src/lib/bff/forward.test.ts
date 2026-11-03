import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRefreshCache } from "@/lib/auth/refresh";
import { APP_ORIGIN, authorizationOf, jsonResponse, problem, request, setCookies, stubFetch } from "@/test/helpers";
import { forwardToBackend } from "./forward";

const NEW_TOKENS = { accessToken: "fresh-access", refreshToken: "fresh-refresh", tokenType: "Bearer", expiresIn: 600 };

describe("forwardToBackend", () => {
  beforeEach(() => resetRefreshCache());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("adds the access token from the cookie and returns the API's answer", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ email: "a@b.c" }));

    const response = await forwardToBackend(request("/api/bff/me", { cookies: { kulha_at: "tok", kulha_rt: "rt" } }), ["me"]);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ email: "a@b.c" });
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:8080/api/v1/me");
    expect(authorizationOf(fetchMock.mock.calls[0])).toBe("Bearer tok");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("forwards only the trusted proxy IP with the server-side BFF secret", async () => {
    vi.stubEnv("KULHA_BFF_SHARED_SECRET", "server-only-secret");
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 202 }));

    const response = await forwardToBackend(
      request("/api/bff/auth/forgot-password", {
        method: "POST",
        origin: APP_ORIGIN,
        body: { email: "a@b.c" },
        headers: {
          "x-real-ip": "203.0.113.42",
          "x-kulha-client-ip": "198.51.100.99",
          "x-kulha-bff-secret": "attacker-controlled",
          "x-forwarded-for": "198.51.100.88",
        },
      }),
      ["auth", "forgot-password"],
    );

    expect(response.status).toBe(202);
    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["X-Kulha-Client-IP"]).toBe("203.0.113.42");
    expect(headers["X-Kulha-Bff-Secret"]).toBe("server-only-secret");
    expect(headers["X-Forwarded-For"]).toBeUndefined();
  });

  it("sends no Authorization header for public calls without a session", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 202 }));

    const response = await forwardToBackend(
      request("/api/bff/auth/register", { method: "POST", origin: APP_ORIGIN, body: { email: "a@b.c" } }),
      ["auth", "register"],
    );

    expect(response.status).toBe(202);
    expect(authorizationOf(fetchMock.mock.calls[0])).toBeUndefined();
  });

  it("forwards the JSON body and the query string", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [] }));

    await forwardToBackend(
      request("/api/bff/admin/merchants?status=PENDING&page=1", { cookies: { kulha_at: "tok" } }),
      ["admin", "merchants"],
    );
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:8080/api/v1/admin/merchants?status=PENDING&page=1");

    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    await forwardToBackend(
      request("/api/bff/merchants/apply", { method: "POST", origin: APP_ORIGIN, cookies: { kulha_at: "tok" }, body: { name: "Atlas" } }),
      ["merchants", "apply"],
    );
    expect((fetchMock.mock.calls[1][1] as RequestInit).body).toBe(JSON.stringify({ name: "Atlas" }));
  });

  it("never reaches the token endpoints", async () => {
    const fetchMock = stubFetch();
    for (const action of ["login", "refresh", "logout"]) {
      const response = await forwardToBackend(
        request(`/api/bff/auth/${action}`, { method: "POST", origin: APP_ORIGIN, body: {} }),
        ["auth", action],
      );
      expect(response.status).toBe(404);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a changing request without a trusted origin", async () => {
    const fetchMock = stubFetch();

    const noOrigin = await forwardToBackend(
      request("/api/bff/merchants/apply", { method: "POST", cookies: { kulha_at: "tok" }, body: {} }),
      ["merchants", "apply"],
    );
    const evil = await forwardToBackend(
      request("/api/bff/merchants/apply", { method: "POST", origin: "https://evil.example", cookies: { kulha_at: "tok" }, body: {} }),
      ["merchants", "apply"],
    );

    expect(noOrigin.status).toBe(403);
    expect(evil.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses an oversized body", async () => {
    const fetchMock = stubFetch();

    const response = await forwardToBackend(
      request("/api/bff/merchants/apply", { method: "POST", origin: APP_ORIGIN, body: { text: "x".repeat(120_000) } }),
      ["merchants", "apply"],
    );

    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes first when only the refresh cookie is left, and stores the new cookies", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse(NEW_TOKENS)).mockResolvedValueOnce(jsonResponse({ ok: true }));

    vi.stubEnv("KULHA_BFF_SHARED_SECRET", "server-only-secret");
    const response = await forwardToBackend(
      request("/api/bff/me", {
        cookies: { kulha_rt: "old-rt" },
        headers: { "x-real-ip": "203.0.113.43" },
      }),
      ["me"],
    );

    expect(response.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/v1/auth/refresh");
    const refreshHeaders = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(refreshHeaders["X-Kulha-Client-IP"]).toBe("203.0.113.43");
    expect(refreshHeaders["X-Kulha-Bff-Secret"]).toBe("server-only-secret");
    expect(authorizationOf(fetchMock.mock.calls[1])).toBe("Bearer fresh-access");
    const cookies = setCookies(response).join("\n");
    expect(cookies).toContain("kulha_at=fresh-access");
    expect(cookies).toContain("kulha_rt=fresh-refresh");
    expect(cookies).toContain("HttpOnly");
    expect(cookies).toContain("SameSite=lax");
  });

  it("refreshes and retries once when the API says the access token expired", async () => {
    const fetchMock = stubFetch();
    fetchMock
      .mockResolvedValueOnce(problem(401, "Unauthorized"))
      .mockResolvedValueOnce(jsonResponse(NEW_TOKENS))
      .mockResolvedValueOnce(jsonResponse({ email: "a@b.c" }));

    const response = await forwardToBackend(
      request("/api/bff/me", { cookies: { kulha_at: "expired", kulha_rt: "old-rt" } }),
      ["me"],
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(authorizationOf(fetchMock.mock.calls[0])).toBe("Bearer expired");
    expect(authorizationOf(fetchMock.mock.calls[2])).toBe("Bearer fresh-access");
    expect(setCookies(response).join("\n")).toContain("kulha_at=fresh-access");
  });

  it("clears the session cookies when the refresh token is refused", async () => {
    const fetchMock = stubFetch();
    fetchMock
      .mockResolvedValueOnce(problem(401, "Unauthorized"))
      .mockResolvedValueOnce(problem(401, "Authentication failed"));

    const response = await forwardToBackend(
      request("/api/bff/me", { cookies: { kulha_at: "expired", kulha_rt: "revoked" } }),
      ["me"],
    );

    expect(response.status).toBe(401);
    const cookies = setCookies(response).join("\n");
    expect(cookies).toContain("kulha_at=;");
    expect(cookies).toContain("kulha_rt=;");
    expect(cookies).toContain("Max-Age=0");
  });

  it("keeps the cookies when the API is only temporarily unavailable during a refresh", async () => {
    const fetchMock = stubFetch();
    fetchMock
      .mockResolvedValueOnce(problem(401, "Unauthorized"))
      .mockResolvedValueOnce(problem(500, "Error"));

    const response = await forwardToBackend(
      request("/api/bff/me", { cookies: { kulha_at: "expired", kulha_rt: "fine" } }),
      ["me"],
    );

    expect(response.status).toBe(401);
    expect(setCookies(response)).toEqual([]);
  });

  it("answers 502 with a clear message when the API cannot be reached", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    const response = await forwardToBackend(request("/api/bff/me", { cookies: { kulha_at: "tok" } }), ["me"]);

    expect(response.status).toBe(502);
    expect(setCookies(response)).toEqual([]);
  });

  it("passes Retry-After through on a rate limit and drops other upstream headers", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(
      problem(429, "Too many requests"),
    );
    const limited = new Response(JSON.stringify({ title: "Too many requests", status: 429 }), {
      status: 429,
      headers: { "Content-Type": "application/problem+json", "Retry-After": "42", "Set-Cookie": "evil=1", "X-Internal": "secret" },
    });
    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(limited);

    const response = await forwardToBackend(
      request("/api/bff/auth/forgot-password", { method: "POST", origin: APP_ORIGIN, body: { email: "a@b.c" } }),
      ["auth", "forgot-password"],
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("42");
    expect(response.headers.get("x-internal")).toBeNull();
    expect(setCookies(response)).toEqual([]);
  });

  it("returns no body for a 204", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const response = await forwardToBackend(
      request("/api/bff/auth/reset-password", { method: "POST", origin: APP_ORIGIN, body: { token: "t", newPassword: "a-long-password" } }),
      ["auth", "reset-password"],
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });
});
