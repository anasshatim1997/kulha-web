import { describe, expect, it } from "vitest";
import { offerPageHref } from "@/lib/offers/pagination";

describe("offer pagination links", () => {
  it("preserves filters and availability when moving between French pages", () => {
    expect(offerPageHref("fr", { category: "BREAD_PASTRY", city: "Casablanca", availableOnly: "false", page: "0", size: "20" }, 2))
      .toBe("/offers?category=BREAD_PASTRY&city=Casablanca&availableOnly=false&page=2&size=20");
  });

  it("uses localized route prefixes and clamps invalid page targets", () => {
    expect(offerPageHref("ar", { district: "Maarif" }, -4)).toBe("/ar/offers?district=Maarif&availableOnly=true&page=0&size=20");
  });
});
