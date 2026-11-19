"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { OfferSearch, PublicOffer, PublicOfferPage } from "@/lib/offers/public-api";
import { OfferCard } from "@/components/offers/OfferCard";
import { api } from "@/lib/api/client";

function queryForPage(search: OfferSearch, page: number, size: number): string {
  const params = new URLSearchParams();
  for (const key of ["q", "category", "maxPriceMinor", "pickupFrom", "pickupTo", "city", "district", "sort"] as const) {
    const value = search[key];
    if (value) params.set(key, value);
  }
  params.set("availableOnly", search.availableOnly === "false" ? "false" : "true");
  params.set("page", String(page));
  params.set("size", String(size));
  return params.toString();
}

const copy = {
  fr: { showing: "Affichage de", of: "sur", baskets: "paniers", more: "Voir plus de paniers", loading: "Chargement…", error: "Impossible de charger la suite des paniers.", retry: "Réessayer" },
  en: { showing: "Showing", of: "of", baskets: "baskets", more: "Load more baskets", loading: "Loading…", error: "We couldn't load the next baskets.", retry: "Try again" },
  ar: { showing: "عرض", of: "من", baskets: "سلة", more: "عرض المزيد من السلال", loading: "جارٍ التحميل…", error: "تعذر تحميل بقية السلال.", retry: "إعادة المحاولة" },
} as const;

export function OfferProgressiveGrid({ locale, initialPage, search }: {
  locale: SiteLocale;
  initialPage: PublicOfferPage;
  search: OfferSearch;
}) {
  const t = copy[locale] ?? copy.en;
  const [items, setItems] = useState<PublicOffer[]>(initialPage.items);
  const [page, setPage] = useState(initialPage.page);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = items.length < initialPage.total;
  const label = useMemo(() => `${t.showing} ${items.length} ${t.of} ${initialPage.total} ${t.baskets}`, [initialPage.total, items.length, t]);

  const loadNext = useCallback(async () => {
    if (loadingRef.current || items.length >= initialPage.total) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);
    try {
      const nextPage = page + 1;
      const result = await api.get<PublicOfferPage>(`/offers?${queryForPage(search, nextPage, initialPage.size)}`);
      setItems((current) => {
        const known = new Set(current.map((item) => item.id));
        return [...current, ...result.items.filter((item) => !known.has(item.id))];
      });
      setPage(result.page);
    } catch {
      setError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [initialPage.size, initialPage.total, items.length, page, search]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loading || error) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadNext();
    }, { rootMargin: "500px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [error, hasMore, loadNext, loading]);

  return (
    <div className="kulha-progressive-results" aria-busy={loading}>
      {initialPage.total > 0 && (
        <div className="kulha-progressive-toolbar">
          <p aria-live="polite">{label}</p>
          {hasMore && <button type="button" onClick={() => void loadNext()} disabled={loading} aria-label={loading ? t.loading : error ? t.retry : t.more}>{error ? t.retry : t.more}</button>}
        </div>
      )}
      <div className="kulha-offer-grid">
        {items.map((offer) => <OfferCard key={offer.id} offer={offer} locale={locale} />)}
      </div>
      {error && (
        <div className="kulha-progressive-error" role="alert">
          <span>{t.error}</span>
          <button type="button" onClick={() => void loadNext()} disabled={loading}>{t.retry}</button>
        </div>
      )}
      <div ref={sentinelRef} className="kulha-progressive-sentinel" aria-hidden="true" />
      {loading && <p className="kulha-progressive-loading" role="status" aria-live="polite">{t.loading}</p>}
    </div>
  );
}
