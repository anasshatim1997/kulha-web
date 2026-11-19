import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OfferNearbyResults } from "@/components/offers/OfferNearbyResults";

const { useOfferNearbyMock } = vi.hoisted(() => ({ useOfferNearbyMock: vi.fn() }));

vi.mock("@/components/offers/OfferNearbyContext", () => ({
  useOfferNearby: useOfferNearbyMock,
}));

describe("nearby offer results", () => {
  beforeEach(() => {
    useOfferNearbyMock.mockReset();
  });

  it("keeps the normal marketplace list when no nearby search has been requested", () => {
    useOfferNearbyMock.mockReturnValue({ results: null, clearResults: vi.fn() });

    const html = renderToStaticMarkup(
      <OfferNearbyResults locale="fr"><div id="all-marketplace-offers">Tous les paniers</div></OfferNearbyResults>,
    );

    expect(html).toContain('id="all-marketplace-offers"');
    expect(html).toContain("Tous les paniers");
    expect(html).not.toContain("kulha-nearby-results");
  });

  it("keeps all marketplace offers visible when an explicit nearby search returns zero baskets", () => {
    useOfferNearbyMock.mockReturnValue({
      results: { items: [], page: 0, size: 20, total: 0 },
      clearResults: vi.fn(),
    });

    const html = renderToStaticMarkup(
      <OfferNearbyResults locale="fr"><div id="all-marketplace-offers">Tous les paniers</div></OfferNearbyResults>,
    );

    expect(html).toContain('class="kulha-nearby-empty-inline"');
    expect(html).toContain("Aucun panier dans ce rayon");
    expect(html).toContain("Tous les paniers disponibles restent affichés ci-dessous.");
    expect(html).toContain('id="all-marketplace-offers"');
    expect(html).toContain("Tous les paniers");
    expect(html).not.toContain('id="kulha-offers-results"');
    expect(html).not.toContain('class="kulha-nearby-empty"');
  });
});
