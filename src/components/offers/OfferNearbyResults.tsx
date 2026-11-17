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

  return (
    <>
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
      {results.items.length ? (
        <>
          <div className="kulha-offer-grid">
            {results.items.map((offer, index) => <OfferCard key={offer.id} offer={offer} locale={locale} priority={index === 0} />)}
          </div>
          <p className="kulha-nearby-footnote">{t.nearbyPrivacyNote}</p>
        </>
      ) : (
        <div className="kulha-nearby-empty">
          <span aria-hidden="true">⌖</span>
          <h3>{t.nearbyEmptyTitle}</h3>
          <p>{t.nearbyEmptyBody}</p>
          <button type="button" onClick={clearResults}>{t.showAllBaskets}</button>
        </div>
      )}
    </section>
    </>
  );
}
