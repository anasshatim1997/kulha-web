import { describe, expect, it } from "vitest";
import { formatMad, formatPickupDate, formatPickupWindow, madToMinorUnits, parsePickupInstant } from "@/lib/offers/format";

describe("public offer formatters", () => {
  it("formats MAD prices for French, English and Arabic", () => {
    for (const locale of ["fr", "en", "ar"] as const) {
      const formatted = formatMad(1250, locale);
      expect(formatted).toContain(locale === "ar" ? "د.م." : "DH");
      expect(formatted).not.toMatch(/[,،]00/);
    }
    expect(formatMad(1250, "fr")).not.toBe(formatMad(1250, "en"));
  });

  it("formats pickup windows in Africa/Casablanca for all supported locales", () => {
    const start = "2026-07-10T14:00:00Z";
    const end = "2026-07-10T16:00:00Z";
    for (const locale of ["fr", "en", "ar"] as const) {
      expect(formatPickupWindow(start, end, locale)).toContain("·");
    }
    expect(formatPickupWindow(start, end, "fr")).toContain("15:00");
    expect(formatPickupWindow(start, end, "fr")).not.toBe(formatPickupWindow(start, end, "en"));
  });

  it("parses timezone-less pickup values as Casablanca wall time, not host-local time", () => {
    const localValue = "2026-01-01T10:00:00";
    const parsed = parsePickupInstant(localValue);
    expect(formatPickupWindow(localValue, "2026-01-01T13:00:00", "fr")).toContain("10:00–13:00");
    expect(formatPickupDate(localValue, "en")).toContain("January");
    expect(Number.isFinite(parsed.getTime())).toBe(true);
  });

  it("uses stable absolute day labels instead of runtime-relative today/tomorrow text", () => {
    const pickup = "2026-11-19T10:00:00Z";
    const first = formatPickupWindow(pickup, "2026-11-19T13:00:00Z", "fr");
    const second = formatPickupWindow(pickup, "2026-11-19T13:00:00Z", "fr");
    expect(first).toBe(second);
    expect(first).not.toContain("Aujourd’hui");
    expect(first).not.toContain("Demain");
  });

  it("rejects invalid prices and pickup windows", () => {
    expect(() => formatMad(-1, "fr")).toThrow(RangeError);
    expect(() => formatPickupWindow("bad", "2026-11-10T16:00:00Z", "en")).toThrow(RangeError);
  });
});

describe("MAD filter amount conversion", () => {
  it("converts decimal MAD amounts to exact integer minor units", () => {
    expect(madToMinorUnits("1.29")).toBe(129);
    expect(madToMinorUnits("12.50")).toBe(1250);
    expect(madToMinorUnits("2")).toBe(200);
  });

  it("rejects values outside the API range or with excess precision", () => {
    for (const value of ["0.99", "2000.01", "1.001", "1,25", "abc"]) {
      expect(() => madToMinorUnits(value)).toThrow(RangeError);
    }
  });
});

describe("Moroccan price rounding", () => {
  it("rounds small prices to half-dirham and larger prices to whole dirhams", () => {
    expect(formatMad(1249, "fr")).toContain("12,5 DH");
    expect(formatMad(1260, "fr")).toContain("13 DH");
    expect(formatMad(2050, "fr")).toContain("21 DH");
  });
});
