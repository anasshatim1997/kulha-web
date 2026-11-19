import Link from "next/link";
import Image from "next/image";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { formatPickupWindow } from "@/lib/offers/format";
import { PriceSticker } from "@/components/ui/PriceSticker";
import { PickupCountdown } from "@/components/offers/PickupCountdown";
import { getMadPriceDisplayParts } from "@/lib/offers/price-display";
import { publicOfferCopy } from "@/lib/offers/public-copy";
import { offerDesignCopy, formatDistance } from "@/lib/offers/design-copy";
import type { PublicOffer } from "@/lib/offers/public-api";

/** Each category keeps its own soft tint; the artwork itself is the shared basket mark from the design. */
const categoryTint: Record<string, string> = {
  BREAD_PASTRY: "is-bakery",
  PREPARED_MEALS: "is-meals",
  GROCERIES: "is-grocery",
  FRUIT_VEG: "is-produce",
  DRINKS: "is-drinks",
  SURPRISE_BASKET: "is-surprise",
  OTHER: "is-other",
};

function BasketMark() {
  return (
    <svg className="kulha-offer-art-mark" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M21 25v-4a11 11 0 0 1 22 0v4" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M12.5 25h39l-3 29a3 3 0 0 1-3 2.7H18.5a3 3 0 0 1-3-2.7l-3-29Z" stroke="currentColor" strokeWidth="4.5" strokeLinejoin="round" />
    </svg>
  );
}

export function OfferCard({ offer, locale }: { offer: PublicOffer; locale: SiteLocale; priority?: boolean }) {
  const t = publicOfferCopy(locale);
  const d = offerDesignCopy(locale);
  const tint = categoryTint[offer.category] ?? categoryTint.OTHER;
  const href = locale === "fr" ? `/offers/${offer.id}` : `/${locale}/offers/${offer.id}`;
  const hasReferencePrice = offer.originalPriceMinor !== null && offer.originalPriceMinor > offer.priceMinor;
  const soldOut = offer.availableUnits === 0;
  const pickupWindow = offer.pickupStart && offer.pickupEnd
    ? formatPickupWindow(offer.pickupStart, offer.pickupEnd, locale).replace(" · ", " ")
    : t.notProvided;
  const distance = formatDistance(offer.distanceKm, locale);
  const availableLabel = d.left.replace("{count}", String(offer.availableUnits));

  return (
    <article className={`kulha-offer-card${soldOut ? " is-sold-out" : ""}`}>
      <Link
        href={href}
        className="kulha-offer-card-link"
        aria-label={`${offer.title}, ${getMadPriceDisplayParts(offer.priceMinor, locale).full}, ${t.pickupWindowLabel}: ${pickupWindow}`}
      >
        <div className={`kulha-offer-art ${tint}`} aria-hidden="true">
          {offer.pickupEnd && !soldOut && <PickupCountdown pickupEnd={offer.pickupEnd} locale={locale} />}
          {soldOut && <span className="kulha-offer-status">{t.soldOut}</span>}
          {offer.imageUrl ? <Image src={offer.imageUrl} alt={offer.title} fill unoptimized sizes="(max-width: 760px) 92vw, (max-width: 1100px) 48vw, 360px" className="kulha-offer-real-image" /> : <BasketMark />}
          <PriceSticker
            priceMinor={offer.priceMinor}
            originalPriceMinor={hasReferencePrice ? offer.originalPriceMinor : null}
            locale={locale}
            size="md"
            placement="overlay"
            className="kulha-offer-art-price"
          />
        </div>
        <div className="kulha-offer-card-main">
          <p className="kulha-offer-merchant">
            <bdi dir="auto">{offer.merchant.name}</bdi>
            {distance && <> <span aria-hidden="true">·</span> <bdi dir="ltr">{distance}</bdi></>}
          </p>
          <h3><bdi dir="auto">{offer.title}</bdi></h3>
          <div className="kulha-offer-card-meta">
            <span className="kulha-offer-pickup-chip">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
              <bdi dir="auto">{pickupWindow}</bdi>
            </span>
            {offer.availableUnits > 0 && <span className="kulha-offer-availability"><bdi dir="auto">{availableLabel}</bdi></span>}
            {soldOut && <span className="kulha-offer-restock">{d.notifyRestock}</span>}
          </div>
        </div>
      </Link>
    </article>
  );
}
