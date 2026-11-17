import Image from "next/image";
import Link from "next/link";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { formatPickupWindow } from "@/lib/offers/format";
import { getMadPriceDisplayParts } from "@/lib/offers/price-display";
import { publicOfferCopy } from "@/lib/offers/public-copy";
import { localizedOfferPath } from "@/lib/offers/paths";
import type { PublicOffer } from "@/lib/offers/public-api";
import { PriceSticker } from "@/components/ui/PriceSticker";
import { merchantInitials } from "@/lib/offers/merchant-initials";

const artwork: Record<string, { image?: string; glyph: string; tone: string }> = {
  BREAD_PASTRY: { image: "/offer-art/baguette.webp", glyph: "🥐", tone: "bakery" },
  PREPARED_MEALS: { glyph: "🍲", tone: "meals" },
  GROCERIES: { image: "/offer-art/greens.webp", glyph: "🛍️", tone: "grocery" },
  FRUIT_VEG: { image: "/offer-art/produce.webp", glyph: "🥬", tone: "produce" },
  DRINKS: { glyph: "🧃", tone: "drinks" },
  SURPRISE_BASKET: { glyph: "🧺", tone: "surprise" },
  OTHER: { image: "/offer-art/leaf.webp", glyph: "✳", tone: "other" },
};

export function OfferMapOfferCard({
  offer,
  locale,
  distanceLabel,
  selected = false,
}: {
  offer: PublicOffer;
  locale: SiteLocale;
  distanceLabel: string | null;
  selected?: boolean;
}) {
  const copy = publicOfferCopy(locale);
  const art = artwork[offer.category] ?? artwork.OTHER;
  const hasOriginalPrice = offer.originalPriceMinor !== null && offer.originalPriceMinor > offer.priceMinor;
  const pickupWindow = offer.pickupStart && offer.pickupEnd
    ? formatPickupWindow(offer.pickupStart, offer.pickupEnd, locale)
    : copy.notProvided;
  const location = [offer.merchant.district, offer.merchant.city].filter(Boolean).join(", ");
  const soldOut = offer.availableUnits <= 0;

  return (
    <article className={`kulha-map-offer-card${selected ? " is-selected" : ""}${soldOut ? " is-sold-out" : ""}`}>
      <Link
        href={localizedOfferPath(locale, `/offers/${offer.id}`)}
        className="kulha-map-offer-card__link"
        aria-label={`${offer.title}, ${offer.merchant.name}, ${getMadPriceDisplayParts(offer.priceMinor, locale).full}`}
      >
        <div className={`kulha-map-offer-card__visual is-${art.tone}`}>
          {art.image ? (
            <Image src={art.image} alt="" width={360} height={300} unoptimized sizes="112px" />
          ) : (
            <span className="kulha-map-offer-card__glyph" aria-hidden="true">{art.glyph}</span>
          )}
          <PriceSticker
            priceMinor={offer.priceMinor}
            originalPriceMinor={hasOriginalPrice ? offer.originalPriceMinor : null}
            locale={locale}
            size="md"
            placement="overlay"
            className="kulha-map-offer-card__price"
          />
          {soldOut && <span className="kulha-map-offer-card__sold-out">{copy.soldOut}</span>}
        </div>
        <div className="kulha-map-offer-card__body">
          <div className="kulha-map-offer-card__merchant-line">
            <span className="kulha-map-offer-card__merchant-mark" aria-hidden="true">{merchantInitials(offer.merchant.name)}</span>
            <span className="kulha-map-offer-card__merchant"><bdi dir="auto">{offer.merchant.name}</bdi></span>
            {distanceLabel && <span className="kulha-map-offer-card__distance"><span aria-hidden="true">⌖</span>{distanceLabel}</span>}
          </div>
          <h3><bdi dir="auto">{offer.title}</bdi></h3>
          <div className="kulha-map-offer-card__meta">
            <span><span aria-hidden="true">◷</span><bdi dir="auto">{pickupWindow}</bdi></span>
            {offer.availableUnits > 0 && (
              <span><span aria-hidden="true">▦</span>{copy.unitsAvailable.replace("{count}", String(offer.availableUnits))}</span>
            )}
          </div>
          <div className="kulha-map-offer-card__footer">
            <span className="kulha-map-offer-card__location"><span aria-hidden="true">⌖</span><bdi dir="auto">{location || copy.notProvided}</bdi></span>
            <span className="kulha-map-offer-card__details">{locale === "ar" ? "التفاصيل" : locale === "fr" ? "Détails" : "Details"} <span aria-hidden="true">↗</span></span>
          </div>
        </div>
      </Link>
    </article>
  );
}
