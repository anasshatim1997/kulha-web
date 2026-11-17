import type { NextRequest } from "next/server";
import { getConfig } from "@/lib/config";
import { isTrustedMutation } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ROUTE_COORDINATES = 8_000;

type RouteMode = "driving" | "walking";
// Public OSM routers are used for explicit route requests when a self-hosted profile is not
// available. Walking can use the public foot router by default; set KULHA_ROUTING_FOOT_PUBLIC_FALLBACK=0
// to disable that fallback in production. The "driving" segment in the foot URL is the OSRM API path.
const PUBLIC_ROUTERS: Record<RouteMode, string[]> = {
  driving: [
    "https://routing.openstreetmap.de/routed-car/route/v1/driving",
    "https://router.project-osrm.org/route/v1/driving",
  ],
  walking: ["https://routing.openstreetmap.de/routed-foot/route/v1/driving"],
};

// Our own router answers fast or not at all; public routers are raced against each other.
const OWN_ROUTER_TIMEOUT_MS = 4_000;
const PUBLIC_ROUTER_TIMEOUT_MS = 7_000;
const CACHE_TTL_MS = 5 * 60_000;
const CACHE_MAX_ENTRIES = 200;

type RouteResult = { coordinates: [number, number][]; distanceMeters: number; durationSeconds: number };
const routeCache = new Map<string, { at: number; value: RouteResult }>();

type Coordinate = { latitude: number; longitude: number };
type OsrmRouteResponse = {
  code?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: { type?: string; coordinates?: unknown };
  }>;
};

function isCoordinate(value: unknown): value is Coordinate {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.latitude === "number" && Number.isFinite(candidate.latitude)
    && candidate.latitude >= -90 && candidate.latitude <= 90
    && typeof candidate.longitude === "number" && Number.isFinite(candidate.longitude)
    && candidate.longitude >= -180 && candidate.longitude <= 180;
}

function simplifyCoordinates(value: unknown): [number, number][] | null {
  if (!Array.isArray(value) || value.length < 2 || value.length > 100_000) return null;
  const parsed: [number, number][] = [];
  for (const pair of value) {
    if (!Array.isArray(pair) || pair.length < 2) return null;
    const longitude = Number(pair[0]);
    const latitude = Number(pair[1]);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)
      || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null;
    parsed.push([longitude, latitude]);
  }
  if (parsed.length <= MAX_ROUTE_COORDINATES) return parsed;
  const stride = Math.ceil((parsed.length - 1) / (MAX_ROUTE_COORDINATES - 1));
  const sampled = parsed.filter((_, index) => index % stride === 0).slice(0, MAX_ROUTE_COORDINATES - 1);
  sampled.push(parsed[parsed.length - 1]);
  return sampled;
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
  if (!isCoordinate(input.origin) || !isCoordinate(input.destination)) {
    return Response.json({ error: "INVALID_COORDINATES" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const origin = input.origin;
  const destination = input.destination;
  const mode: RouteMode = input.mode === "walking" ? "walking" : "driving";
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;

  // ~11 m grid: the same walk/drive asked twice (or by a prefetch) is answered instantly.
  const cacheKey = `${mode}:${origin.latitude.toFixed(4)},${origin.longitude.toFixed(4)}>${destination.latitude.toFixed(4)},${destination.longitude.toFixed(4)}`;
  const cached = routeCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return routeResponse(cached.value);

  // 1) Your own router (private, fastest). 2) Public routers, raced in parallel (first valid answer wins).
  const own = mode === "walking"
    ? process.env.KULHA_ROUTING_FOOT_URL
    : (process.env.KULHA_ROUTING_URL ?? "http://127.0.0.1:5000/route/v1/driving");
  let noRoute = false;

  if (own) {
    try {
      return routeResponse(remember(cacheKey, await queryRouter(own, coords, OWN_ROUTER_TIMEOUT_MS)));
    } catch (error) {
      if (error instanceof NoRouteError) noRoute = true;
    }
  }

  const allowPublicFallback = process.env.NODE_ENV !== "production"
    || process.env.KULHA_ROUTING_PUBLIC_FALLBACK !== "0";

  if (allowPublicFallback) {
    const controller = new AbortController();
    try {
      const winner = await firstSuccess(PUBLIC_ROUTERS[mode].map((base) =>
        queryRouter(base, coords, PUBLIC_ROUTER_TIMEOUT_MS, controller.signal).catch((error) => {
          if (error instanceof NoRouteError) noRoute = true;
          throw error;
        })));
      controller.abort();
      return routeResponse(remember(cacheKey, winner));
    } catch {
      controller.abort();
    }
  }
  if (noRoute) return Response.json({ error: "NO_DRIVING_ROUTE" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return Response.json({ error: "ROUTING_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
}

class NoRouteError extends Error {}

function routeResponse(value: RouteResult): Response {
  return Response.json(value, { headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" } });
}

function remember(key: string, value: RouteResult): RouteResult {
  if (routeCache.size >= CACHE_MAX_ENTRIES) routeCache.delete(routeCache.keys().next().value as string);
  routeCache.set(key, { at: Date.now(), value });
  return value;
}

function firstSuccess<T>(promises: Promise<T>[]): Promise<T> {
  return new Promise((resolve, reject) => {
    let failed = 0;
    if (promises.length === 0) reject(new Error("NO_ROUTERS"));
    for (const promise of promises) {
      promise.then(resolve, () => { failed += 1; if (failed === promises.length) reject(new Error("ALL_ROUTERS_FAILED")); });
    }
  });
}

async function queryRouter(base: string, coords: string, timeoutMs: number, outer?: AbortSignal): Promise<RouteResult> {
  const signals = [AbortSignal.timeout(timeoutMs), ...(outer ? [outer] : [])];
  const upstream = await fetch(`${base.replace(/\/+$/, "")}/${coords}?overview=full&geometries=geojson&steps=false`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.any(signals),
  });
  if (!upstream.ok) throw new Error(`ROUTER_${upstream.status}`);
  const payload = await upstream.json() as OsrmRouteResponse;
  const selected = payload.code === "Ok" ? payload.routes?.[0] : undefined;
  const coordinates = simplifyCoordinates(selected?.geometry?.coordinates);
  const distanceMeters = Number(selected?.distance);
  const durationSeconds = Number(selected?.duration);
  if (!coordinates || !Number.isFinite(distanceMeters) || distanceMeters < 0
    || !Number.isFinite(durationSeconds) || durationSeconds < 0) {
    throw new NoRouteError("NO_ROUTE");
  }
  return { coordinates, distanceMeters, durationSeconds };
}
