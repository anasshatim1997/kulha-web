import { afterEach, describe, expect, it, vi } from "vitest";
import { APP_ORIGIN, jsonResponse, problem, request, setCookies, stubFetch } from "@/test/helpers";
import { handleLogin, handleLogout } from "./session";

const TOKENS = { accessToken: "access-secret", refreshToken: "refresh-secret", tokenType: "Bearer", expiresIn: 600 };

describe("handleLogin", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("stores the tokens in HttpOnly cookies and never returns them to the page", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse(TOKENS));

    const response = await handleLogin(
      request("/api/auth/login", { method: "POST", origin: APP_ORIGIN, body: { email: "a@b.c", password: "a-long-password" } }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    const cookies = setCookies(response);
    expect(cookies.find((c) => c.startsWith("kulha_at=access-secret"))).toContain("HttpOnly");
    expect(cookies.find((c) => c.startsWith("kulha_at="))).toContain("Max-Age=600");
    expect(cookies.find((c) => c.startsWith("kulha_rt=refresh-secret"))).toContain("HttpOnly");
    expect(cookies.find((c) => c.startsWith("kulha_rt="))).toContain("Max-Age=2592000");
    expect(cookies.every((c) => c.includes("SameSite=lax"))).toBe(true);
  });

  it("passes a failed login through without setting cookies", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(problem(401, "Authentication failed"));

    const response = await handleLogin(
      request("/api/auth/login", { method: "POST", origin: APP_ORIGIN, body: { email: "a@b.c", password: "wrong" } }),
    );

    expect(response.status).toBe(401);
    expect(setCookies(response)).toEqual([]);
  });

  it("passes the rate limit through with Retry-After", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(
      new Response("{}", { status: 429, headers: { "Content-Type": "application/problem+json", "Retry-After": "30" } }),
    );

    const response = await handleLogin(
      request("/api/auth/login", { method: "POST", origin: APP_ORIGIN, body: { email: "a@b.c", password: "x" } }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("30");
  });

  it("refuses a login that does not come from our own pages", async () => {
    const fetchMock = stubFetch();

    const response = await handleLogin(
      request("/api/auth/login", { method: "POST", origin: "https://evil.example", body: { email: "a@b.c", password: "x" } }),
    );

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 502 when the API sends something unexpected", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ unexpected: true }));

    const response = await handleLogin(
      request("/api/auth/login", { method: "POST", origin: APP_ORIGIN, body: { email: "a@b.c", password: "x" } }),
    );

    expect(response.status).toBe(502);
    expect(setCookies(response)).toEqual([]);
  });

  it("answers 502 when the API cannot be reached", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    const response = await handleLogin(
      request("/api/auth/login", { method: "POST", origin: APP_ORIGIN, body: { email: "a@b.c", password: "x" } }),
    );

    expect(response.status).toBe(502);
  });
});

describe("handleLogout", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("revokes the session on the API and clears both cookies", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const response = await handleLogout(
      request("/api/auth/logout", { method: "POST", origin: APP_ORIGIN, cookies: { kulha_at: "a", kulha_rt: "the-refresh" } }),
    );

    expect(response.status).toBe(204);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/v1/auth/logout");
    expect((fetchMock.mock.calls[0][1] as RequestInit).body).toBe(JSON.stringify({ refreshToken: "the-refresh" }));
    const cookies = setCookies(response).join("\n");
    expect(cookies).toContain("kulha_at=;");
    expect(cookies).toContain("kulha_rt=;");
  });

  it("still clears the cookies when the API is down", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    const response = await handleLogout(
      request("/api/auth/logout", { method: "POST", origin: APP_ORIGIN, cookies: { kulha_rt: "r" } }),
    );

    expect(response.status).toBe(204);
    expect(setCookies(response).join("\n")).toContain("Max-Age=0");
  });

  it("works without any cookie and refuses a foreign origin", async () => {
    const fetchMock = stubFetch();

    const ok = await handleLogout(request("/api/auth/logout", { method: "POST", origin: APP_ORIGIN }));
    const evil = await handleLogout(request("/api/auth/logout", { method: "POST", origin: "https://evil.example" }));

    expect(ok.status).toBe(204);
    expect(evil.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
