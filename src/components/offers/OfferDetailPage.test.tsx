import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OfferDetailPage } from "@/components/offers/OfferDetailPage";

const { getPublicOfferMock } = vi.hoisted(() => ({ getPublicOfferMock: vi.fn() }));

vi.mock("@/lib/offers/public-api", () => ({ getPublicOffer: getPublicOfferMock }));

describe("public offer detail page", () => {
  it("renders the localized detail route when the BFF returns an offer", async () => {
    getPublicOfferMock.mockResolvedValueOnce({
      id: "offer-123",
      title: "سلة خبز",
      category: "BREAD_PASTRY",
      priceMinor: 1250,
      originalPriceMinor: null,
      quantityTotal: 2,
      availableUnits: 2,
      pickupStart: "2026-11-10T14:00:00Z",
      pickupEnd: "2026-11-10T16:00:00Z",
      merchant: { name: "مخبزة الحي", address: "شارع السوق", city: "الدار البيضاء", district: "المعاريف", pickupInstructions: null },
      description: "خبز طازج من فائض اليوم.",
      allergensStatus: "UNKNOWN",
      allergens: [],
      foodNotes: null,
    });

    const page = await OfferDetailPage({ locale: "ar", id: "offer-123" });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("سعر السلة كاملة");
    expect(html).toContain("شارك عبر واتساب");
    expect(html).toContain("/kulha-loader/baguette.webp");
    expect(html).not.toContain("/brand/kulha-bag.png");
    expect(html).toContain('class="kd-stage');
    expect(html).toContain('class="kd-buy"');
    expect(html).toContain('class="kd-share"');
    expect(html).toContain("احجز هذه السلة");
    expect(html).toContain("عرض الخريطة");
    expect(html.indexOf('class="kd-buy"')).toBeLessThan(html.indexOf('class="kd-share"'));
    expect(html).toContain("لم يقدّم المتجر هذه المعلومات");
    expect(html.toLowerCase()).not.toContain("halal");
  });

  it("renders a localized unavailable state instead of exposing upstream errors", async () => {
    getPublicOfferMock.mockRejectedValueOnce(new Error("private backend stack"));

    const page = await OfferDetailPage({ locale: "en", id: "missing-offer" });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("This basket is no longer available.");
    expect(html).toContain("Back to baskets");
    expect(html).not.toContain("private backend stack");
  });
});
