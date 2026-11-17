import { describe, expect, it } from "vitest";
import { buildGoogleMapsDirectionsUrl } from "./google-directions";

describe("Google Maps directions URL", () => {
  it("includes the customer's location and selected shop", () => {
    const url = new URL(buildGoogleMapsDirectionsUrl(
      { latitude: 33.5731, longitude: -7.5898 },
      { latitude: 33.5892, longitude: -7.6114 },
    ));
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps/dir/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("origin")).toBe("33.5731,-7.5898");
    expect(url.searchParams.get("destination")).toBe("33.5892,-7.6114");
    expect(url.searchParams.get("travelmode")).toBe("driving");
  });

  it("leaves the origin empty when the customer denies location access", () => {
    const url = new URL(buildGoogleMapsDirectionsUrl(null, { latitude: 33.5731, longitude: -7.5898 }));
    expect(url.searchParams.has("origin")).toBe(false);
    expect(url.searchParams.get("destination")).toBe("33.5731,-7.5898");
  });
});
