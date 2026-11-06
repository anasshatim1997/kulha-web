import { afterEach, describe, expect, it, vi } from "vitest";
import { APP_ORIGIN, jsonResponse, request, stubFetch } from "@/test/helpers";
import { forwardToBackend } from "./forward";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("offer BFF headers", () => {
  it("forwards idempotency and correlation headers to the API", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "offer-id" }, 201));
    const response = await forwardToBackend(
      request("/api/bff/merchants/me/offers", {
        method: "POST",
        origin: APP_ORIGIN,
        cookies: { kulha_at: "access-token" },
        body: { title: "Bread" },
        headers: { "Idempotency-Key": "retry-key-01", "X-Correlation-Id": "trace-01" },
      }),
      ["merchants", "me", "offers"],
    );
    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(response.status).toBe(201);
    expect(headers["Idempotency-Key"]).toBe("retry-key-01");
    expect(headers["X-Correlation-Id"]).toBe("trace-01");
    expect(headers.Authorization).toBe("Bearer access-token");
  });

  it("does not forward browser-supplied authorization or BFF secret headers", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [] }));
    await forwardToBackend(
      request("/api/bff/merchants/me/offers", {
        cookies: { kulha_at: "cookie-token" },
        headers: { authorization: "Bearer attacker", "x-kulha-bff-secret": "attacker-secret" },
      }),
      ["merchants", "me", "offers"],
    );
    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer cookie-token");
    expect(headers["X-Kulha-Bff-Secret"]).toBeUndefined();
  });
});
