import { describe, expect, it } from "vitest";
import { allergenPayload, DEFAULT_ALLERGENS_STATUS } from "@/lib/offers/allergens";

describe("offer allergen form defaults", () => {
  it("defaults to UNKNOWN with an empty list", () => {
    expect(DEFAULT_ALLERGENS_STATUS).toBe("UNKNOWN");
    expect(allergenPayload(true, ["GLUTEN"])).toEqual({ allergensStatus: "UNKNOWN", allergens: [] });
  });

  it("sends only merchant-declared allergens", () => {
    expect(allergenPayload(false, ["GLUTEN", "MILK"])).toEqual({
      allergensStatus: "DECLARED",
      allergens: ["GLUTEN", "MILK"],
    });
  });
});
