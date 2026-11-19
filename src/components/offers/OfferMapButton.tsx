import Link from "next/link";
import { MapPin } from "lucide-react";
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
      <MapPin size={18} strokeWidth={2.1} aria-hidden="true" />
      <span>{props.label ?? t.mapOpen}</span>
    </Link>
  );
}
