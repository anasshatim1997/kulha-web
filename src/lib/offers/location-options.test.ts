import { describe, expect, it } from "vitest";
import { normalizeOfferCity, normalizeOfferDistrict, offerCities, offerDistricts } from "@/lib/offers/location-options";

describe("offer location options", () => {
  it("keeps one localized configuration for the selectable pilot list", () => {
    expect(offerCities().map((city) => city.value)).toEqual(["Casablanca"]);
    expect(offerCities().every((city) => city.labels.fr && city.labels.en && city.labels.ar)).toBe(true);
  });

  it("normalizes common Casablanca and Maarif spellings", () => {
    expect(normalizeOfferCity("Casa")).toBe("Casablanca");
    expect(normalizeOfferCity("الدار البيضاء")).toBe("Casablanca");
    expect(normalizeOfferDistrict("Ma3rif", "Casablanca")).toBe("Maarif");
    expect(normalizeOfferDistrict("المعاريف", "الدار البيضاء")).toBe("Maarif");
  });

  it("returns district options from the configured city", () => {
    expect(offerDistricts("Casablanca").map((district) => district.value)).toEqual(["Maarif"]);
  });
});
