import { afterEach, describe, expect, it, vi } from "vitest";
import { searchNearbyOffers, searchOffersForMap } from "./nearby-client";

const page = { items: [], page: 0, size: 50, total: 0 };

describe("map offer discovery", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the requested city fallback page and active marketplace filters without requiring GPS", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(page), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await searchOffersForMap({ q: "bread", city: "Casablanca", district: "Maarif", category: "BREAD_PASTRY", page: "2", size: "20" });

    const url = new URL(String(fetchMock.mock.calls[0][0]), "http://localhost:3000");
    expect(url.pathname).toBe("/api/bff/offers");
    expect(url.searchParams.get("q")).toBe("bread");
    expect(url.searchParams.get("city")).toBe("Casablanca");
    expect(url.searchParams.get("district")).toBe("Maarif");
    expect(url.searchParams.get("availableOnly")).toBe("true");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("size")).toBe("20");
  });

  it("sends the selected radius and customer coordinates to the nearby endpoint", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(page), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await searchNearbyOffers({
      latitude: 33.5895,
      longitude: -7.6200,
      radiusMeters: 1000,
      city: "Casablanca",
      availableOnly: true,
      page: 0,
      size: 50,
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0][0])).toBe("/api/bff/offers/nearby");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      latitude: 33.5895,
      longitude: -7.62,
      radiusMeters: 1000,
      city: "Casablanca",
      availableOnly: true,
      page: 0,
      size: 50,
    });
  });
});
