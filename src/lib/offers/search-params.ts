import type { OfferSearch } from "@/lib/offers/public-api";
import { normalizeOfferCity, normalizeOfferDistrict } from "@/lib/offers/location-options";
import { casablancaLocalToUtc } from "@/lib/time/casablanca";

export function searchFromParams(params: Record<string, string | string[] | undefined>): OfferSearch {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const last = (value: string | string[] | undefined) => Array.isArray(value) ? value[value.length - 1] : value;
  const accepted = ["q", "category", "maxPriceMinor", "pickupFrom", "pickupTo", "city", "district", "availableOnly", "sort", "page", "size"] as const;
  const mapped = Object.fromEntries(accepted.map(key => {
    const raw = params[key];
    const value = key === "availableOnly" ? last(raw) : first(raw);
    return [key, value];
  }).filter(([, value]) => value !== undefined));
  const search = mapped as OfferSearch;
  search.city = normalizeOfferCity(search.city ?? "Casablanca");
  search.district = normalizeOfferDistrict(search.district, search.city);
  for (const key of ["pickupFrom", "pickupTo"] as const) {
    const localValue = first(params[`${key}Local`]);
    const value = localValue !== undefined ? localValue : search[key];
    if (!value) {
      if (localValue !== undefined) search[key] = undefined;
      continue;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
      try {
        search[key] = casablancaLocalToUtc(value);
      } catch {
        search[key] = value;
      }
    } else {
      search[key] = value;
    }
  }
  return search;
}
