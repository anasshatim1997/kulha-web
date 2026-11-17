import Image from "next/image";
import Link from "next/link";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { formatPickupWindow } from "@/lib/offers/format";
import { PriceSticker } from "@/components/ui/PriceSticker";
import { getMadPriceDisplayParts } from "@/lib/offers/price-display";
import { publicOfferCopy } from "@/lib/offers/public-copy";
import type { PublicOffer } from "@/lib/offers/public-api";

const categoryArt: Record<string, { image?: string; width?: number; height?: number; glyph: string; className: string }> = {
  BREAD_PASTRY: { image: "/offer-art/baguette.webp", width: 274, height: 440, glyph: "🥐", className: "is-bakery" },
  PREPARED_MEALS: { glyph: "🍲", className: "is-meals" },
  GROCERIES: { image: "/offer-art/greens.webp", width: 868, height: 472, glyph: "🛍️", className: "is-grocery" },
  FRUIT_VEG: { image: "/offer-art/produce.webp", width: 514, height: 286, glyph: "🥬", className: "is-produce" },
  DRINKS: { glyph: "🧃", className: "is-drinks" },
  SURPRISE_BASKET: { glyph: "🧺", className: "is-surprise" },
  OTHER: { image: "/offer-art/leaf.webp", width: 235, height: 258, glyph: "✳", className: "is-other" },
};

export function OfferCard({ offer, locale, priority = false }: { offer: PublicOffer; locale: SiteLocale; priority?: boolean }) {
  const t = publicOfferCopy(locale);
  const art = categoryArt[offer.category] ?? categoryArt.OTHER;
  const href = locale === "fr" ? `/offers/${offer.id}` : `/${locale}/offers/${offer.id}`;
  const hasReferencePrice = offer.originalPriceMinor !== null && offer.originalPriceMinor > offer.priceMinor;
  const soldOut = offer.availableUnits === 0;
  const pickupWindow = offer.pickupStart && offer.pickupEnd
    ? formatPickupWindow(offer.pickupStart, offer.pickupEnd, locale)
    : t.notProvided;
  const location = [offer.merchant.district, offer.merchant.city].filter(Boolean).join(", ");
  const availableLabel = t.unitsAvailable.replace("{count}", String(offer.availableUnits));

  return (
    <article className={`kulha-offer-card${soldOut ? " is-sold-out" : ""}`}>
      <Link
        href={href}
        className="kulha-offer-card-link"
        aria-label={`${offer.title}, ${getMadPriceDisplayParts(offer.priceMinor, locale).full}, ${t.pickupWindowLabel}: ${pickupWindow}`}
      >
        <div className={`kulha-offer-art ${art.className}`} aria-hidden="true">
          {art.image ? (
            <Image src={art.image} alt="" width={art.width ?? 500} height={art.height ?? 400} unoptimized
              sizes="(max-width: 759px) 112px, (max-width: 1100px) 180px, 220px"
              priority={priority} className="kulha-offer-art-image" />
          ) : <span className="kulha-offer-art-glyph">{art.glyph}</span>}
          <PriceSticker
            priceMinor={offer.priceMinor}
            originalPriceMinor={hasReferencePrice ? offer.originalPriceMinor : null}
            locale={locale}
            size="md"
            placement="overlay"
            className="kulha-offer-art-price"
          />
          {soldOut && <span className="kulha-offer-status">{t.soldOut}</span>}
        </div>
        <div className="kulha-offer-card-main">
          <p className="kulha-offer-merchant"><bdi dir="auto">{offer.merchant.name}</bdi></p>
          <h3><bdi dir="auto">{offer.title}</bdi></h3>
          <div className="kulha-offer-card-meta">
            <span className="kulha-offer-pickup-chip"><span aria-hidden="true">◷</span><bdi dir="auto">{pickupWindow}</bdi></span>
            {offer.availableUnits > 0 && <span className="kulha-offer-availability"><bdi dir="auto">{availableLabel}</bdi></span>}
          </div>
          <div className="kulha-offer-card-bottom">
            <span className="kulha-offer-location"><bdi dir="auto">{location || t.notProvided}</bdi></span>

          </div>
        </div>
      </Link>
    </article>
  );
}
