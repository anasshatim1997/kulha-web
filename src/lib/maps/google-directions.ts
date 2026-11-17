export type DirectionsCoordinate = { latitude: number; longitude: number };

export function buildGoogleMapsDirectionsUrl(origin: DirectionsCoordinate | null, destination: DirectionsCoordinate, mode: "driving" | "walking" = "driving"): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  if (origin) url.searchParams.set("origin", `${origin.latitude},${origin.longitude}`);
  url.searchParams.set("destination", `${destination.latitude},${destination.longitude}`);
  url.searchParams.set("travelmode", mode);
  url.searchParams.set("dir_action", "navigate");
  return url.toString();
}
