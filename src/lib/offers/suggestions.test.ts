import { afterEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, stubFetch } from "@/test/helpers";
import { fetchPublicOfferSuggestions, offerSuggestionHref } from "./suggestions";

describe("public offer autocomplete", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds the localized detail URL for a selected suggestion", () => {
    expect(offerSuggestionHref("fr", "offer 123")).toBe("/offers/offer%20123");
    expect(offerSuggestionHref("ar", "offer-123")).toBe("/ar/offers/offer-123");
    expect(offerSuggestionHref("en", "offer-123")).toBe("/en/offers/offer-123");
  });

  it("waits for a meaningful query before making a request", async () => {
    const fetchMock = stubFetch();
    await expect(fetchPublicOfferSuggestions(" m ")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls only the same-origin BFF and forwards location context", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse([
      { id: "offer-1", title: "Msemen basket", category: "BREAD_PASTRY", priceMinor: 650,
        merchantName: "Local Bakery", city: "Casablanca", district: "Maarif" },
    ]));

    const results = await fetchPublicOfferSuggestions("  msemen  ", { city: "Casablanca", district: "Maarif" });

    expect(results).toHaveLength(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "/api/bff/offers/suggestions?q=msemen&limit=6&city=Casablanca&district=Maarif",
    );
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("API_BASE_URL");
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ Accept: "application/json" });
  });

  it("caps the list to eight suggestions even if the upstream returns more", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse(Array.from({ length: 12 }, (_, index) => ({
      id: `offer-${index}`, title: `Basket ${index}`, category: "OTHER", priceMinor: 500,
      merchantName: "Shop", city: "Casablanca", district: null,
    }))));

    await expect(fetchPublicOfferSuggestions("basket")).resolves.toHaveLength(8);
  });
});
