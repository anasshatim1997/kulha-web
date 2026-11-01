import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, api, authApi } from "./client";
import { jsonResponse, problem, stubFetch } from "@/test/helpers";

describe("api client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("calls the backend-for-frontend and parses JSON", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ email: "a@b.co" }));

    const me = await api.get<{ email: string }>("/me");

    expect(me.email).toBe("a@b.co");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/bff/me");
    expect((fetchMock.mock.calls[0][1] as RequestInit).credentials).toBe("same-origin");
  });

  it("sends JSON bodies", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 202 }));

    await api.post("/auth/register", { email: "a@b.co" });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ email: "a@b.co" }));
  });

  it("returns nothing for 202 and 204", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(api.post("/auth/verify-email", { token: "t" })).resolves.toBeUndefined();
  });

  it("turns a problem response into an ApiError with Retry-After", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ title: "Too many requests", detail: "Slow down" }), {
        status: 429,
        headers: { "Content-Type": "application/problem+json", "Retry-After": "90" },
      }),
    );

    const error = await api.get("/me").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(429);
    expect((error as ApiError).retryAfterSeconds).toBe(90);
    expect((error as ApiError).title).toBe("Too many requests");
  });

  it("copes with an error answer that is not JSON", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(new Response("<html>oops</html>", { status: 500 }));

    const error = (await api.get("/me").catch((e: unknown) => e)) as ApiError;

    expect(error.status).toBe(500);
  });

  it("reports a network failure as status 0", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const error = (await api.get("/me").catch((e: unknown) => e)) as ApiError;

    expect(error.isNetworkError).toBe(true);
  });

  it("logs in and out through the dedicated routes", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true })).mockResolvedValueOnce(new Response(null, { status: 204 }));

    await authApi.login("a@b.co", "secret-password");
    await authApi.logout();

    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/login");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/logout");
  });

  it("passes a login failure on as an ApiError", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(problem(401, "Authentication failed"));

    const error = (await authApi.login("a@b.co", "wrong").catch((e: unknown) => e)) as ApiError;

    expect(error.status).toBe(401);
  });
});

it("aborts a request that exceeds its configured timeout", async () => {
  vi.useFakeTimers();
  try {
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = api.post("/auth/register", { email: "a@b.co" }, { timeoutMs: 20 }).catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(20);
    const error = await request;

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(408);
  } finally {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  }
});
