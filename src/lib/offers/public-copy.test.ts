import { describe, expect, it } from "vitest";
import { offerCategoryLabel, offerStatusLabel, publicOfferCopy } from "@/lib/offers/public-copy";

describe("localized public offer copy", () => {
  it("translates API category and status values in all locales", () => {
    for (const locale of ["fr", "en", "ar"] as const) {
      expect(offerCategoryLabel(locale, "BREAD_PASTRY")).not.toBe("BREAD_PASTRY");
      expect(offerStatusLabel(locale, "PUBLISHED")).not.toBe("PUBLISHED");
      expect(offerStatusLabel(locale, "DRAFT")).not.toBe("DRAFT");
      expect(offerStatusLabel(locale, "FUTURE_STATUS")).not.toBe("FUTURE_STATUS");
    }
  });

  it("labels unknown allergen information as not provided", () => {
    expect(publicOfferCopy("fr").notProvided).toBe("Non renseigné.");
    expect(publicOfferCopy("en").notProvided).toBe("Not provided.");
    expect(publicOfferCopy("ar").notProvided).toBe("لم يقدّم المتجر هذه المعلومات.");
  });


  it("localizes the search clear action and concise customization teaser", () => {
    expect(publicOfferCopy("fr").clearSearch).toBe("Effacer la recherche");
    expect(publicOfferCopy("en").clearSearch).toBe("Clear search");
    expect(publicOfferCopy("ar").clearSearch).toBe("مسح البحث");
    for (const locale of ["fr", "en", "ar"] as const) {
      expect(publicOfferCopy(locale).filter.length).toBeGreaterThan(0);
      expect(publicOfferCopy(locale).filterHint.length).toBeGreaterThan(0);
    }
  });

  it("keeps the complete offer copy key set aligned across all locales", () => {
    const frenchKeys = Object.keys(publicOfferCopy("fr")).sort();
    expect(Object.keys(publicOfferCopy("en")).sort()).toEqual(frenchKeys);
    expect(Object.keys(publicOfferCopy("ar")).sort()).toEqual(frenchKeys);
  });

  it("explains discovery and the current booking limitation in all locales", () => {
    for (const locale of ["fr", "en", "ar"] as const) {
      expect(publicOfferCopy(locale).guideSteps).toHaveLength(3);
      expect(publicOfferCopy(locale).bookingNoteTitle.length).toBeGreaterThan(0);
      expect(publicOfferCopy(locale).bookingNoteBody.length).toBeGreaterThan(0);
      expect(publicOfferCopy(locale).guideHelperLabel.length).toBeGreaterThan(0);
      expect(publicOfferCopy(locale).guideAvailable.length).toBeGreaterThan(0);
      expect(publicOfferCopy(locale).guideBrowse.length).toBeGreaterThan(0);
      expect(publicOfferCopy(locale).basketPrice.length).toBeGreaterThan(0);
      expect(publicOfferCopy(locale).clearSearch.length).toBeGreaterThan(0);
      expect(publicOfferCopy(locale).pickupWindowLabel.length).toBeGreaterThan(0);
      expect(publicOfferCopy(locale).noFilterResultsTitle.length).toBeGreaterThan(0);
      expect(publicOfferCopy(locale).errorTitle.length).toBeGreaterThan(0);
      expect(publicOfferCopy(locale).loading.length).toBeGreaterThan(0);
      expect(publicOfferCopy(locale).allergenUnknownNote.length).toBeGreaterThan(0);
    }
    expect(publicOfferCopy("ar").title).toBe("اكتشف سلال المتاجر المحلية");
  });
});
