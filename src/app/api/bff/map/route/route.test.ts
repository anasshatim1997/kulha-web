import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/config", () => ({ getConfig: () => ({ appOrigin: "http://localhost:3000" }) }));
vi.mock("@/lib/security/origin", () => ({ isTrustedMutation: (headers: Headers, appOrigin: string) => headers.get("origin") === appOrigin }));

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

function request(body: unknown): NextRequest {
    return new Request("http://localhost:3000/api/bff/map/route", {
        method: "POST",
        headers: { origin: "http://localhost:3000", "content-type": "application/json" },
        body: JSON.stringify(body),
    }) as NextRequest;
}

describe("map driving route endpoint", () => {
    it("rejects invalid coordinates without contacting the router", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        const response = await POST(request({ origin: { latitude: 120, longitude: 0 }, destination: { latitude: 33, longitude: -7 } }));
        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns a validated driving geometry and route metrics", async () => {
        vi.stubEnv("KULHA_ROUTING_URL", "http://127.0.0.1:5000/route/v1/driving");
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
            code: "Ok",
            routes: [{ distance: 2300, duration: 540, geometry: { type: "LineString", coordinates: [[-7.59, 33.57], [-7.6, 33.58]] } }],
        }), { status: 200, headers: { "content-type": "application/json" } }));
        vi.stubGlobal("fetch", fetchMock);
        const response = await POST(request({ origin: { latitude: 33.573, longitude: -7.593 }, destination: { latitude: 33.583, longitude: -7.603 } }));
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            coordinates: [[-7.59, 33.57], [-7.6, 33.58]],
            distanceMeters: 2300,
            durationSeconds: 540,
        });
        expect(fetchMock).toHaveBeenCalledOnce();
        expect(String(fetchMock.mock.calls[0][0])).toContain("-7.593,33.573;-7.603,33.583");
    });


    it("returns a pedestrian road route on the first walking request in production", async () => {
        vi.stubEnv("NODE_ENV", "production");
        vi.stubEnv("KULHA_ROUTING_FOOT_PUBLIC_FALLBACK", "1");
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
            code: "Ok",
            routes: [{ distance: 1800, duration: 1500, geometry: { type: "LineString", coordinates: [[-7.59, 33.57], [-7.595, 33.575], [-7.6, 33.58]] } }],
        }), { status: 200, headers: { "content-type": "application/json" } }));
        vi.stubGlobal("fetch", fetchMock);

        const response = await POST(request({
            origin: { latitude: 33.57, longitude: -7.59 },
            destination: { latitude: 33.58, longitude: -7.6 },
            mode: "walking",
        }));

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            coordinates: [[-7.59, 33.57], [-7.595, 33.575], [-7.6, 33.58]],
            distanceMeters: 1800,
            durationSeconds: 1500,
        });
        expect(String(fetchMock.mock.calls[0][0])).toContain("routed-foot/route/v1/driving/");
    });

    it("uses the public car router when the private router is unavailable in production", async () => {
        vi.stubEnv("NODE_ENV", "production");
        vi.stubEnv("KULHA_ROUTING_URL", "https://private-router.example/route/v1/driving");
        const fetchMock = vi.fn((input: string | URL | Request) => {
            if (String(input).startsWith("https://private-router.example/")) return Promise.reject(new Error("private router unavailable"));
            return Promise.resolve(new Response(JSON.stringify({
                code: "Ok",
                routes: [{ distance: 2600, duration: 600, geometry: { type: "LineString", coordinates: [[-7.59, 33.57], [-7.6, 33.58]] } }],
            }), { status: 200, headers: { "content-type": "application/json" } }));
        });
        vi.stubGlobal("fetch", fetchMock);

        const response = await POST(request({
            origin: { latitude: 33.571, longitude: -7.591 },
            destination: { latitude: 33.581, longitude: -7.601 },
            mode: "driving",
        }));

        expect(response.status).toBe(200);
        expect(fetchMock.mock.calls.some(([url]) => String(url).startsWith("https://routing.openstreetmap.de/routed-car/"))).toBe(true);
    });

    it("can disable public routing in production", async () => {
        vi.stubEnv("NODE_ENV", "production");
        vi.stubEnv("KULHA_ROUTING_PUBLIC_FALLBACK", "0");
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        const response = await POST(request({
            origin: { latitude: 33.572, longitude: -7.592 },
            destination: { latitude: 33.582, longitude: -7.602 },
            mode: "walking",
        }));

        expect(response.status).toBe(503);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("does not disclose router errors to the browser", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private router host details")));
        const response = await POST(request({ origin: { latitude: 33.57, longitude: -7.59 }, destination: { latitude: 33.58, longitude: -7.6 } }));
        expect(response.status).toBe(503);
        await expect(response.json()).resolves.toEqual({ error: "ROUTING_UNAVAILABLE" });
    });
});