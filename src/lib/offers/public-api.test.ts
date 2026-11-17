import { afterEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, stubFetch } from "@/test/helpers";

vi.mock("server-only", () => ({}));
import { getPublicOffer, listPublicOffers } from "./public-api";

describe("public offer API BFF integration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("calls the same-origin BFF path, never the backend origin, for the public list", async () => {
    vi.stubEnv("APP_ORIGIN", "https://kulha.example");
    vi.stubEnv("API_BASE_URL", "https://api.backend.example");
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [], page: 0, size: 20, total: 0 }));

    await listPublicOffers({ city: "Casablanca", page: "0" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://kulha.example/api/bff/offers?city=Casablanca&page=0&availableOnly=true");
    expect(String(url)).not.toContain("api.backend.example");
    expect((init as RequestInit).headers).toMatchObject({ Accept: "application/json" });
    expect((init as RequestInit & { next?: { revalidate?: number } }).next).toEqual({ revalidate: 30 });
    expect((init as RequestInit).cache).toBe("force-cache");
  });

  it("calls the BFF detail endpoint for an offer id", async () => {
    vi.stubEnv("APP_ORIGIN", "https://kulha.example");
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "offer/id" }));

    await getPublicOffer("offer-123");

    expect(String(fetchMock.mock.calls[0][0])).toBe("https://kulha.example/api/bff/offers/offer-123");
  });
});
