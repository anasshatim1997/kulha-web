import { describe, expect, it } from "vitest";
import { legalCopy } from "./legal-copy";

const locales = ["fr", "en", "ar"] as const;

for (const locale of locales) {
  describe(`KULHA! legal copy (${locale})`, () => {
    it("provides both working legal documents with substantive sections", () => {
      expect(legalCopy[locale].terms.sections.length).toBeGreaterThanOrEqual(10);
      expect(legalCopy[locale].privacy.sections.length).toBeGreaterThanOrEqual(10);
      expect(legalCopy[locale].terms.references.length).toBeGreaterThan(0);
      expect(legalCopy[locale].privacy.references.length).toBeGreaterThan(0);
    });

    it("clearly marks the documents as drafts and lists publication blockers", () => {
      for (const document of [legalCopy[locale].terms, legalCopy[locale].privacy]) {
        expect(document.draftNoticeTitle.trim().length).toBeGreaterThan(5);
        expect(document.draftNotice.trim().length).toBeGreaterThan(80);
        expect(document.completionTitle.trim().length).toBeGreaterThan(5);
        expect(document.completionBody.trim().length).toBeGreaterThan(30);
      }
    });

    it("uses only valid external HTTPS legal references", () => {
      for (const document of [legalCopy[locale].terms, legalCopy[locale].privacy]) {
        for (const reference of document.references) {
          expect(() => new URL(reference.url)).not.toThrow();
          expect(reference.url.startsWith("https://")).toBe(true);
        }
      }
    });
  });
}
