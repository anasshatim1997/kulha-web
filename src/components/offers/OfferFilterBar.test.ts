import { describe, expect, it } from "vitest";
import { filterHref } from "@/components/offers/OfferFilterBar";
import type { OfferSearch } from "@/lib/offers/public-api";

const search: OfferSearch = {
  q: "bread",
  category: "BREAD_PASTRY",
  maxPriceMinor: "5000",
  city: "Casablanca",
  district: "Maarif",
  sort: "price",
  availableOnly: "true",
  page: "0",
  size: "50",
};

describe("shared marketplace filter navigation", () => {
  it("keeps filtering on the map route and preserves the current marketplace state", () => {
    const href = filterHref(search, "en", { maxPriceMinor: "4000" }, undefined, "/en/offers/map");
    const url = new URL(href, "https://kulha.test");
    expect(url.pathname).toBe("/en/offers/map");
    expect(url.searchParams.get("q")).toBe("bread");
    expect(url.searchParams.get("category")).toBe("BREAD_PASTRY");
    expect(url.searchParams.get("maxPriceMinor")).toBe("4000");
    expect(url.searchParams.get("city")).toBe("Casablanca");
    expect(url.searchParams.get("district")).toBe("Maarif");
    expect(url.searchParams.get("sort")).toBe("price");
    expect(url.searchParams.get("page")).toBe("0");
    expect(url.searchParams.get("size")).toBe("50");
    expect(href).not.toContain("#kulha-offers-results");
  });

  it("keeps the list as the default filter destination", () => {
    expect(filterHref(search, "fr", { district: "Gauthier" })).toContain("/offers?");
  });
});
