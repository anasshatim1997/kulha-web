import { describe, expect, it } from "vitest";
import { defaultSignedInPath, localeFromPath, localePath, safeNext, switchLocalePath, isMerchantWorkspacePath, isCustomerAccountPath, shouldUseCustomerWorkspace } from "./navigation";

describe("safeNext", () => {
    it("keeps simple paths of this site", () => {
        expect(safeNext("/account")).toBe("/account");
        expect(safeNext("/merchant/apply")).toBe("/merchant/apply");
        expect(safeNext("/admin/merchants?status=PENDING")).toBe("/admin/merchants?status=PENDING");
    });

    it("falls back when there is nothing", () => {
        expect(safeNext(null)).toBe("/offers");
        expect(safeNext(undefined)).toBe("/offers");
        expect(safeNext("")).toBe("/offers");
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
            expect(safeNext(bad)).toBe("/offers");
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

    it("keeps the account page, which exists in every language", () => {
        expect(switchLocalePath("/account", "en")).toBe("/en/account");
        expect(switchLocalePath("/en/account", "fr")).toBe("/account");
    });

    it("keeps the separate shop owner sign-up page in every language", () => {
        expect(switchLocalePath("/register/merchant", "en")).toBe("/en/register/merchant");
        expect(switchLocalePath("/en/register/merchant", "ar")).toBe("/ar/register/merchant");
        expect(switchLocalePath("/ar/register/merchant", "fr")).toBe("/register/merchant");
        expect(switchLocalePath("/register/other", "en")).toBe("/en");
    });

    it("keeps public offer list and detail routes when switching languages", () => {
        expect(switchLocalePath("/offers", "ar")).toBe("/ar/offers");
        expect(switchLocalePath("/en/offers/123", "fr")).toBe("/offers/123");
        expect(switchLocalePath("/merchant/offers", "en")).toBe("/en/merchant/offers");
    });

    it("recognizes only unprefixed French and EN/AR merchant workspaces", () => {
        expect(isMerchantWorkspacePath("/merchant/offers")).toBe(true);
        expect(isMerchantWorkspacePath("/en/merchant/offers")).toBe(true);
        expect(isMerchantWorkspacePath("/ar/merchant/apply")).toBe(true);
        expect(isMerchantWorkspacePath("/fr/merchant/offers")).toBe(false);
    });

    it("recognizes the account route in all supported locales", () => {
        expect(isCustomerAccountPath("/account")).toBe(true);
        expect(isCustomerAccountPath("/en/account")).toBe(true);
        expect(isCustomerAccountPath("/ar/account/")).toBe(true);
        expect(isCustomerAccountPath("/offers")).toBe(false);
    });

    it("uses the focused app shell for signed-in customers, not merchants or admins", () => {
        expect(shouldUseCustomerWorkspace("/account", ["CUSTOMER"])).toBe(true);
        expect(shouldUseCustomerWorkspace("/en/offers/123", ["CUSTOMER"])).toBe(true);
        expect(shouldUseCustomerWorkspace("/ar/faq", ["CUSTOMER"])).toBe(true);
        expect(shouldUseCustomerWorkspace("/login", ["CUSTOMER"])).toBe(false);
        expect(shouldUseCustomerWorkspace("/merchant/dashboard", ["CUSTOMER"])).toBe(false);
        expect(shouldUseCustomerWorkspace("/offers", ["MERCHANT"])).toBe(false);
        expect(shouldUseCustomerWorkspace("/offers", ["CUSTOMER", "MERCHANT"])).toBe(false);
        expect(shouldUseCustomerWorkspace("/offers", ["ADMIN"])).toBe(false);
    });

    it("keeps legal pages when switching languages", () => {
        expect(switchLocalePath("/terms", "en")).toBe("/en/terms");
        expect(switchLocalePath("/en/privacy", "ar")).toBe("/ar/privacy");
        expect(switchLocalePath("/ar/terms", "fr")).toBe("/terms");
    });

    it("falls back to the localized home for unsupported routes", () => {
        expect(switchLocalePath("/blog/a-post", "ar")).toBe("/ar");
        expect(switchLocalePath("/unknown-page", "en")).toBe("/en");
        expect(switchLocalePath("/admin/merchants", "ar")).toBe("/ar");
    });
});

describe("post-auth destination", () => {
  it("sends customers directly to the discovery feed", () => {
    expect(defaultSignedInPath("fr", ["CUSTOMER"])).toBe("/offers");
    expect(defaultSignedInPath("en", ["CUSTOMER"])).toBe("/en/offers");
    expect(defaultSignedInPath("ar", ["CUSTOMER"])).toBe("/ar/offers");
  });

  it("keeps merchants in their workspace", () => {
    expect(defaultSignedInPath("fr", ["CUSTOMER", "MERCHANT"])).toBe("/merchant/dashboard");
  });
});
