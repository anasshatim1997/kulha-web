import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OfferCard } from "@/components/offers/OfferCard";
import { PickupCountdown, getPickupCountdownDuration } from "@/components/offers/PickupCountdown";
import { OfferDetail } from "@/components/offers/OfferDetail";
import { OfferEmptyState, OfferErrorState, OfferLoadingState } from "@/components/offers/OfferListStates";
import { OfferActiveFilters, OfferFilterBar } from "@/components/offers/OfferFilterBar";
import { OfferSearchDisclosure } from "@/components/offers/OfferSearchDisclosure";
import { OfferCategoryNav } from "@/components/offers/OfferCategoryNav";
import type { PublicOffer, PublicOfferDetail } from "@/lib/offers/public-api";
import { API_OFFER_CATEGORIES } from "@/lib/offers/categories";

const { routerPushMock } = vi.hoisted(() => ({ routerPushMock: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: routerPushMock }) }));

const baseOffer: PublicOffer = {
    id: "a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1",
    title: "Bread basket",
    category: "BREAD_PASTRY",
    priceMinor: 1250,
    originalPriceMinor: 2000,
    quantityTotal: 4,
    availableUnits: 3,
    pickupStart: "2026-11-10T14:00:00Z",
    pickupEnd: "2026-11-10T16:00:00Z",
    merchant: { name: "Local Bakery", address: "12 Market Street", city: "Casablanca", district: "Maarif", pickupInstructions: "Collect at the side counter" },
};

const soldOutOffer: PublicOffer = { ...baseOffer, availableUnits: 0 };
const pickupRanges = {
    now: { from: "2026-11-07T18:00:00.000Z", to: "2026-11-07T20:00:00.000Z" },
    tonight: { from: "2026-11-07T18:00:00.000Z", to: "2026-11-07T23:59:00.000Z" },
    tomorrow: { from: "2026-11-08T00:00:00.000Z", to: "2026-11-08T23:59:00.000Z" },
};
const detail: PublicOfferDetail = {
    ...baseOffer,
    description: "Daily surplus bread.",
    allergensStatus: "UNKNOWN",
    allergens: [],
    foodNotes: null,
};

function render(element: ReactElement) {
    return renderToStaticMarkup(element);
}

describe("public offer components", () => {
    it("uses the API category enum values in customer and merchant category controls", () => {
        expect(API_OFFER_CATEGORIES).toEqual(["BREAD_PASTRY", "PREPARED_MEALS", "GROCERIES", "FRUIT_VEG", "DRINKS", "SURPRISE_BASKET", "OTHER"]);
    });


    it("renders text-only category chips (no icons, no emoji) with the active one marked", () => {
        const html = render(<OfferCategoryNav locale="en" search={{ category: "BREAD_PASTRY" }} />);
        expect(html.match(/<a /g)).toHaveLength(8);
        for (const label of ["All", "Surprise", "Bakery", "Meals", "Groceries", "Fruit &amp; veg", "Drinks", "Other"]) expect(html).toContain(`>${label}</a>`);
        expect(html).toContain('class="is-active"');
        expect(html).toContain('aria-current="page"');
        expect(html).not.toContain("<svg");
        expect(html).not.toContain("🥐");
        expect(html).not.toContain("🛍️");
        expect(html).not.toContain("🧺");
    });

    it("renders a marketplace card with a dominant full-basket MAD price and pickup window", () => {
        const html = render(<OfferCard offer={baseOffer} locale="fr" />);
        expect(html).toContain("Bread basket");
        expect(html).toContain("Local Bakery");
        expect(html).toContain("12,50 DH");
        expect(html).toContain("-38%");
        expect(html).toContain("kulha-price-sticker");
        expect(html).toContain("Créneau de retrait");
        expect(html).not.toContain("Boulangerie &amp; pâtisserie");
        expect(html).not.toContain("Prix du panier complet");
        expect(html).not.toContain("Retrait en magasin uniquement");
        expect(html).not.toContain("few left");
        expect(html).not.toContain("You save");
        expect(html).not.toContain("Vous économisez");
    });


    it("provides localized pickup countdown copy and renders no misleading expired countdown", () => {
        expect(getPickupCountdownDuration(75, "fr")).toBe("1 h 15 min");
        expect(getPickupCountdownDuration(25, "en")).toBe("25 min");
        expect(getPickupCountdownDuration(25, "ar")).toBe("25 د");
        expect(render(<PickupCountdown pickupEnd="not-a-date" locale="en" />)).toBe("");
    });

    it("shows the exact available-unit count and never invents a low-stock threshold", () => {
        const html = render(<OfferCard offer={{ ...baseOffer, availableUnits: 2 }} locale="en" />);
        expect(html).toContain("2 left");
        expect(html).not.toContain("Only 2 left");
        expect(html).not.toContain("Category illustration");
        expect(html).toContain('aria-label="Bread basket,');
    });

    it("renders sold-out status from the API's exact zero-unit value without fading the card", () => {
        const html = render(<OfferCard offer={soldOutOffer} locale="en" />);
        expect(html).toContain("is-sold-out");
        expect(html).toContain("Sold out");
        expect(html).not.toContain("0 available");
        expect(html).toContain("kulha-offer-status");
    });

    it("renders the sold-out state on the offer detail page from the API zero-unit value", () => {
        const html = render(<OfferDetail offer={{ ...detail, availableUnits: 0 }} locale="fr" />);
        expect(html).toContain("Épuisé");
        expect(html).toContain(">0</bdi>");
    });

    it("renders the detail page and unknown-allergen state without implying safety", () => {
        const html = render(<OfferDetail offer={detail} locale="en" />);
        expect(html).toContain("Daily surplus bread.");
        expect(html).toContain("Not provided");
        expect(html).toContain("The shop has not provided allergen information");
        expect(html).not.toContain("Allergen-free");
        expect(html).not.toContain("safe to eat");
    });

    it("sets both language and direction for Arabic offer detail", () => {
        const html = render(<OfferDetail offer={detail} locale="ar" />);
        expect(html).toContain('lang="ar"');
        expect(html).toContain('dir="rtl"');
        expect(html).toContain("لم يقدّم المتجر هذه المعلومات.");
        expect(html).toContain('<bdi dir="auto">');
    });

    it("renders both empty variants with a clear reset only when filters are active", () => {
        const empty = render(<OfferEmptyState locale="fr" />);
        const filtered = render(<OfferEmptyState locale="en" href="/en/offers" filtered />);
        expect(empty).toContain("Votre quartier prépare ses prochains paniers.");
        expect(empty).not.toContain("Afficher tous les paniers");
        expect(filtered).toContain("No baskets match these filters.");
        expect(filtered).toContain("/en/offers");
        expect(filtered).toContain("Show all baskets");
    });

    it("renders an accessible localized retry state", () => {
        const html = render(<OfferErrorState locale="en" href="/en/offers?city=Casablanca" />);
        expect(html).toContain('role="alert"');
        expect(html).toContain("We couldn’t load the baskets");
        expect(html).toContain("Try again");
        expect(html).toContain('action="/en/offers"');
        expect(html).toContain('name="city" value="Casablanca"');
    });

    it("renders card-shaped skeletons and localized announcements", () => {
        const html = render(<OfferLoadingState locale="ar" />);
        expect(html).toContain('aria-busy="true"');
        expect(html).toContain("جارٍ تحميل السلال");
        expect(html.match(/kulha-offer-skeleton/g)).toHaveLength(4);
        expect(html).toContain("kulha-offers-loading-page");
        expect(html).toContain("kulha-loading-categories");
        expect(html).toContain("kulha-loading-refine-row");
        expect(html).toContain("kulha-loading-search");
        expect(html).toContain("kulha-loading-results-title");
        expect(html).toContain("kulha-skeleton-art");
        expect(html).toContain("kulha-skeleton-pickup");
        expect(html).toContain("kulha-skeleton-price");
    });

    it("renders filter controls and removable active-filter URLs", () => {
        const filterProps = {
            locale: "ar" as const,
            values: {
                q: "خبز",
                category: "BREAD_PASTRY",
                city: "الدار البيضاء",
                maxPriceMinor: "1250",
                availableOnly: "false",
            },
        };
        const html = render(<><OfferFilterBar {...filterProps} pickupRanges={pickupRanges} /><OfferActiveFilters {...filterProps} /></>);
        expect(html).toContain('name="category"');
        expect(html).toContain('name="district"');
        expect(html).toContain('name="maxPriceMinor"');
        expect(html).toContain('name="pickupFromLocal"');
        expect(html).toContain('name="pickupFrom"');
        expect(html).toContain('class="kulha-area-form"');
        expect(html).toContain("المنطقة");
        expect(html).toContain("عوامل التصفية النشطة");
        expect(html).toContain("إظهار السلال النافدة");
        expect(html).toContain("q=%D8%AE%D8%A8%D8%B2");
        expect(html).toContain("category=BREAD_PASTRY");
        expect(html).toContain("availableOnly=false");
        expect(html).toContain('aria-label="عوامل تصفية السلال"');
        expect(html).toContain('class="kulha-custom-filter-disclosure"');
        expect(html).toContain('href="/ar/offers?category=BREAD_PASTRY&amp;maxPriceMinor=1250');
        expect(html).toContain('href="/ar/offers?q=%D8%AE%D8%A8%D8%B2&amp;category=BREAD_PASTRY&amp;city=');
        expect(html).toContain('<bdi dir="auto">');
        const filterForm = html.match(/<form\b(?=[^>]*class="kulha-area-form")[^>]*>([\s\S]*?)<\/form>/);
        expect(filterForm).not.toBeNull();
        expect(filterForm?.[0]).toContain('action="/ar/offers"');
        expect(filterForm?.[0]).toContain('aria-label="عوامل تصفية السلال"');
        const availabilityInput = filterForm?.[1].match(/<input\b[^>]*name="availableOnly"[^>]*>/)?.[0] ?? "";
        expect(availabilityInput).not.toBe("");
        expect(availabilityInput).toContain('value="false"');
        expect(availabilityInput).toContain('checked=""');
        expect(filterForm?.[1].match(/name="availableOnly"/g)).toHaveLength(1);
        expect(filterForm?.[1]).not.toContain('class="kulha-custom-filter-disclosure" open');
    });
    it("keeps the advanced location and custom-time fields available in a native GET form", () => {
        const html = render(<OfferFilterBar locale="en" values={{ city: "Casablanca", maxPriceMinor: "2500" }} pickupRanges={pickupRanges} />);
        expect(html).toContain('class="kulha-custom-filter-disclosure"');
        expect(html).toContain("Custom pickup time");
        expect(html).toContain("All areas");
        expect(html).toContain('name="city" value="Casablanca"');
        expect(html).toContain('name="pickupFromLocal"');
        expect(html).toContain('name="pickupFrom"');
        expect(html).toContain("Casablanca");
        expect(html).toContain("Under");
        expect(html).toContain("Tonight");
    });

    it("renders the search field immediately with a clear action and truthful suggestion ARIA", () => {
        const empty = render(<OfferSearchDisclosure locale="en" values={{}} />);
        expect(empty).toContain('class="kulha-offers-search kulha-search-expanded"');
        expect(empty).toContain('id="kulha-offer-search"');
        expect(empty).not.toContain('aria-controls="kulha-offer-suggestions"');
        expect(empty).toContain('aria-expanded="false"');
        expect(empty).not.toContain('autoFocus');

        const query = render(<OfferSearchDisclosure locale="ar" values={{ q: "خبز" }} />);
        expect(query).toContain('value="خبز"');
        expect(query).toContain("مسح البحث");
        expect(query).toContain('aria-expanded="false"');
        expect(query).not.toContain("إغلاق البحث");
        expect(query).toContain("<svg");
    });


    it("keeps suggestions out of document flow and advanced filters inline", () => {
        const css = readFileSync("src/app/globals.css", "utf8");
        // Suggestions float over the page (absolute overlay) instead of pushing the results down.
        const suggestionRules = (css.match(/^\.kulha-search-suggestions \{[^}]*\}/gm) ?? []).join("\n");
        expect(suggestionRules).toContain("position: absolute");
        expect(suggestionRules).toContain("inset-inline: 0");
        expect(suggestionRules).toContain("overflow-y: auto");
        expect(css).toContain("max-height: min(320px, 52dvh)");
        // The advanced (custom time) filters stay inline in the panel instead of floating.
        expect(css).toMatch(/\.kulha-custom-filter-disclosure \.kulha-filter-desktop \{[^}]*position: static/);
    });

});