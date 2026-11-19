import type { PublicOffer } from "@/lib/offers/public-api";

export type MapCoordinate = { latitude: number; longitude: number };

export type OfferMapStoreCandidate = {
  key: string;
  merchant: PublicOffer["merchant"];
  offers: PublicOffer[];
  offersCount: number;
  bestOffer: PublicOffer;
  bestOfferScore: number;
};

export type OfferMapStore = OfferMapStoreCandidate & {
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  positionAccuracy?: "verified" | "approximate";
};

/**
 * At country scale, aggregate nearby shops into count clusters. Once the map
 * reaches city scale, switch to one readable avatar/initial pin per shop.
 */
export const MAP_STORE_CLUSTER_MAX_ZOOM = 9;
export const MAP_STORE_AVATAR_MIN_ZOOM = MAP_STORE_CLUSTER_MAX_ZOOM + 1;

export function shouldShowMapStoreAvatars(zoom: number): boolean {
  return Number.isFinite(zoom) && zoom >= MAP_STORE_AVATAR_MIN_ZOOM;
}

type PriceRange = { minimum: number; maximum: number };

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function scoreMapOffer(offer: PublicOffer, now = Date.now(), priceRange?: PriceRange): number {
  const original = offer.originalPriceMinor;
  const discount = original && original > offer.priceMinor ? (original - offer.priceMinor) / original : 0;
  const discountScore = clamp(discount / 0.5);
  const affordabilityScore = priceRange
    ? priceRange.maximum === priceRange.minimum
      ? 0.7
      : 1 - clamp((offer.priceMinor - priceRange.minimum) / (priceRange.maximum - priceRange.minimum))
    : 1 - clamp(offer.priceMinor / 20_000);
  const stockCountScore = clamp(offer.availableUnits / 5);
  const stockRatioScore = offer.quantityTotal > 0 ? clamp(offer.availableUnits / offer.quantityTotal) : 0;
  const stockScore = stockCountScore * 0.6 + stockRatioScore * 0.4;
  const pickupEnd = Date.parse(offer.pickupEnd);
  const hoursRemaining = Number.isFinite(pickupEnd) ? (pickupEnd - now) / 3_600_000 : Number.NaN;
  const pickupScore = Number.isFinite(hoursRemaining) && hoursRemaining > 0 ? 1 - clamp(hoursRemaining / 72) : 0;
  return discountScore * 0.35 + affordabilityScore * 0.25 + stockScore * 0.2 + pickupScore * 0.2;
}

function compareOffers(left: PublicOffer, right: PublicOffer, now: number, priceRange: PriceRange): number {
  const scoreDelta = scoreMapOffer(right, now, priceRange) - scoreMapOffer(left, now, priceRange);
  if (Math.abs(scoreDelta) > 0.000001) return scoreDelta;
  const leftEnd = Date.parse(left.pickupEnd);
  const rightEnd = Date.parse(right.pickupEnd);
  if (Number.isFinite(leftEnd) && Number.isFinite(rightEnd) && leftEnd !== rightEnd) return leftEnd - rightEnd;
  if (left.priceMinor !== right.priceMinor) return left.priceMinor - right.priceMinor;
  return left.title.localeCompare(right.title);
}

function isEligibleOffer(offer: PublicOffer, now: number): boolean {
  const pickupEnd = Date.parse(offer.pickupEnd);
  return Number.isFinite(offer.availableUnits) && offer.availableUnits > 0
    && Number.isFinite(pickupEnd) && pickupEnd > now;
}

export function hasMapCoordinates(offer: PublicOffer): boolean {
  const latitude = offer.merchant.latitude;
  const longitude = offer.merchant.longitude;
  return typeof latitude === "number" && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && typeof longitude === "number" && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

function merchantKey(offer: PublicOffer): string {
  return [offer.merchant.name, offer.merchant.address, offer.merchant.district ?? "", offer.merchant.city]
    .map((value) => value.trim().toLocaleLowerCase())
    .join("|");
}

function pinnedStoreKey(offer: PublicOffer): string {
  return `${merchantKey(offer)}:${(offer.merchant.latitude as number).toFixed(5)}:${(offer.merchant.longitude as number).toFixed(5)}`;
}

function makeCandidate(key: string, group: PublicOffer[], now: number): OfferMapStoreCandidate {
  const prices = group.map((offer) => offer.priceMinor);
  const priceRange = { minimum: Math.min(...prices), maximum: Math.max(...prices) };
  const ordered = [...group].sort((left, right) => compareOffers(left, right, now, priceRange));
  const bestOffer = ordered[0];
  return {
    key,
    merchant: bestOffer.merchant,
    offers: group,
    offersCount: group.length,
    bestOffer,
    bestOfferScore: scoreMapOffer(bestOffer, now, priceRange),
  };
}

function distanceBetween(left: MapCoordinate, right: MapCoordinate): number {
  const radians = (value: number) => value * Math.PI / 180;
  const latitudeDelta = radians(right.latitude - left.latitude);
  const longitudeDelta = radians(right.longitude - left.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(left.latitude)) * Math.cos(radians(right.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function groupOffersIntoMapStores(offers: PublicOffer[], now = Date.now(), origin?: MapCoordinate): OfferMapStore[] {
  const groups = new Map<string, PublicOffer[]>();
  for (const offer of offers) {
    if (!isEligibleOffer(offer, now) || !hasMapCoordinates(offer)) continue;
    const key = pinnedStoreKey(offer);
    const group = groups.get(key);
    if (group) group.push(offer);
    else groups.set(key, [offer]);
  }

  return [...groups.entries()].map(([key, group]) => {
    const candidate = makeCandidate(key, group, now);
    const latitude = candidate.merchant.latitude as number;
    const longitude = candidate.merchant.longitude as number;
    const distances = group.map((offer) => offer.distanceKm).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const distanceKm = origin
      ? distanceBetween(origin, { latitude, longitude })
      : distances.length ? Math.min(...distances) : null;
    return { ...candidate, latitude, longitude, distanceKm, positionAccuracy: "verified" as const };
  }).sort((left, right) => {
    if (left.distanceKm !== null && right.distanceKm !== null && left.distanceKm !== right.distanceKm) return left.distanceKm - right.distanceKm;
    if (left.distanceKm !== null) return -1;
    if (right.distanceKm !== null) return 1;
    return left.merchant.name.localeCompare(right.merchant.name);
  });
}

export function groupOffersWithoutCoordinates(offers: PublicOffer[], now = Date.now()): OfferMapStoreCandidate[] {
  const groups = new Map<string, PublicOffer[]>();
  for (const offer of offers) {
    if (!isEligibleOffer(offer, now) || hasMapCoordinates(offer)) continue;
    const key = merchantKey(offer);
    const group = groups.get(key);
    if (group) group.push(offer);
    else groups.set(key, [offer]);
  }
  return [...groups.entries()].map(([key, group]) => makeCandidate(key, group, now))
    .sort((left, right) => left.merchant.name.localeCompare(right.merchant.name));
}

export function averageMapCoordinate(points: MapCoordinate[]): MapCoordinate | null {
  if (points.length === 0) return null;
  return {
    latitude: points.reduce((sum, point) => sum + point.latitude, 0) / points.length,
    longitude: points.reduce((sum, point) => sum + point.longitude, 0) / points.length,
  };
}

/**
 * Pick a useful first viewport from the actual geographic spread.
 * A fixed zoom for every multi-city catalogue leaves most Moroccan stores
 * outside the viewport; this keeps national views wide and city views close.
 */
export function initialMapZoom(points: MapCoordinate[]): number {
  if (points.length < 2) return 14;

  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const latitudeSpan = Math.max(...latitudes) - Math.min(...latitudes);
  const meanLatitude = (Math.max(...latitudes) + Math.min(...latitudes)) / 2;
  const longitudeSpan = (Math.max(...longitudes) - Math.min(...longitudes))
    * Math.cos(meanLatitude * Math.PI / 180);
  const geographicSpan = Math.max(latitudeSpan, longitudeSpan);

  if (!Number.isFinite(geographicSpan) || geographicSpan <= 0.0001) return 14;

  // Approximately fit 70–75% of a typical map viewport, then cap the zoom
  // so dense locations remain explorable rather than jumping into the street.
  const zoom = Math.log2(520 / geographicSpan);
  return Math.max(5, Math.min(14, zoom));
}

