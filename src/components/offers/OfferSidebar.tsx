import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { OfferSearch } from "@/lib/offers/public-api";
import { publicOfferCopy } from "@/lib/offers/public-copy";
import { OfferCategoryNav } from "@/components/offers/OfferCategoryNav";

export function OfferSidebar({ locale, search }: { locale: SiteLocale; search: OfferSearch }) {
  const t = publicOfferCopy(locale);

  return (
    <aside className="kulha-marketplace-sidebar" aria-label={t.categoriesTitle}>
      <div className="kulha-sidebar-panel is-open" id="kulha-offers-sidebar-panel">
        <section className="kulha-sidebar-categories" aria-labelledby="kulha-sidebar-categories-title">
          <h2 id="kulha-sidebar-categories-title">{t.categoriesTitle}</h2>
          <OfferCategoryNav locale={locale} search={search} />
        </section>
      </div>
    </aside>
  );
}
