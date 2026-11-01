import { describe, expect, it } from "vitest";
import { siteCopy } from "../site-copy";
import { pageCopy } from "../page-copy";

describe("KULHA! public product copy", () => {
  it("defines every supported Moroccan-facing locale", () => {
    expect(Object.keys(siteCopy).sort()).toEqual(["ar", "en", "fr"]);
  });

  it("keeps Arabic in RTL", () => {
    expect(siteCopy.ar.dir).toBe("rtl");
  });

  it("keeps the reservation and collection journey clear", () => {
    for (const locale of Object.keys(siteCopy) as (keyof typeof siteCopy)[]) {
      const copy = siteCopy[locale];
      expect(copy.pickup.title.length).toBeGreaterThan(10);
      expect(copy.pickup.items.length).toBe(3);
      expect(copy.faq.items).toHaveLength(5);
      expect(copy.trust.items).toHaveLength(6);
      expect(copy.trust.pilotBody.length).toBeGreaterThan(40);
    }
  });

  it("provides pickup policy and shop information in every locale", () => {
    for (const locale of Object.keys(pageCopy) as (keyof typeof pageCopy)[]) {
      expect(pageCopy[locale]["pickup-policy"].sections.length).toBeGreaterThan(0);
      expect(pageCopy[locale]["for-shops"].sections.length).toBeGreaterThan(0);
    }
  });
});
