import type { NextRequest } from "next/server";
import { getConfig } from "@/lib/config";
import { isTrustedMutation } from "@/lib/security/origin";

export const runtime = "nodejs";

const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
const geocodeCache = new Map<string, { expiresAt: number; location: GeocodeLocation | null }>();
let requestQueue: Promise<unknown> = Promise.resolve();
let lastUpstreamRequestAt = 0;

type GeocodeLocation = {
  latitude: number;
  longitude: number;
  displayName: string;
  accuracy: "address" | "street" | "area";
};

type NominatimResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
  type?: string;
  addresstype?: string;
};

function clean(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maximum) : "";
}

function accuracyOf(result: NominatimResult): GeocodeLocation["accuracy"] {
  const type = (result.addresstype ?? result.type ?? "").toLowerCase();
  if (["house", "building", "amenity", "shop", "office"].includes(type)) return "address";
  if (["road", "residential", "neighbourhood", "suburb", "quarter"].includes(type)) return "street";
  return "area";
}

async function lookup(query: string, locale: string): Promise<GeocodeLocation | null> {
  const key = query.toLocaleLowerCase();
  const cached = geocodeCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.location;

  const task = requestQueue.then(async () => {
    const secondCache = geocodeCache.get(key);
    if (secondCache && secondCache.expiresAt > Date.now()) return secondCache.location;

    const delay = Math.max(0, 1_100 - (Date.now() - lastUpstreamRequestAt));
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));

    const config = getConfig();
    const endpoint = (process.env.KULHA_OSM_GEOCODER_URL ?? "https://nominatim.openstreetmap.org/search").replace(/\/+$/, "");
    const url = new URL(endpoint);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "ma");
    url.searchParams.set("q", query);

    lastUpstreamRequestAt = Date.now();
    const contact = clean(process.env.KULHA_GEOCODING_CONTACT, 160);
    const userAgent = `KULHA! public shop map (${config.appOrigin}${contact ? `; ${contact}` : ""})`;
    const response = await fetch(url, {
      headers: { Accept: "application/json", "Accept-Language": locale, "User-Agent": userAgent, Referer: config.appOrigin },
      cache: "force-cache",
      next: { revalidate: 60 * 60 * 24 * 30 },
      signal: AbortSignal.timeout(9_000),
    });
    if (!response.ok) throw new Error(`OSM_GEOCODER_${response.status}`);
    const results = await response.json() as NominatimResult[];
    const first = Array.isArray(results) ? results[0] : undefined;
    const latitude = first ? Number(first.lat) : Number.NaN;
    const longitude = first ? Number(first.lon) : Number.NaN;
    const location = first && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
      && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
      ? {
          latitude,
          longitude,
          displayName: clean(first.display_name, 240),
          accuracy: accuracyOf(first),
        }
      : null;
    geocodeCache.set(key, { expiresAt: Date.now() + CACHE_TTL, location });
    return location;
  });

  requestQueue = task.then(() => undefined, () => undefined);
  return await task;
}

export async function POST(request: NextRequest) {
  const config = getConfig();
  if (!isTrustedMutation(request.headers, config.appOrigin)) {
    return Response.json({ error: "ORIGIN_NOT_ALLOWED" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const raw = await request.text();
  if (!raw || raw.length > 2_048) {
    return Response.json({ error: "INVALID_REQUEST" }, { status: raw ? 413 : 400, headers: { "Cache-Control": "no-store" } });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "INVALID_REQUEST" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "INVALID_REQUEST" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const input = body as Record<string, unknown>;
  const address = clean(input.address, 180);
  const district = clean(input.district, 100);
  const city = clean(input.city, 100);
  const query = [address, district, city, "Morocco"].filter(Boolean).join(", ");
  if (!query || query.length > 420) {
    return Response.json({ error: "ADDRESS_REQUIRED" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const localeValue = clean(input.locale, 5).toLowerCase();
  const locale = localeValue === "ar" ? "ar" : localeValue === "en" ? "en" : "fr";
  try {
    const location = await lookup(query, locale);
    return Response.json({ location }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "GEOCODING_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
