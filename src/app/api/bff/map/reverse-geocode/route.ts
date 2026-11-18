import type { NextRequest } from "next/server";
import { getConfig } from "@/lib/config";
import { isTrustedMutation } from "@/lib/security/origin";

export const runtime = "nodejs";

type ReverseResult = {
  address?: {
    neighbourhood?: string;
    suburb?: string;
    quarter?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
  };
};

const REVERSE_CACHE_TTL = 24 * 60 * 60 * 1000;
const reverseCache = new Map<string, { expiresAt: number; label: string }>();
let reverseQueue: Promise<unknown> = Promise.resolve();
let lastReverseRequestAt = 0;

function clean(value: unknown, max: number): string {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : "";
}

export async function POST(request: NextRequest) {
  const config = getConfig();
  if (!isTrustedMutation(request.headers, config.appOrigin)) {
    return Response.json({ error: "ORIGIN_NOT_ALLOWED" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const raw = await request.text();
  if (!raw || raw.length > 1_024) {
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
  const latitude = typeof input.latitude === "number" ? input.latitude : Number.NaN;
  const longitude = typeof input.longitude === "number" ? input.longitude : Number.NaN;
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return Response.json({ error: "INVALID_COORDINATES" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const localeValue = clean(input.locale, 5).toLowerCase();
  const locale = localeValue === "ar" ? "ar" : localeValue === "en" ? "en" : "fr";
  const cacheKey = `${latitude.toFixed(4)}:${longitude.toFixed(4)}:${locale}`;
  const cached = reverseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return Response.json({ label: cached.label }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const task = reverseQueue.then(async () => {
      const secondCache = reverseCache.get(cacheKey);
      if (secondCache && secondCache.expiresAt > Date.now()) return secondCache.label;
      const delay = Math.max(0, 1_100 - (Date.now() - lastReverseRequestAt));
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));

      const endpoint = (process.env.KULHA_OSM_REVERSE_GEOCODER_URL ?? "https://nominatim.openstreetmap.org/reverse").replace(/\/+$/, "");
      const url = new URL(endpoint);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("lat", String(latitude));
      url.searchParams.set("lon", String(longitude));
      url.searchParams.set("zoom", "14");
      url.searchParams.set("addressdetails", "1");
      const contact = clean(process.env.KULHA_GEOCODING_CONTACT, 160);
      const userAgent = `KULHA! location lookup (${config.appOrigin}${contact ? `; ${contact}` : ""})`;
      lastReverseRequestAt = Date.now();
      const response = await fetch(url, {
        headers: { Accept: "application/json", "Accept-Language": locale, "User-Agent": userAgent, Referer: config.appOrigin },
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new Error(`OSM_REVERSE_${response.status}`);
      const result = await response.json() as ReverseResult;
      const address = result.address ?? {};
      const city = clean(address.city ?? address.town ?? address.village ?? address.county ?? address.state, 90);
      const district = clean(address.neighbourhood ?? address.suburb ?? address.quarter ?? address.city_district, 90);
      const label = [city, district].filter(Boolean).join(" · ") || city || district;
      reverseCache.set(cacheKey, { expiresAt: Date.now() + REVERSE_CACHE_TTL, label });
      if (reverseCache.size > 2_000) {
        const oldestKey = reverseCache.keys().next().value;
        if (oldestKey) reverseCache.delete(oldestKey);
      }
      return label;
    });
    reverseQueue = task.then(() => undefined, () => undefined);
    const label = await task;
    return Response.json({ label }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "REVERSE_GEOCODING_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
