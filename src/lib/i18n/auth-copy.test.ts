import { describe, expect, it } from "vitest";
import { authCopy } from "./auth-copy";

describe("registration policy and existing-account guidance", () => {
  it.each(["fr", "en", "ar"] as const)("provides complete localized guidance for %s", (locale) => {
    const copy = authCopy[locale];

    expect(copy.termsSummary).toHaveLength(3);
    expect(copy.privacySummary).toHaveLength(3);
    expect(copy.termsSummaryTitle).not.toBe("");
    expect(copy.privacySummaryTitle).not.toBe("");
    expect(copy.draftNotice).toContain(locale === "ar" ? "مسودات" : locale === "fr" ? "modèles de travail" : "working templates");
    expect(copy.readMoreLabel).not.toBe("");
    expect(copy.existingAccountHint).not.toBe("");
    expect(copy.existingAccountPrivacyNote).not.toBe("");
  });
});
