import type { SiteLocale } from "@/lib/i18n/site-copy";
import { getPublicOffer, listPublicOffers, type OfferSearch, type PublicOffer, type PublicOfferDetail } from "@/lib/offers/public-api";
import { searchFromParams } from "@/lib/offers/search-params";
import { localizedOfferPath } from "@/lib/offers/paths";
import { OfferMapExplorer } from "@/components/offers/OfferMapExplorer";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function backToOffers(locale: SiteLocale, values: OfferSearch): string {
  const query = new URLSearchParams();
  for (const key of ["q", "category", "maxPriceMinor", "pickupFrom", "pickupTo", "city", "district", "sort"] as const) {
    const value = values[key];
    if (value) query.set(key, value);
  }
  if (values.availableOnly === "false") query.set("availableOnly", "false");
  const base = localizedOfferPath(locale, "/offers");
  return query.size ? `${base}?${query.toString()}` : base;
}

export async function OfferMapPage({ locale, params }: { locale: SiteLocale; params: Record<string, string | string[] | undefined> }) {
  const offerId = first(params.offerId);
  // Resolve a focused offer only when the URL requests one. The map's normal catalogue
  // is fetched below as a single cached first page, so pins and sidebar cards are present
  // on first paint without waiting for background pagination or a second geo search.
  const focusOffer: PublicOfferDetail | null = offerId
    ? await getPublicOffer(offerId).catch(() => null)
    : null;

  const values = searchFromParams(params);
  values.city = values.city ?? focusOffer?.merchant.city;
  values.page = "0";
  values.size = "50";
  values.availableOnly = values.availableOnly ?? "true";
  if (focusOffer) {
    values.city = focusOffer.merchant.city;
    values.district = focusOffer.merchant.district ?? undefined;
  }

  // One cached first page is enough to paint the map and its pins. Do not wait
  // for additional pages before rendering; the previous three-page barrier added
  // latency without helping a normal map view.
  const loaded = await listPublicOffers(values)
    .then((page) => ({ items: page.items, total: page.total, failed: false as const }))
    .catch(() => ({ items: [] as PublicOffer[], total: 0, failed: true as const }));
  const merged = new Map<string, PublicOffer>();
  for (const offer of loaded.items) merged.set(offer.id, offer);
  if (focusOffer) merged.set(focusOffer.id, focusOffer);

  const returnHref = focusOffer
    ? localizedOfferPath(locale, `/offers/${focusOffer.id}`)
    : backToOffers(locale, values);

  return (
    <div className="kulha-map-page-shell" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <OfferMapExplorer
        locale={locale}
        values={values}
        initialOffers={[...merged.values()]}
        focusOffer={focusOffer}
        backHref={returnHref}
        initialLoadFailed={loaded.failed}
        initialTotal={loaded.total}
        initialFiltersOpen={first(params.filters) === "open"}
      />
    </div>
  );
}
