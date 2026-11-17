import { describe, expect, it } from "vitest";
import { getMadDiscountPercent, getMadPriceDisplayParts } from "@/lib/offers/price-display";

describe("MAD price sticker display", () => {
  it("splits the exact stored price into large and fractional digits", () => {
    expect(getMadPriceDisplayParts(2490, "fr")).toEqual({
      major: "24",
      fraction: "90",
      currency: "DH",
      full: "24,90 DH",
    });
  });

  it("localizes the currency and numeric digits", () => {
    expect(getMadPriceDisplayParts(1250, "en")).toEqual({
      major: "12",
      fraction: "50",
      currency: "MAD",
      full: "12.50 MAD",
    });
    expect(getMadPriceDisplayParts(1250, "ar").currency).toBe("د.م.");
  });

  it("calculates a discount from the exact price values", () => {
    expect(getMadDiscountPercent(2490, 3490)).toBe(29);
    expect(getMadDiscountPercent(1250, 2000)).toBe(38);
    expect(getMadDiscountPercent(1000, 1000)).toBeNull();
    expect(getMadDiscountPercent(1200, null)).toBeNull();
  });
});
