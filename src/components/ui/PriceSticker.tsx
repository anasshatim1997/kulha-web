import type { SiteLocale } from "@/lib/i18n/site-copy";
import { getMadDiscountPercent, getMadPriceDisplayParts } from "@/lib/offers/price-display";

type PriceStickerProps = {
  priceMinor: number;
  originalPriceMinor?: number | null;
  locale: SiteLocale;
  size?: "xs" | "sm" | "md" | "lg";
  placement?: "inline" | "overlay";
  className?: string;
};

export function PriceSticker({
  priceMinor,
  originalPriceMinor = null,
  locale,
  size = "md",
  placement = "inline",
  className = "",
}: PriceStickerProps) {
  const current = getMadPriceDisplayParts(priceMinor, locale);
  const discount = getMadDiscountPercent(priceMinor, originalPriceMinor);
  const original = discount !== null && originalPriceMinor !== null
    ? getMadPriceDisplayParts(originalPriceMinor, locale)
    : null;
  const oldPriceLabel = locale === "fr" ? "prix initial" : locale === "ar" ? "السعر الأصلي" : "original price";
  const discountLabel = locale === "fr" ? "de réduction" : locale === "ar" ? "خصم" : "discount";
  const accessibleLabel = original && discount !== null
    ? `${current.full}; ${oldPriceLabel}: ${original.full}; ${discount}% ${discountLabel}`
    : current.full;

  return (
    <span
      className={`kulha-price-sticker kulha-price-sticker--${size} kulha-price-sticker--${placement}${className ? ` ${className}` : ""}`}
      dir="ltr"
      role="img"
      aria-label={accessibleLabel}
    >
      {discount !== null && (
        <span className="kulha-price-sticker__discount" aria-hidden="true">-{discount}%</span>
      )}
      <span className="kulha-price-sticker__plate" aria-hidden="true">
        {original && <del className="kulha-price-sticker__old">{original.full}</del>}
        <span className="kulha-price-sticker__amount">
          <span className="kulha-price-sticker__major">{current.major}</span>
          <span className="kulha-price-sticker__fraction">{current.fraction}</span>
          <span className="kulha-price-sticker__currency">{current.currency}</span>
        </span>
      </span>
    </span>
  );
}
