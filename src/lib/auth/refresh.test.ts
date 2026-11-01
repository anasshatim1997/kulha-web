import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, problem, stubFetch } from "@/test/helpers";
import { refreshSession, resetRefreshCache } from "./refresh";

const TOKENS = { accessToken: "new-access", refreshToken: "new-refresh", tokenType: "Bearer", expiresIn: 600 };

describe("refreshSession", () => {
  beforeEach(() => resetRefreshCache());
  afterEach(() => vi.unstubAllGlobals());

  it("returns the new tokens", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse(TOKENS));

    const result = await refreshSession("old-refresh");

    expect(result).toEqual({
      status: "ok",
      tokens: { accessToken: "new-access", refreshToken: "new-refresh", expiresIn: 600 },
    });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({ refreshToken: "old-refresh" });
  });

  it("shares one call between simultaneous requests (a reused refresh token would end the session)", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValue(jsonResponse(TOKENS));

    const results = await Promise.all([
      refreshSession("old-refresh"),
      refreshSession("old-refresh"),
      refreshSession("old-refresh"),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new Set(results.map((r) => JSON.stringify(r))).size).toBe(1);
  });

  it("also reuses the result for a request that arrives just after, before the browser stored the cookies", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValue(jsonResponse(TOKENS));
    const t0 = 1_000_000;

    await refreshSession("old-refresh", t0);
    const later = await refreshSession("old-refresh", t0 + 5_000);

    expect(later.status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("calls the API again once the reuse window has passed", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockImplementation(async () => jsonResponse(TOKENS));
    const t0 = 1_000_000;

    await refreshSession("old-refresh", t0);
    await refreshSession("old-refresh", t0 + 11_000);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports a refused token as invalid and remembers it", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValue(problem(401, "Authentication failed"));

    expect((await refreshSession("bad")).status).toBe("invalid");
    expect((await refreshSession("bad")).status).toBe("invalid");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("treats server errors as unavailable and does not remember them", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(problem(500, "Error")).mockResolvedValueOnce(jsonResponse(TOKENS));

    expect((await refreshSession("rt")).status).toBe("unavailable");
    expect((await refreshSession("rt")).status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("treats a rate limit as unavailable, not as the end of the session", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(problem(429, "Too many requests"));

    expect((await refreshSession("rt")).status).toBe("unavailable");
  });

  it("treats a network error as unavailable", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    expect((await refreshSession("rt")).status).toBe("unavailable");
  });

  it("treats a malformed token response as unavailable", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ hello: "world" }));

    expect((await refreshSession("rt")).status).toBe("unavailable");
  });
});
