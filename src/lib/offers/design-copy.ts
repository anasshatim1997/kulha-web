import type { SiteLocale } from "@/lib/i18n/site-copy";
import { offerCities, offerDistricts } from "@/lib/offers/location-options";
import type { OfferSearch } from "@/lib/offers/public-api";

/**
 * Copy that the offers marketplace design specifies verbatim (headline, short chips, filter popover).
 * Kept in one place so the list page, the filter popover and the loading skeleton always agree.
 */
export type OfferDesignCopy = {
  title: string;
  tagline: string;
  searchPlaceholder: string;
  list: string;
  map: string;
  pickup: string;
  filters: string;
  filtersClose: string;
  reset: string;
  clearAll: string;
  categories: Record<"ALL" | "SURPRISE_BASKET" | "BREAD_PASTRY" | "PREPARED_MEALS" | "GROCERIES" | "FRUIT_VEG" | "DRINKS" | "OTHER", string>;
  basketSingle: string;
  basketPlural: string;
  pickPickupTime: string;
  maxPrice: string;
  any: string;
  under: string;
  area: string;
  allAreas: string;
  sortBy: string;
  includeSoldOut: string;
  customPickup: string;
  cancel: string;
  showBaskets: string;
  applying: string;
  left: string;
  endsIn: string;
  notifyRestock: string;
  missTitle: string;
  missBody: string;
  missCta: string;
  yourArea: string;
  soldOutIncluded: string;
  mad: string;
};

const copy: Record<SiteLocale, OfferDesignCopy> = {
  en: {
    title: "Baskets near you",
    tagline: "Fresh finds from local shops, saved from the bin, up to 67% off.",
    searchPlaceholder: "Search baskets, shops or ingredients…",
    list: "List", map: "Map", pickup: "Pickup", filters: "Filters", filtersClose: "Close filters", reset: "Reset", clearAll: "Clear all",
    categories: { ALL: "All", SURPRISE_BASKET: "Surprise", BREAD_PASTRY: "Bakery", PREPARED_MEALS: "Meals", GROCERIES: "Groceries", FRUIT_VEG: "Fruit & veg", DRINKS: "Drinks", OTHER: "Other" },
    basketSingle: "basket", basketPlural: "baskets", pickPickupTime: "Pick a time", maxPrice: "Max price", any: "Any", under: "Under",
    area: "Area", allAreas: "All areas", sortBy: "Sort by", includeSoldOut: "Include sold out", customPickup: "Custom pickup time",
    cancel: "Cancel", showBaskets: "Show {count} baskets", applying: "Applying…", left: "{count} left", endsIn: "Ends in",
    notifyRestock: "Notify me if restocked", missTitle: "Don’t miss tonight’s baskets", missBody: "Get notified when shops in {area} post new baskets.",
    missCta: "Notify me", yourArea: "your area", soldOutIncluded: "Sold out included", mad: "MAD",
  },
  fr: {
    title: "Paniers près de chez vous",
    tagline: "Les invendus de vos commerces locaux, sauvés de la poubelle, jusqu’à 67 % moins chers.",
    searchPlaceholder: "Rechercher un panier, un commerce ou un aliment…",
    list: "Liste", map: "Carte", pickup: "Retrait", filters: "Filtres", filtersClose: "Fermer les filtres", reset: "Réinitialiser", clearAll: "Tout effacer",
    categories: { ALL: "Tout", SURPRISE_BASKET: "Surprise", BREAD_PASTRY: "Boulangerie", PREPARED_MEALS: "Plats", GROCERIES: "Épicerie", FRUIT_VEG: "Fruits & légumes", DRINKS: "Boissons", OTHER: "Autre" },
    basketSingle: "panier", basketPlural: "paniers", pickPickupTime: "Choisir l’heure", maxPrice: "Prix maximum", any: "Tous", under: "Moins de",
    area: "Quartier", allAreas: "Tous les quartiers", sortBy: "Trier par", includeSoldOut: "Inclure les paniers épuisés", customPickup: "Heure de retrait personnalisée",
    cancel: "Annuler", showBaskets: "Afficher {count} paniers", applying: "Application…", left: "{count} restants", endsIn: "Se termine dans",
    notifyRestock: "Me prévenir du réassort", missTitle: "Ne manquez pas les paniers de ce soir", missBody: "Soyez prévenu quand les commerces de {area} publient de nouveaux paniers.",
    missCta: "Me prévenir", yourArea: "votre quartier", soldOutIncluded: "Épuisés inclus", mad: "MAD",
  },
  ar: {
    title: "سلال بالقرب منك",
    tagline: "منتجات طازجة من المتاجر المحلية أُنقذت من الهدر، بخصم يصل إلى 67٪.",
    searchPlaceholder: "ابحث عن سلة أو متجر أو مكوّن…",
    list: "القائمة", map: "الخريطة", pickup: "الاستلام", filters: "عوامل التصفية", filtersClose: "إغلاق عوامل التصفية", reset: "إعادة ضبط", clearAll: "مسح الكل",
    categories: { ALL: "الكل", SURPRISE_BASKET: "مفاجأة", BREAD_PASTRY: "مخبوزات", PREPARED_MEALS: "وجبات", GROCERIES: "بقالة", FRUIT_VEG: "فواكه وخضر", DRINKS: "مشروبات", OTHER: "أخرى" },
    basketSingle: "سلة", basketPlural: "سلال", pickPickupTime: "اختر وقتاً", maxPrice: "أقصى سعر", any: "الكل", under: "أقل من",
    area: "المنطقة", allAreas: "كل المناطق", sortBy: "ترتيب حسب", includeSoldOut: "إظهار السلال النافدة", customPickup: "وقت استلام مخصص",
    cancel: "إلغاء", showBaskets: "عرض {count} سلال", applying: "جارٍ التطبيق…", left: "متبقي {count}", endsIn: "ينتهي خلال",
    notifyRestock: "أعلمني عند التوفر", missTitle: "لا تفوّت سلال هذا المساء", missBody: "تلقَّ إشعاراً عندما تنشر متاجر {area} سلالاً جديدة.",
    missCta: "أعلمني", yourArea: "منطقتك", soldOutIncluded: "تشمل النافدة", mad: "درهم",
  },
};

export function offerDesignCopy(locale: SiteLocale): OfferDesignCopy {
  return copy[locale];
}

/** "Casablanca · Maarif" when the visitor picked an area, otherwise undefined. */
export function offerAreaLabel(locale: SiteLocale, values: Pick<OfferSearch, "city" | "district">): string | undefined {
  const city = offerCities().find((option) => option.value === values.city)?.labels[locale];
  const district = offerDistricts(values.city).find((option) => option.value === values.district)?.labels[locale];
  const parts = [city, district].filter(Boolean);
  return parts.length ? parts.join(" · ") : undefined;
}

export function formatDistance(distanceKm: number | null | undefined, locale: SiteLocale): string | null {
  if (distanceKm === null || distanceKm === undefined || !Number.isFinite(distanceKm) || distanceKm < 0) return null;
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000 / 10) * 10} m`;
  const value = distanceKm.toFixed(1).replace(/\.0$/, "");
  return `${locale === "fr" ? value.replace(".", ",") : value} km`;
}
