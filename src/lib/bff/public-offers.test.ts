import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { APP_ORIGIN, authorizationOf, jsonResponse, request, stubFetch } from "@/test/helpers";
import { forwardPublicNearbyRequest, forwardPublicOfferRequest } from "./public-offers";
import { POST as postOffers } from "@/app/api/bff/offers/route";
import { POST as postOfferDetail } from "@/app/api/bff/offers/[id]/route";
import { GET as getOfferSuggestions } from "@/app/api/bff/offers/suggestions/route";
import { POST as postNearby } from "@/app/api/bff/offers/nearby/route";

describe("public offer BFF", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("forwards an anonymous list read and its correlation id, never session cookies", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [], page: 0, size: 20, total: 0 }));

    const response = await forwardPublicOfferRequest(
      request("/api/bff/offers?city=Casablanca", {
        cookies: { kulha_at: "must-not-forward", kulha_rt: "must-not-refresh" },
        headers: { "x-correlation-id": "corr-public-001" },
      }),
      [],
    );

    expect(response.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:8080/api/v1/offers?city=Casablanca");
    expect(authorizationOf(fetchMock.mock.calls[0])).toBeUndefined();
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ "X-Correlation-Id": "corr-public-001" });
    expect(response.headers.get("cache-control")).toContain("s-maxage=30");
  });

  it("generates and forwards a server-side correlation id when the caller has none", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [], page: 0, size: 20, total: 0 }));

    const response = await forwardPublicOfferRequest(request("/api/bff/offers"), []);
    const forwarded = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;

    expect(response.status).toBe(200);
    expect(forwarded["X-Correlation-Id"]).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("forwards offer detail reads through the existing offers allow-list", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1" }));

    const response = await forwardPublicOfferRequest(
      request("/api/bff/offers/a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1"),
      ["a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1"],
    );

    expect(response.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:8080/api/v1/offers/a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1");
  });

  it("keeps origin validation in place for mutation attempts", async () => {
    const fetchMock = stubFetch();
    const denied = await forwardPublicOfferRequest(
      request("/api/bff/offers", { method: "POST", origin: "https://untrusted.example", body: {} }),
      [],
    );
    const allowedOriginButUnsupported = await forwardPublicOfferRequest(
      request("/api/bff/offers", { method: "POST", origin: APP_ORIGIN, body: {} }),
      [],
    );

    expect(denied.status).toBe(403);
    expect(allowedOriginButUnsupported.status).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("routes list and detail mutation attempts through the trusted-origin guard", async () => {
    const fetchMock = stubFetch();
    const listResponse = await postOffers(request("/api/bff/offers", { method: "POST", origin: "https://untrusted.example", body: {} }));
    const detailResponse = await postOfferDetail(
      request("/api/bff/offers/offer-123", { method: "DELETE", origin: "https://untrusted.example" }),
      { params: Promise.resolve({ id: "offer-123" }) },
    );

    expect(listResponse.status).toBe(403);
    expect(detailResponse.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });


  it("forwards the customer's nearby map search as an anonymous same-origin POST", async () => {
    const fetchMock = stubFetch();
    vi.stubEnv("KULHA_BFF_SHARED_SECRET", "map-test-secret");
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [], page: 0, size: 50, total: 0 }));
    const body = { latitude: 33.589, longitude: -7.62, radiusMeters: 5000, city: "Casablanca", district: "Maarif", page: 0, size: 50 };

    const response = await postNearby(request("/api/bff/offers/nearby", {
      method: "POST",
      origin: APP_ORIGIN,
      body,
      cookies: { kulha_at: "must-not-forward" },
      headers: { "x-real-ip": "203.0.113.7", "x-correlation-id": "corr-map-001" },
    }));

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(response.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:8080/api/v1/offers/nearby");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(body);
    expect(init.headers).toMatchObject({ "X-Correlation-Id": "corr-map-001", "X-Kulha-Client-IP": "203.0.113.7" });
    expect(authorizationOf(fetchMock.mock.calls[0])).toBeUndefined();
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects cross-origin nearby map requests and oversized payloads", async () => {
    const fetchMock = stubFetch();
    const denied = await forwardPublicNearbyRequest(request("/api/bff/offers/nearby", {
      method: "POST", origin: "https://untrusted.example", body: { latitude: 33.5, longitude: -7.6 },
    }));
    const oversized = await forwardPublicNearbyRequest(new NextRequest(`${APP_ORIGIN}/api/bff/offers/nearby`, {
      method: "POST", headers: { origin: APP_ORIGIN }, body: "x".repeat(8193),
    }));
    expect(denied.status).toBe(403);
    expect(oversized.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards autocomplete suggestions through the anonymous offers BFF route", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse([
      { id: "offer-1", title: "Msemen basket", category: "BREAD_PASTRY", priceMinor: 650,
        merchantName: "Local Bakery", city: "Casablanca", district: "Maarif" },
    ]));

    const response = await getOfferSuggestions(request(
      "/api/bff/offers/suggestions?q=msemen&city=Casablanca&district=Maarif",
      { cookies: { kulha_at: "must-not-forward" }, headers: { "x-correlation-id": "corr-suggest-1" } },
    ));

    expect(response.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "http://localhost:8080/api/v1/offers/suggestions?q=msemen&city=Casablanca&district=Maarif",
    );
    expect(authorizationOf(fetchMock.mock.calls[0])).toBeUndefined();
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ "X-Correlation-Id": "corr-suggest-1" });
    expect(response.headers.get("cache-control")).toContain("s-maxage=30");
  });

  it("rejects nested offers paths", async () => {
    const fetchMock = stubFetch();
    const response = await forwardPublicOfferRequest(request("/api/bff/offers/x/y"), ["x", "y"]);
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
