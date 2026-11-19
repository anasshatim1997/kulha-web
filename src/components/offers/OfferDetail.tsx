import Image from "next/image";
import Link from "next/link";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { formatMad, formatPickupWindow, roundMadMinor } from "@/lib/offers/format";
import { PriceSticker } from "@/components/ui/PriceSticker";
import { getMadPriceDisplayParts } from "@/lib/offers/price-display";
import { offerCategoryLabel, publicOfferCopy } from "@/lib/offers/public-copy";
import type { PublicOfferDetail } from "@/lib/offers/public-api";
import { merchantInitials } from "@/lib/offers/merchant-initials";
import { OfferMapButton } from "@/components/offers/OfferMapButton";
import "@/components/offers/offer-detail.css";

type DetailArtwork = { src?: string; accents?: string[]; symbol?: string; tone: string };
const detailArtwork: Record<string, DetailArtwork> = {
  BREAD_PASTRY: { src: "/kulha-loader/baguette.webp", tone: "bread" },
  PREPARED_MEALS: { symbol: "🍲", tone: "meals" },
  GROCERIES: { src: "/kulha-loader/bag.webp", accents: ["/kulha-loader/tomato.webp", "/kulha-loader/pepper.webp", "/kulha-loader/greens-front.webp"], tone: "grocery" },
  FRUIT_VEG: { src: "/kulha-loader/greens-back.webp", accents: ["/kulha-loader/tomato.webp", "/kulha-loader/pepper.webp"], tone: "produce" },
  DRINKS: { symbol: "🥤", tone: "drinks" },
  SURPRISE_BASKET: { src: "/kulha-loader/bag.webp", accents: ["/kulha-loader/baguette.webp", "/kulha-loader/tomato.webp", "/kulha-loader/greens-front.webp"], tone: "surprise" },
  OTHER: { symbol: "🧺", tone: "other" },
};
const extra = {
  fr: { area: "Quartier", left: "Restants", reserve: "Réserver ce panier", goodToKnow: "À savoir", pickup: "Retrait", saveBefore: "Vous économisez", saveAfter: "sur ce panier", unavailable: "Indisponible" },
  en: { area: "Area", left: "Left", reserve: "Reserve this basket", goodToKnow: "Good to know", pickup: "Pickup", saveBefore: "You save", saveAfter: "on this basket", unavailable: "Unavailable" },
  ar: { area: "الحي", left: "المتبقي", reserve: "احجز هذه السلة", goodToKnow: "معلومات مفيدة", pickup: "الاستلام", saveBefore: "ستوفر", saveAfter: "على هذه السلة", unavailable: "غير متاح" },
} as const;
function Icon({ name }: { name: "back" | "clock" | "box" | "pin" | "share" }) {
  const paths = {
    back: <path d="m15 18-6-6 6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    box: <><path d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2L12 3Z" /><path d="m4 7.2 8 4.3 8-4.3M12 11.5V21" /></>,
    pin: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 1 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>,
    share: <><path d="M12 15V4M8 8l4-4 4 4" /><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></>,
  } as const;
  return <svg className="kd-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}
export function OfferDetail({ offer, locale, reserveHref }: { offer: PublicOfferDetail; locale: SiteLocale; reserveHref?: string }) {
  const t = publicOfferCopy(locale);
  const x = extra[locale] ?? extra.en;
  const offersPath = locale === "fr" ? "/offers" : `/${locale}/offers`;
  const allergensNotProvided = offer.allergensStatus === "UNKNOWN" || offer.allergens.length === 0;
  const soldOut = offer.availableUnits === 0;
  const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://kulha.ma").replace(/\/+$/, "");
  const shareUrl = `${siteOrigin}${offersPath}/${offer.id}`;
  const shareText = `${offer.title} · ${getMadPriceDisplayParts(offer.priceMinor, locale).full} · ${offer.merchant.name}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const artwork = detailArtwork[offer.category] ?? detailArtwork.OTHER;
  const hasOriginalPrice = offer.originalPriceMinor !== null && offer.originalPriceMinor > offer.priceMinor;
  const savingsMinor = hasOriginalPrice ? Math.max(0, roundMadMinor(offer.originalPriceMinor!) - roundMadMinor(offer.priceMinor)) : 0;
  const pickup = offer.pickupStart && offer.pickupEnd ? formatPickupWindow(offer.pickupStart, offer.pickupEnd, locale) : t.notProvided;
  const address = [offer.merchant.address, offer.merchant.district, offer.merchant.city].filter(Boolean).join(", ");
  const area = offer.merchant.district ?? offer.merchant.city;
  const merchantLocation = [offer.merchant.district, offer.merchant.city].filter(Boolean).join(", ");
  const pickupDetail = [offer.merchant.address, offer.merchant.pickupInstructions].filter(Boolean).join(" · ") || address || t.notProvided;
  const checkoutHref = reserveHref ?? (locale === "fr" ? "/reservations/checkout/" + offer.id : `/${locale}/reservations/checkout/${offer.id}`);

  return (
    <article className="kd" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <Link href={offersPath} className="kd-back"><Icon name="back" /><span>{t.back}</span></Link>
      <div className="kd-layout">
        <div className={`kd-stage is-${artwork.tone}`} aria-label={offer.title}>
          <span className="kd-chip">{offerCategoryLabel(locale, offer.category)}</span>
          {artwork.src ? <Image src={artwork.src} alt={offer.title} width={1100} height={1000} priority unoptimized sizes="(max-width: 760px) 92vw, (max-width: 1100px) 48vw, 560px" className="kd-hero" /> : <span className="kd-symbol" role="img" aria-label={offer.title}>{artwork.symbol}</span>}
          {artwork.accents?.map((src, index) => <Image key={src} src={src} alt="" aria-hidden="true" width={230} height={230} unoptimized className={`kd-accent accent-${index + 1}`} />)}
        </div>
        <div className="kd-info">
          <div className="kd-merchant"><span className="kd-merchant__mark" aria-hidden="true">{merchantInitials(offer.merchant.name)}</span><div><strong><bdi dir="auto">{offer.merchant.name}</bdi></strong><span><bdi dir="auto">{merchantLocation || offer.merchant.city}</bdi></span></div></div>
          <h1><bdi dir="auto">{offer.title}</bdi></h1>
          <p className="kd-description"><bdi dir="auto">{offer.description}</bdi></p>
          <div className="kd-facts">
            <section className="kd-fact"><Icon name="clock" /><div><h2>{t.pickupWindowLabel}</h2><p><bdi dir="auto">{pickup}</bdi></p></div></section>
            <section className={`kd-fact is-stock${soldOut ? " is-out" : ""}`}><Icon name="box" /><div><h2>{x.left}</h2><p>{soldOut ? <><bdi dir="auto">0</bdi> · {t.soldOut}</> : t.unitsAvailable.replace("{count}", String(offer.availableUnits))}</p></div></section>
            <section className="kd-fact"><Icon name="pin" /><div><h2>{x.area}</h2><p><bdi dir="auto">{area}</bdi></p></div></section>
          </div>
          <section className="kd-buy" aria-label={t.basketPrice}>
            <div className="kd-buy__price"><PriceSticker priceMinor={offer.priceMinor} originalPriceMinor={hasOriginalPrice ? offer.originalPriceMinor : null} locale={locale} size="lg" /></div>
            <div className="kd-buy__action">
              {hasOriginalPrice && savingsMinor > 0 && <p className="kd-saving">{x.saveBefore} <strong>{formatMad(savingsMinor, locale)}</strong> {x.saveAfter}</p>}
              <div className="kd-buy__row">
                {soldOut ? <span className="kd-reserve is-disabled" aria-disabled="true">{t.soldOut}</span> : <Link href={checkoutHref} className="kd-reserve">{x.reserve}</Link>}
                <a className="kd-share" href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={t.shareWhatsApp} title={t.shareWhatsApp}><Icon name="share" /></a>
              </div>
            </div>
          </section>
          <section className="kd-know" aria-labelledby="kd-know-title"><h2 id="kd-know-title">{x.goodToKnow}</h2><dl>
            <div><dt>{t.foodNotes}</dt><dd>{offer.foodNotes ? <bdi dir="auto">{offer.foodNotes}</bdi> : t.notProvided}</dd></div>
            <div><dt>{t.allergens}</dt><dd>{allergensNotProvided ? <><span className="kd-allergen-unknown">{t.notProvided}</span><small className="kd-allergen-note">{t.allergenUnknownNote}</small></> : <ul className="kd-allergens">{offer.allergens.map((value) => <li key={value}><bdi dir="auto">{value}</bdi></li>)}</ul>}</dd></div>
            <div><dt>{x.pickup}</dt><dd><bdi dir="auto">{pickupDetail}</bdi><OfferMapButton locale={locale} mode="single" offer={offer} /></dd></div>
          </dl></section>
        </div>
      </div>
    </article>
  );
}
