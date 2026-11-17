"use client";

import Link from "next/link";
import { useState } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { PublicOffer } from "@/lib/offers/public-api";
import { publicOfferCopy } from "@/lib/offers/public-copy";
import { PriceSticker } from "@/components/ui/PriceSticker";

export function OfferSmartFinds({ items, freshItems = items, locale }: { items: PublicOffer[]; freshItems?: PublicOffer[]; locale: SiteLocale }) {
  const t = publicOfferCopy(locale);
  // Captured once so render stays pure (Date.now() must not be called while rendering).
  const [now] = useState(() => Date.now());
  if (items.length < 2) return null;

  const bestValue = [...items]
    .filter((offer) => offer.originalPriceMinor !== null && offer.originalPriceMinor > offer.priceMinor)
    .sort((a, b) => ((b.originalPriceMinor! - b.priceMinor) / b.originalPriceMinor!) - ((a.originalPriceMinor! - a.priceMinor) / a.originalPriceMinor!))[0];
  const almostGone = items.filter((offer) => offer.availableUnits > 0 && offer.availableUnits <= 2)
    .sort((a, b) => a.availableUnits - b.availableUnits)[0];
  const freshCutoff = now - 48 * 60 * 60 * 1000;
  const freshArrival = freshItems
    .filter((offer) => offer.publishedAt && Date.parse(offer.publishedAt) >= freshCutoff && Date.parse(offer.publishedAt) <= now)
    .sort((a, b) => Date.parse(b.publishedAt!) - Date.parse(a.publishedAt!))[0];
  const picks = [
    bestValue ? { offer: bestValue, label: t.bestSavings, kind: "saving" } : null,
    almostGone && almostGone.id !== bestValue?.id ? { offer: almostGone, label: t.almostGone, kind: "stock" } : null,
    freshArrival && freshArrival.id !== bestValue?.id && freshArrival.id !== almostGone?.id
      ? { offer: freshArrival, label: t.freshArrival, kind: "fresh" } : null,
  ].filter((item): item is { offer: PublicOffer; label: string; kind: string } => Boolean(item));
  if (!picks.length) return null;

  return (
    <section className="kulha-smart-finds" aria-labelledby="kulha-smart-finds-title">
      <div className="kulha-smart-finds-heading">
        <div><p>{t.smartFindsEyebrow}</p><h2 id="kulha-smart-finds-title">{t.smartFindsTitle}</h2></div>
        <span>{t.smartFindsNote}</span>
      </div>
      <div className="kulha-smart-finds-grid">
        {picks.map(({ offer, label, kind }) => {
          return (
            <Link className={`kulha-smart-find kulha-smart-find-${kind}`} href={locale === "fr" ? `/offers/${offer.id}` : `/${locale}/offers/${offer.id}`} key={`${kind}-${offer.id}`}>
              <span className="kulha-smart-find-mark" aria-hidden="true">{kind === "saving" ? "↘" : kind === "fresh" ? "✳" : "✦"}</span>
              <span className="kulha-smart-find-content">
                <span className="kulha-smart-find-tag">{label}</span>
                <strong>{offer.title}</strong>
                <small>{offer.merchant.name} · {offer.merchant.city}</small>
              </span>
              <span className="kulha-smart-find-price"><PriceSticker priceMinor={offer.priceMinor} originalPriceMinor={offer.originalPriceMinor} locale={locale} size="xs" /></span>
              <span className="kulha-smart-find-arrow" aria-hidden="true">↗</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
