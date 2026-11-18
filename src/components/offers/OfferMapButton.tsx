import Link from "next/link";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { OfferSearch, PublicOfferDetail } from "@/lib/offers/public-api";
import { localizedOfferPath } from "@/lib/offers/paths";
import { publicOfferCopy } from "@/lib/offers/public-copy";

type NearbyMapProps = {
  locale: SiteLocale;
  mode: "nearby";
  values: OfferSearch;
};

type SingleMapProps = {
  locale: SiteLocale;
  mode: "single";
  offer: PublicOfferDetail;
};

type Props = (NearbyMapProps | SingleMapProps) & { label?: string };

function mapHref(props: NearbyMapProps | SingleMapProps): string {
  const query = new URLSearchParams();
  if (props.mode === "single") {
    query.set("offerId", props.offer.id);
  } else {
    for (const key of ["q", "category", "maxPriceMinor", "pickupFrom", "pickupTo", "city", "district", "sort"] as const) {
      const value = props.values[key];
      if (value) query.set(key, value);
    }
    if (props.values.availableOnly === "false") query.set("availableOnly", "false");
    query.set("page", "0");
    query.set("size", "50");
  }
  const base = localizedOfferPath(props.locale, "/offers/map");
  const params = query.toString();
  return params ? `${base}?${params}` : base;
}

export function OfferMapButton(props: Props) {
  const t = publicOfferCopy(props.locale);
  return (
    <Link href={mapHref(props)} className="kulha-map-open-button">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3.5 6.5 5-2 7 2 5-2v13l-5 2-7-2-5 2v-13Z" />
        <path d="M8.5 4.5v13M15.5 6.5v13" />
        <path d="M12 8.1c0 2.1-2.6 4.1-2.6 4.1S6.8 10.2 6.8 8.1a2.6 2.6 0 1 1 5.2 0Z" transform="translate(5.2 0) scale(.78)" />
      </svg>
      <span>{props.label ?? t.mapOpen}</span>
    </Link>
  );
}
