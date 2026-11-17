import type { SiteLocale } from "@/lib/i18n/site-copy";

type LocationOption = {
  value: string;
  aliases: readonly string[];
  labels: Record<SiteLocale, string>;
  districts: readonly {
    value: string;
    aliases: readonly string[];
    labels: Record<SiteLocale, string>;
  }[];
};

export const OFFER_LOCATION_CONFIG: readonly LocationOption[] = [
  {
    value: "Casablanca",
    aliases: ["Casa", "Casablanca", "الدار البيضاء"],
    labels: { fr: "Casablanca", en: "Casablanca", ar: "الدار البيضاء" },
    districts: [
      { value: "Maarif", aliases: ["Maarif", "Ma3rif", "المعاريف", "معاريف"], labels: { fr: "Maârif", en: "Maarif", ar: "المعاريف" } },
    ],
  },
];

function normalizeLocationToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670\u0640]/g, "")
    .toLocaleLowerCase()
    .replace(/[\s'’.-]/g, "");
}

export function normalizeOfferCity(value?: string): string | undefined {
  if (!value) return value;
  const normalized = normalizeLocationToken(value);
  return OFFER_LOCATION_CONFIG.find((city) =>
    city.aliases.some((alias) => normalizeLocationToken(alias) === normalized),
  )?.value ?? value;
}

export function normalizeOfferDistrict(value?: string, cityValue?: string): string | undefined {
  if (!value) return value;
  const normalized = normalizeLocationToken(value);
  const city = OFFER_LOCATION_CONFIG.find((option) => option.value === normalizeOfferCity(cityValue));
  const districts = city?.districts ?? OFFER_LOCATION_CONFIG.flatMap((option) => option.districts);
  return districts.find((district) =>
    district.aliases.some((alias) => normalizeLocationToken(alias) === normalized),
  )?.value ?? value;
}

export function offerCities() {
  return OFFER_LOCATION_CONFIG;
}

export function offerDistricts(cityValue?: string) {
  const city = OFFER_LOCATION_CONFIG.find((option) => option.value === normalizeOfferCity(cityValue));
  return city ? city.districts : OFFER_LOCATION_CONFIG.flatMap((option) => option.districts);
}
