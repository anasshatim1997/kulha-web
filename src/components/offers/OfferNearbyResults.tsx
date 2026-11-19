"use client";

import type { ReactNode } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { publicOfferCopy } from "@/lib/offers/public-copy";
import { OfferCard } from "@/components/offers/OfferCard";
import { useOfferNearby } from "@/components/offers/OfferNearbyContext";

export function OfferNearbyResults({ locale, children }: { locale: SiteLocale; children: ReactNode }) {
  const { results, clearResults } = useOfferNearby();
  const t = publicOfferCopy(locale);
  if (!results) return <>{children}</>;

  // A zero-result nearby search is an additional preference, not a replacement for discovery.
  // Keep the regular marketplace results visible so customers can still browse every basket.
  if (results.items.length === 0) {
    return (
      <>
        <section className="kulha-nearby-empty-inline" role="status" aria-live="polite" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
          <span className="kulha-nearby-empty-icon" aria-hidden="true">⌖</span>
          <div className="kulha-nearby-empty-copy">
            <strong>{t.nearbyEmptyTitle}</strong>
            <p>{t.nearbyEmptyBody}</p>
          </div>
          <button type="button" className="kulha-nearby-clear" onClick={clearResults}>{t.showAllBaskets}</button>
        </section>
        {children}
      </>
    );
  }

  return (
    <section className="kulha-offers-results kulha-nearby-results" id="kulha-offers-results" aria-labelledby="kulha-nearby-title">
      <div className="kulha-results-heading">
        <div>
          <p className="kulha-results-eyebrow">{t.nearbyEyebrow}</p>
          <h2 id="kulha-nearby-title">{t.nearbyTitle}</h2>
          <p className="kulha-nearby-subtitle">{t.nearbySubTitle}</p>
        </div>
        <div className="kulha-nearby-heading-actions">
          <p className="kulha-results-count" role="status" aria-live="polite"><strong>{results.total}</strong> {results.total === 1 ? t.resultCountOne : t.resultCount}</p>
          <button type="button" className="kulha-nearby-clear" onClick={clearResults}>{t.showAllBaskets}</button>
        </div>
      </div>
      <div className="kulha-offer-grid">
        {results.items.map((offer, index) => <OfferCard key={offer.id} offer={offer} locale={locale} priority={index === 0} />)}
      </div>
      <p className="kulha-nearby-footnote">{t.nearbyPrivacyNote}</p>
    </section>
  );
}
