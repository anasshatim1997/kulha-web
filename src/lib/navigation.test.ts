import { describe, expect, it } from "vitest";
import { localeFromPath, localePath, safeNext, switchLocalePath } from "./navigation";

describe("safeNext", () => {
  it("keeps simple paths of this site", () => {
    expect(safeNext("/account")).toBe("/account");
    expect(safeNext("/merchant/apply")).toBe("/merchant/apply");
    expect(safeNext("/admin/merchants?status=PENDING")).toBe("/admin/merchants?status=PENDING");
  });

  it("falls back when there is nothing", () => {
    expect(safeNext(null)).toBe("/account");
    expect(safeNext(undefined)).toBe("/account");
    expect(safeNext("")).toBe("/account");
    expect(safeNext(null, "/home")).toBe("/home");
  });

  it("refuses other sites and tricks", () => {
    for (const bad of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "\\\\evil.example",
      "javascript:alert(1)",
      "account",
      "/ evil",
      "/a\nb",
      "/api/bff/me",
    ]) {
      expect(safeNext(bad)).toBe("/account");
    }
  });
});


describe("locale navigation", () => {
  it("detects the three supported languages", () => {
    expect(localeFromPath("/how-it-works")).toBe("fr");
    expect(localeFromPath("/en/how-it-works")).toBe("en");
    expect(localeFromPath("/ar/categories")).toBe("ar");
  });

  it("builds localized paths without duplicating a locale prefix", () => {
    expect(localePath("en", "/en/how-it-works")).toBe("/en/how-it-works");
    expect(localePath("ar", "/categories")).toBe("/ar/categories");
    expect(localePath("fr", "/ar/categories")).toBe("/categories");
  });

  it("switches language on the same supported page", () => {
    expect(switchLocalePath("/en/how-it-works", "ar")).toBe("/ar/how-it-works");
    expect(switchLocalePath("/ar/register", "fr")).toBe("/register");
    expect(switchLocalePath("/categories", "en")).toBe("/en/categories");
  });

  it("falls back to the localized home for unsupported routes", () => {
    expect(switchLocalePath("/blog/a-post", "ar")).toBe("/ar");
    expect(switchLocalePath("/account", "en")).toBe("/en");
  });
});
