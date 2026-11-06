import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as googleCallback } from "@/app/api/auth/google/callback/route";
import { GET as startGoogle } from "@/app/api/auth/google/route";
import { APP_ORIGIN, jsonResponse, request, setCookies, stubFetch } from "@/test/helpers";
import { createOAuthState, GOOGLE_OAUTH_COOKIE } from "./google-oauth";

const API = "http://api.internal:8080";
const TOKENS = { accessToken: "access-secret", refreshToken: "refresh-secret", tokenType: "Bearer", expiresIn: 600 };

function configure() {
  vi.stubEnv("APP_ORIGIN", APP_ORIGIN);
  vi.stubEnv("API_BASE_URL", API);
  vi.stubEnv("KULHA_BFF_SHARED_SECRET", "bff-secret-for-tests");
  vi.stubEnv("GOOGLE_CLIENT_ID", "client-id.apps.googleusercontent.com");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "google-client-secret");
  vi.stubEnv("GOOGLE_OAUTH_STATE_SECRET", "test-only-long-secret-for-google-route-tests");
}

function callbackRequest(options: { query?: string; cookie?: string; headers?: Record<string, string> }) {
  return request(`/api/auth/google/callback${options.query ?? ""}`, {
    cookies: options.cookie ? { [GOOGLE_OAUTH_COOKIE]: options.cookie } : undefined,
    headers: options.headers,
  });
}

function location(response: Response): URL {
  return new URL(response.headers.get("location") ?? "");
}

function sessionCookiesOf(response: Response) {
  return setCookies(response).filter((c) => c.startsWith("kulha_at=") || c.startsWith("kulha_rt="));
}

beforeEach(configure);
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GET /api/auth/google (start)", () => {
  it("redirects to Google with state, nonce and an S256 PKCE challenge, and sets a scoped HttpOnly cookie", async () => {
    const response = await startGoogle(request("/api/auth/google?next=/account"));

    expect(response.status).toBe(307);
    const target = location(response);
    expect(target.origin + target.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(target.searchParams.get("client_id")).toBe("client-id.apps.googleusercontent.com");
    expect(target.searchParams.get("redirect_uri")).toBe(`${APP_ORIGIN}/api/auth/google/callback`);
    expect(target.searchParams.get("response_type")).toBe("code");
    expect(target.searchParams.get("scope")).toBe("openid email profile");
    expect(target.searchParams.get("code_challenge_method")).toBe("S256");
    expect(target.searchParams.get("code_challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(target.searchParams.get("state")).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(target.searchParams.get("nonce")).toMatch(/^[A-Za-z0-9_-]{40,}$/);

    const cookie = setCookies(response).find((c) => c.startsWith(`${GOOGLE_OAUTH_COOKIE}=`)) ?? "";
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=lax");
    expect(cookie).toContain("Path=/api/auth/google");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("starts every attempt with a fresh state, nonce and challenge", async () => {
    const first = location(await startGoogle(request("/api/auth/google")));
    const second = location(await startGoogle(request("/api/auth/google")));

    for (const key of ["state", "nonce", "code_challenge"]) {
      expect(first.searchParams.get(key)).not.toBe(second.searchParams.get(key));
    }
  });

  it("goes back to the login page without any cookie when Google is not configured", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");

    const response = await startGoogle(request("/api/auth/google"));

    expect(location(response).pathname).toBe("/login");
    expect(location(response).searchParams.get("oauth")).toBe("not_configured");
    expect(setCookies(response).some((c) => c.startsWith(`${GOOGLE_OAUTH_COOKIE}=`))).toBe(false);
  });

  it("requires the dedicated OAuth state secret", async () => {
    vi.stubEnv("GOOGLE_OAUTH_STATE_SECRET", "");

    const response = await startGoogle(request("/api/auth/google"));

    expect(location(response).pathname).toBe("/login");
    expect(location(response).searchParams.get("oauth")).toBe("not_configured");
    expect(setCookies(response).some((c) => c.startsWith(`${GOOGLE_OAUTH_COOKIE}=`))).toBe(false);
  });
});

describe("GET /api/auth/google/callback", () => {
  async function expectRejectedBeforeAnyNetworkCall(response: Response, fetchMock: ReturnType<typeof stubFetch>, reason: string) {
    expect(location(response).pathname).toBe("/login");
    expect(location(response).searchParams.get("oauth")).toBe(reason);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sessionCookiesOf(response)).toEqual([]);
  }

  it("refuses a callback that has no state cookie, without calling Google or the API", async () => {
    const fetchMock = stubFetch();
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await googleCallback(callbackRequest({ query: "?code=abc&state=whatever" }));

    await expectRejectedBeforeAnyNetworkCall(response, fetchMock, "invalid_state");
  });

  it("refuses a tampered state cookie", async () => {
    const fetchMock = stubFetch();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { cookie, state } = createOAuthState("/account");
    const [payload, signature] = cookie.split(".");
    const forged = Buffer.from(JSON.stringify({ ...state, next: "/admin" })).toString("base64url");

    const response = await googleCallback(
      callbackRequest({ query: `?code=abc&state=${state.state}`, cookie: `${forged}.${signature}` }),
    );

    expect(payload).not.toBe(forged);
    await expectRejectedBeforeAnyNetworkCall(response, fetchMock, "invalid_state");
  });

  it("refuses a state parameter that does not match the cookie", async () => {
    const fetchMock = stubFetch();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { cookie } = createOAuthState("/account");

    const response = await googleCallback(callbackRequest({ query: "?code=abc&state=another-state", cookie }));

    await expectRejectedBeforeAnyNetworkCall(response, fetchMock, "invalid_state");
  });

  it("refuses a state cookie older than ten minutes", async () => {
    const fetchMock = stubFetch();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-03T10:00:00Z"));
      const { cookie, state } = createOAuthState("/account");
      vi.setSystemTime(new Date("2026-11-03T10:11:00Z"));

      const response = await googleCallback(callbackRequest({ query: `?code=abc&state=${state.state}`, cookie }));

      await expectRejectedBeforeAnyNetworkCall(response, fetchMock, "invalid_state");
    } finally {
      vi.useRealTimers();
    }
  });

  it("treats a cancelled consent screen as a quiet 'cancelled'", async () => {
    const fetchMock = stubFetch();
    const { cookie } = createOAuthState("/account");

    const response = await googleCallback(callbackRequest({ query: "?error=access_denied", cookie }));

    await expectRejectedBeforeAnyNetworkCall(response, fetchMock, "cancelled");
  });

  it("completes the sign-in: PKCE verifier to Google, nonce + secret to the API, HttpOnly session cookies", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const fetchMock = stubFetch();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id_token: "google-id-token" }))
      .mockResolvedValueOnce(jsonResponse(TOKENS));
    const { cookie, state } = createOAuthState("/account");

    const response = await googleCallback(
      callbackRequest({ query: `?code=the-code&state=${state.state}`, cookie, headers: { "x-real-ip": "203.0.113.44" } }),
    );

    // 1. the code is exchanged server-side with the PKCE verifier from the signed cookie
    const [googleUrl, googleInit] = fetchMock.mock.calls[0];
    expect(String(googleUrl)).toBe("https://oauth2.googleapis.com/token");
    const exchange = new URLSearchParams(String((googleInit as RequestInit).body));
    expect(exchange.get("grant_type")).toBe("authorization_code");
    expect(exchange.get("code")).toBe("the-code");
    expect(exchange.get("code_verifier")).toBe(state.verifier);
    expect(exchange.get("client_secret")).toBe("google-client-secret");
    expect(exchange.get("redirect_uri")).toBe(`${APP_ORIGIN}/api/auth/google/callback`);

    // 2. the API gets the id token, the nonce, the BFF secret and the trusted client IP
    const [apiUrl, apiInit] = fetchMock.mock.calls[1];
    expect(String(apiUrl)).toBe(`${API}/api/v1/auth/google`);
    expect(JSON.parse(String((apiInit as RequestInit).body))).toEqual({ idToken: "google-id-token", nonce: state.nonce });
    const apiHeaders = (apiInit as RequestInit).headers as Record<string, string>;
    expect(apiHeaders["X-Kulha-Bff-Secret"]).toBe("bff-secret-for-tests");
    expect(apiHeaders["X-Kulha-Client-IP"]).toBe("203.0.113.44");

    // 3. the person lands on the page they asked for, with HttpOnly cookies and no leftover state cookie
    expect(response.status).toBe(307);
    expect(location(response).href).toBe(`${APP_ORIGIN}/account`);
    const cookies = setCookies(response);
    const access = cookies.find((c) => c.startsWith("kulha_at=access-secret")) ?? "";
    const refresh = cookies.find((c) => c.startsWith("kulha_rt=refresh-secret")) ?? "";
    expect(access).toContain("HttpOnly");
    expect(access).toContain("Secure");
    expect(refresh).toContain("HttpOnly");
    const cleared = cookies.find((c) => c.startsWith(`${GOOGLE_OAUTH_COOKIE}=`)) ?? "";
    expect(cleared).toContain("Max-Age=0");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it.each(["//evil.example/phish", "https://evil.example", "/api/bff/admin/users"])(
    "never redirects to a hostile 'next' target (%s)",
    async (hostile) => {
      const fetchMock = stubFetch();
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ id_token: "google-id-token" }))
        .mockResolvedValueOnce(jsonResponse(TOKENS));
      const { cookie, state } = createOAuthState(hostile);

      const response = await googleCallback(callbackRequest({ query: `?code=c&state=${state.state}`, cookie }));

      expect(location(response).origin).toBe(APP_ORIGIN);
      expect(location(response).pathname).toBe("/account");
    },
  );

  it("reports a rejected Google code exchange and sets no session", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "invalid_grant" }, 400));
    const { cookie, state } = createOAuthState("/account");

    const response = await googleCallback(callbackRequest({ query: `?code=c&state=${state.state}`, cookie }));

    expect(location(response).searchParams.get("oauth")).toBe("exchange_failed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sessionCookiesOf(response)).toEqual([]);
  });

  it("reports Google answering without an id token", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ access_token: "only-an-access-token" }));
    const { cookie, state } = createOAuthState("/account");

    const response = await googleCallback(callbackRequest({ query: `?code=c&state=${state.state}`, cookie }));

    expect(location(response).searchParams.get("oauth")).toBe("exchange_failed");
    expect(sessionCookiesOf(response)).toEqual([]);
  });

  it.each([
    [401, "authentication_failed"],
    [429, "rate_limited"],
    [503, "not_configured"],
    [500, "authentication_failed"],
  ])("maps an API answer of %i to '%s' and sets no session", async (status, reason) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = stubFetch();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id_token: "google-id-token" }))
      .mockResolvedValueOnce(new Response(null, { status }));
    const { cookie, state } = createOAuthState("/account");

    const response = await googleCallback(callbackRequest({ query: `?code=c&state=${state.state}`, cookie }));

    expect(location(response).searchParams.get("oauth")).toBe(reason);
    expect(sessionCookiesOf(response)).toEqual([]);
  });

  it("reports an unreachable API as 'service_unavailable'", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = stubFetch();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id_token: "google-id-token" }))
      .mockRejectedValueOnce(new TypeError("fetch failed"));
    const { cookie, state } = createOAuthState("/account");

    const response = await googleCallback(callbackRequest({ query: `?code=c&state=${state.state}`, cookie }));

    expect(location(response).searchParams.get("oauth")).toBe("service_unavailable");
    expect(sessionCookiesOf(response)).toEqual([]);
  });
});
