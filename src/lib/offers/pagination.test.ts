import { describe, expect, it } from "vitest";
import { offerPageHref, offerPageNumbers } from "@/lib/offers/pagination";

describe("offer pagination links", () => {
  it("preserves filters and availability when moving between French pages", () => {
    expect(offerPageHref("fr", { category: "BREAD_PASTRY", city: "Casablanca", availableOnly: "false", page: "0", size: "20" }, 2))
      .toBe("/offers?category=BREAD_PASTRY&city=Casablanca&availableOnly=false&page=2&size=20#kulha-offers-results");
  });

  it("uses localized route prefixes and clamps invalid page targets", () => {
    expect(offerPageHref("ar", { district: "Maarif" }, -4))
      .toBe("/ar/offers?district=Maarif&availableOnly=true&page=0&size=20#kulha-offers-results");
  });
});

describe("numbered offer pagination", () => {
  it("shows every page when the result count is small", () => {
    expect(offerPageNumbers(0, 4)).toEqual([0, 1, 2, 3]);
  });

  it("adds first and last pages with ellipses for long result sets", () => {
    expect(offerPageNumbers(5, 20)).toEqual([0, "ellipsis", 3, 4, 5, 6, 7, "ellipsis", 19]);
  });

  it("clamps the current page to the valid range", () => {
    expect(offerPageNumbers(99, 12)).toEqual([0, "ellipsis", 6, 7, 8, 9, 10, 11]);
  });
});
