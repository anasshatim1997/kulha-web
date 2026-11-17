import type { OfferSearch, PublicOfferPage } from "@/lib/offers/public-api";

export type NearbyOfferRequest = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  q?: string;
  category?: string;
  maxPriceMinor?: number;
  pickupFrom?: string;
  pickupTo?: string;
  city?: string;
  district?: string;
  availableOnly: boolean;
  page: number;
  size: number;
};

export async function searchOffersForMap(search: OfferSearch): Promise<PublicOfferPage> {
  const query = new URLSearchParams();
  for (const key of ["q", "category", "maxPriceMinor", "pickupFrom", "pickupTo", "city", "district", "sort"] as const) {
    const value = search[key];
    if (value) query.set(key, value);
  }
  query.set("availableOnly", "true");
  query.set("page", search.page ?? "0");
  query.set("size", search.size ?? "50");
  const response = await fetch(`/api/bff/offers?${query.toString()}`, {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`PUBLIC_OFFERS_MAP_${response.status}`);
  return await response.json() as PublicOfferPage;
}

export async function searchNearbyOffers(request: NearbyOfferRequest): Promise<PublicOfferPage> {
  const response = await fetch("/api/bff/offers/nearby", {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error(`PUBLIC_OFFERS_NEARBY_${response.status}`);
  return await response.json() as PublicOfferPage;
}


export type RouteMode = "driving" | "walking";

export type DrivingRoute = {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  /** true when drawn as a straight-line estimate because no routing service answered */
  approximate?: boolean;
  /** the real start/end (routers snap the line to the nearest road, so the line alone stops short) */
  endpoints?: { origin: [number, number]; destination: [number, number] };
};

const routeRequests = new Map<string, { at: number; promise: Promise<DrivingRoute> }>();
const ROUTE_CLIENT_TTL_MS = 5 * 60_000;

export function getDrivingRoute(origin: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }, mode: RouteMode = "driving"): Promise<DrivingRoute> {
  // Same trip within ~11 m is shared (also lets the map warm a route before the person asks for it).
  const key = `${mode}:${origin.latitude.toFixed(4)},${origin.longitude.toFixed(4)}>${destination.latitude.toFixed(4)},${destination.longitude.toFixed(4)}`;
  const existing = routeRequests.get(key);
  if (existing && Date.now() - existing.at < ROUTE_CLIENT_TTL_MS) return existing.promise;
  const promise = requestRoute(origin, destination, mode);
  routeRequests.set(key, { at: Date.now(), promise });
  promise.catch(() => { if (routeRequests.get(key)?.promise === promise) routeRequests.delete(key); });
  if (routeRequests.size > 60) routeRequests.delete(routeRequests.keys().next().value as string);
  return promise;
}

async function requestRoute(origin: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }, mode: RouteMode): Promise<DrivingRoute> {
  const response = await fetch("/api/bff/map/route", {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ origin, destination, mode }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`MAP_ROUTE_${response.status}`);
  return await response.json() as DrivingRoute;
}
