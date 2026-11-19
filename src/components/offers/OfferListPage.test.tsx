import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OfferListPage } from "@/components/offers/OfferListPage";

const { listPublicOffersMock, routerPushMock } = vi.hoisted(() => ({ listPublicOffersMock: vi.fn(), routerPushMock: vi.fn() }));

vi.mock("@/lib/offers/public-api", () => ({ listPublicOffers: listPublicOffersMock }));
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: routerPushMock }),
    usePathname: () => "/en/offers",
    useSearchParams: () => new URLSearchParams(),
}));

const offerPage = {
    items: [{
        id: "a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1",
        title: "سلة خبز",
        category: "BREAD_PASTRY",
        priceMinor: 1250,
        originalPriceMinor: null,
        quantityTotal: 4,
        availableUnits: 3,
        pickupStart: "2026-11-10T14:00:00Z",
        pickupEnd: "2026-11-10T16:00:00Z",
        merchant: { name: "مخبزة الحي", address: "شارع السوق", city: "الدار البيضاء", district: "المعاريف", pickupInstructions: null },
    }],
    page: 0,
    size: 20,
    total: 1,
};

describe("public offer list page", () => {
    beforeEach(() => {
        // Braces matter: returning the mock makes Vitest call it as a teardown hook after each test.
        listPublicOffersMock.mockResolvedValue(offerPage);
    });

    it("renders Arabic discovery with document-language subtree, RTL and the one-offer treatment", async () => {
        const page = await OfferListPage({ locale: "ar", params: {} });
        const html = renderToStaticMarkup(page);
        expect(html).toContain('lang="ar"');
        expect(html).toContain('dir="rtl"');
        expect(html).toContain("السلال المتاحة");
        expect(html).toContain('<bdi dir="auto">1</bdi> سلة');
        expect(html).toContain("سلة خبز");
        expect(html).toContain("موعد الاستلام");
        expect(html).not.toContain("دليل KULHA!");
        expect(html).not.toContain("الحجز سيأتي قريباً");
        expect(html).not.toContain('class="kulha-booking-note"');
        expect(html).not.toContain('class="kulha-active-filters"');
        expect(html).not.toContain('aria-live="polite"><div class="kulha-results-heading"');
        expect(html).not.toContain("الاستلام من المتجر فقط");
        expect(html).not.toContain("سلال من فائض المتاجر المحلية بأسعار أفضل.");
        expect(html).toContain('class="kulha-offer-grid"');
        expect(html).toContain("الخريطة");
    });

    it("keeps categories in the sidebar and renders filters inline without a modal", async () => {
        const page = await OfferListPage({ locale: "fr", params: {} });
        const html = renderToStaticMarkup(page);
        const heroEnd = html.indexOf("</section>", html.indexOf('class="kulha-offers-hero"'));
        const sidebarStart = html.indexOf('class="kulha-marketplace-sidebar"');
        const sidebarEnd = html.indexOf('</aside>', sidebarStart);
        const toolbarStart = html.indexOf('class="kulha-offers-toolbar"');
        const resultsStart = html.indexOf('class="kulha-offers-results"');
        expect(sidebarStart).toBeGreaterThan(heroEnd);
        expect(sidebarEnd).toBeGreaterThan(sidebarStart);
        expect(html.slice(sidebarStart, sidebarEnd)).toContain('class="kulha-category-nav"');
        expect(html.slice(sidebarStart, sidebarEnd)).not.toContain('class="kulha-filter-shell"');
        expect(html.slice(sidebarStart, sidebarEnd)).not.toContain('class="kulha-area-form"');
        expect(html.slice(toolbarStart, resultsStart)).toContain('class="kulha-search-disclosure"');
        expect(html.slice(toolbarStart, resultsStart)).toContain('class="kulha-filter-shell kulha-inline-filter-bar"');
        expect(html.slice(toolbarStart, resultsStart)).not.toContain('class="kulha-filter-sheet"');
    });

    it("renders desktop categories, the always-visible search field, quick filters and the responsive card grid", async () => {
        listPublicOffersMock.mockResolvedValue({ ...offerPage, items: [offerPage.items[0], { ...offerPage.items[0], id: "second", title: "سلة فواكه" }, { ...offerPage.items[0], id: "third", title: "وجبة اليوم" }], total: 3 });
        const page = await OfferListPage({ locale: "fr", params: { q: "msemen" } });
        const html = renderToStaticMarkup(page);
        expect(html).toContain('class="kulha-marketplace-sidebar"');
        expect(html).not.toContain('class="kulha-sidebar-toggle"');
        expect(html).toContain('class="kulha-category-nav"');
        expect(html).toContain('class="kulha-search-disclosure"');
        expect(html).toContain('class="kulha-offers-search kulha-search-expanded"');
        expect(html).toContain('class="kulha-filter-shell kulha-inline-filter-bar"');
        expect(html).not.toContain('class="kulha-filter-sheet"');
        expect(html).toContain('class="kulha-area-form"');
        expect(html).not.toContain('class="kulha-booking-note"');
        expect(html).not.toContain('kulha-category-nav-mobile');
        expect(html).toContain("Rechercher un panier, un commerce ou un aliment");
        expect(html).toContain("Maintenant");
        expect(html).toContain("Ce soir");
        expect(html).toContain("Demain");
        expect(html).toContain("Moins de");
        expect(html).not.toContain("Retrait en magasin uniquement");
        expect(html).toContain('class="kulha-offer-grid"');
        expect(html).toContain("msemen");
        expect(html).toContain("Carte");
    });

    it("keeps the discovery page focused without a floating help button or booking banner", async () => {
        const page = await OfferListPage({ locale: "fr", params: {} });
        const html = renderToStaticMarkup(page);
        expect(html).not.toContain("Besoin d’aide ?");
        expect(html).not.toContain("LE GUIDE KULHA!");
        expect(html).not.toContain("rescue-help-disclosure");
        expect(html).not.toContain("La découverte est ouverte. La réservation arrive bientôt.");
    });

    it("renders the search input on first load without autofocus and keeps existing query values", async () => {
        const freshPage = await OfferListPage({ locale: "en", params: {} });
        const freshHtml = renderToStaticMarkup(freshPage);
        expect(freshHtml).toContain('class="kulha-offers-search kulha-search-expanded"');
        expect(freshHtml).toContain('id="kulha-offer-search"');
        expect(freshHtml).not.toContain("autoFocus");
        expect(freshHtml).not.toContain('class="kulha-search-trigger"');

        const searchedPage = await OfferListPage({ locale: "en", params: { q: "bread" } });
        const searchedHtml = renderToStaticMarkup(searchedPage);
        expect(searchedHtml).toContain('value="bread"');
        expect(searchedHtml).toContain('aria-expanded="false"');
    });

    it("renders a single category list inside the responsive filter sidebar", async () => {
        const page = await OfferListPage({ locale: "fr", params: {} });
        const html = renderToStaticMarkup(page);
        expect(html).toContain('class="kulha-marketplace-layout"');
        expect(html).toContain('class="kulha-marketplace-sidebar"');
        expect(html).toContain("class=\"kulha-category-nav\"");
        expect(html.match(/class=\"kulha-category-nav\"/g)).toHaveLength(1);
        expect(html).toContain("Explorez par catégorie");
    });

    it("renders progressive loading while preserving the URL filters", async () => {
        listPublicOffersMock.mockResolvedValue({ ...offerPage, page: 0, size: 1, total: 2 });
        const page = await OfferListPage({ locale: "fr", params: { city: "Casablanca", page: "0", size: "1" } });
        const html = renderToStaticMarkup(page);
        expect(html).toContain("Affichage de 1 sur 2 paniers");
        expect(html).toContain("Voir plus de paniers");
        expect(html).not.toContain('class="kulha-pagination"');
        expect(html).toContain("city=Casablanca");
        expect(html).not.toContain("page=1");
        expect(html).toContain("page=0");
    });

    it("renders an empty state when the API returns no offers", async () => {
        listPublicOffersMock.mockResolvedValue({ items: [], page: 0, size: 20, total: 0 });
        const page = await OfferListPage({ locale: "fr", params: {} });
        const html = renderToStaticMarkup(page);
        expect(html).toContain("Votre quartier prépare ses prochains paniers.");
        expect(html).not.toContain("Afficher tous les paniers");
    });

    it("renders a filter-specific empty state with a reset action", async () => {
        listPublicOffersMock.mockResolvedValue({ items: [], page: 0, size: 20, total: 0 });
        const page = await OfferListPage({ locale: "en", params: { city: "Rabat" } });
        const html = renderToStaticMarkup(page);
        expect(html).toContain("No baskets match these filters.");
        expect(html).toContain("Show all baskets");
    });

    it("renders the error state and preserves the current query for retry", async () => {
        // The API adapter may fail before returning a promise as well as reject one.
        listPublicOffersMock.mockImplementation(() => { throw new Error("private upstream error"); });
        const page = await OfferListPage({ locale: "en", params: { city: "Casablanca", page: "2" } });
        const html = renderToStaticMarkup(page);
        expect(html).toContain('role="alert"');
        expect(html).toContain("We couldn’t load the baskets");
        expect(html).toContain('action="/en/offers"');
        expect(html).toContain('name="city" value="Casablanca"');
        expect(html).toContain('name="page" value="0"');
        expect(html).not.toContain("private upstream error");
    });

    it("renders the same safe retry state when the API promise rejects", async () => {
        listPublicOffersMock.mockRejectedValue(new Error("private upstream error"));
        const page = await OfferListPage({ locale: "en", params: { q: "bread" } });
        const html = renderToStaticMarkup(page);
        expect(html).toContain('role="alert"');
        expect(html).toContain("We couldn’t load the baskets");
        expect(html).toContain('name="q" value="bread"');
        expect(html).not.toContain("private upstream error");
    });
});