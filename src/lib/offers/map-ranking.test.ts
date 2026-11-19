import { describe, expect, it } from "vitest";
import {
  groupOffersIntoMapStores,
  groupOffersWithoutCoordinates,
  initialMapZoom,
  MAP_STORE_AVATAR_MIN_ZOOM,
  MAP_STORE_CLUSTER_MAX_ZOOM,
  scoreMapOffer,
  shouldShowMapStoreAvatars,
} from "./map-ranking";
import type { PublicOffer } from "./public-api";

const now = Date.parse("2026-11-08T12:00:00Z");

function offer(overrides: Partial<PublicOffer> = {}): PublicOffer {
  return {
    id: "offer-1",
    title: "Daily basket",
    category: "GROCERIES",
    priceMinor: 1200,
    originalPriceMinor: 2000,
    quantityTotal: 5,
    availableUnits: 4,
    pickupStart: "2026-11-08T13:00:00Z",
    pickupEnd: "2026-11-08T16:00:00Z",
    merchant: {
      name: "Maarif Market",
      address: "1 Main Street",
      city: "Casablanca",
      district: "Maarif",
      pickupInstructions: null,
      latitude: 33.589,
      longitude: -7.62,
    },
    distanceKm: 0.8,
    ...overrides,
  };
}

describe("offer map recommendations", () => {
  it("groups offers by pinned shop and selects the strongest value algorithmically", () => {
    const better = offer({ id: "better", title: "Discounted fresh basket", priceMinor: 900, originalPriceMinor: 1800, availableUnits: 5 });
    const cheaper = offer({ id: "cheaper", title: "Small basket", priceMinor: 500, originalPriceMinor: null, availableUnits: 1, pickupEnd: "2026-11-11T12:00:00Z" });
    const anotherShop = offer({
      id: "other", merchant: { ...offer().merchant, name: "Gauthier Shop", latitude: 33.59, longitude: -7.621 },
    });
    const unpinned = offer({ id: "unpinned", merchant: { ...offer().merchant, latitude: null, longitude: null } });

    const stores = groupOffersIntoMapStores([cheaper, better, anotherShop, unpinned], now);

    expect(stores).toHaveLength(2);
    const maarif = stores.find((store) => store.merchant.name === "Maarif Market");
    expect(maarif?.offersCount).toBe(2);
    expect(maarif?.bestOffer.id).toBe("better");
    expect(maarif?.bestOfferScore).toBeGreaterThan(scoreMapOffer(cheaper, now));
  });

  it("does not recommend sold-out or expired offers", () => {
    const soldOut = offer({ id: "sold-out", availableUnits: 0 });
    const expired = offer({ id: "expired", pickupEnd: "2026-11-08T11:59:00Z" });
    const available = offer({ id: "available", title: "Still available" });

    const stores = groupOffersIntoMapStores([soldOut, expired, available], now);

    expect(stores).toHaveLength(1);
    expect(stores[0].bestOffer.id).toBe("available");
    expect(stores[0].offersCount).toBe(1);
  });

  it("ignores invalid coordinates and sorts pinned shops nearest-first", () => {
    const nearest = offer({ id: "near", distanceKm: 0.2 });
    const farther = offer({
      id: "far",
      distanceKm: 2.4,
      merchant: { ...offer().merchant, name: "Far Shop", latitude: 33.6, longitude: -7.63 },
    });
    const invalid = offer({
      id: "invalid",
      merchant: { ...offer().merchant, name: "Invalid Shop", latitude: 93, longitude: -7.63 },
    });

    expect(groupOffersIntoMapStores([farther, invalid, nearest], now).map((store) => store.bestOffer.id)).toEqual(["near", "far"]);
  });
});

it("keeps eligible shops without GPS coordinates visible as map-list candidates", () => {
  const unpinned = offer({
    id: "unpinned-one",
    merchant: { ...offer().merchant, latitude: null, longitude: null },
  });
  const exhausted = offer({ id: "unpinned-sold-out", availableUnits: 0, merchant: { ...offer().merchant, latitude: null, longitude: null } });
  const candidates = groupOffersWithoutCoordinates([unpinned, exhausted], now);
  expect(candidates).toHaveLength(1);
  expect(candidates[0].merchant.name).toBe("Maarif Market");
  expect(candidates[0].bestOffer.id).toBe("unpinned-one");
});


describe("offer map initial viewport", () => {
  it("fits a country-wide set of Moroccan stores instead of zooming into one city", () => {
    const zoom = initialMapZoom([
      { latitude: 35.7595, longitude: -5.8340 },
      { latitude: 34.0209, longitude: -6.8416 },
      { latitude: 31.6295, longitude: -7.9811 },
      { latitude: 30.4278, longitude: -9.5981 },
      { latitude: 34.0331, longitude: -5.0003 },
    ]);

    expect(zoom).toBeGreaterThanOrEqual(5);
    expect(zoom).toBeLessThanOrEqual(7);
  });

  it("zooms into a city when store locations are close together", () => {
    const zoom = initialMapZoom([
      { latitude: 33.5890, longitude: -7.6200 },
      { latitude: 33.5960, longitude: -7.6100 },
      { latitude: 33.5830, longitude: -7.6300 },
    ]);

    expect(zoom).toBeGreaterThanOrEqual(12);
    expect(zoom).toBeLessThanOrEqual(14);
  });

  it("uses the close-up default for a single store", () => {
    expect(initialMapZoom([{ latitude: 33.5890, longitude: -7.6200 }])).toBe(14);
  });
});


describe("map store avatar visibility", () => {
  it("switches from clusters to individual shop avatars at city zoom", () => {
    expect(MAP_STORE_CLUSTER_MAX_ZOOM).toBe(11);
    expect(MAP_STORE_AVATAR_MIN_ZOOM).toBe(12);
    expect(shouldShowMapStoreAvatars(11.99)).toBe(false);
    expect(shouldShowMapStoreAvatars(12)).toBe(true);
    expect(shouldShowMapStoreAvatars(14)).toBe(true);
  });

  it("does not show individual avatars for an invalid zoom", () => {
    expect(shouldShowMapStoreAvatars(Number.NaN)).toBe(false);
    expect(shouldShowMapStoreAvatars(Number.POSITIVE_INFINITY)).toBe(false);
  });
});
