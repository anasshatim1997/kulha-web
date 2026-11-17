import { afterEach, describe, expect, it, vi } from "vitest";
import { APP_ORIGIN, jsonResponse, request, stubFetch } from "@/test/helpers";
import { POST as postMapGeocode } from "@/app/api/bff/map/geocode/route";

describe("public map geocoding", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("geocodes one customer-selected public shop address through OpenStreetMap", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse([{
      lat: "33.5891",
      lon: "-7.6212",
      display_name: "Maarif, Casablanca, Morocco",
      type: "residential",
      addresstype: "road",
    }]));

    const response = await postMapGeocode(request("/api/bff/map/geocode", {
      method: "POST",
      origin: APP_ORIGIN,
      body: { address: "Rue Example", district: "Maarif", city: "Casablanca", locale: "fr" },
    }));
    const payload = await response.json();
    const init = fetchMock.mock.calls[0][1] as RequestInit;

    expect(response.status).toBe(200);
    expect(payload.location).toMatchObject({ latitude: 33.5891, longitude: -7.6212, accuracy: "street" });
    expect(String(fetchMock.mock.calls[0][0])).toContain("countrycodes=ma");
    expect(init.headers).toMatchObject({ "Accept-Language": "fr" });
    expect(String((init.headers as Record<string, string>)["User-Agent"])).toContain("KULHA!");
  });

  it("rejects cross-origin map geocoding requests", async () => {
    const fetchMock = stubFetch();
    const response = await postMapGeocode(request("/api/bff/map/geocode", {
      method: "POST",
      origin: "https://untrusted.example",
      body: { address: "Rue Example", city: "Casablanca" },
    }));
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
