import Link from "next/link";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { OfferSearch } from "@/lib/offers/public-api";
import { offerCategories, publicOfferCopy } from "@/lib/offers/public-copy";
import { offerDesignCopy } from "@/lib/offers/design-copy";

function offersPath(locale: SiteLocale): string {
    return locale === "fr" ? "/offers" : `/${locale}/offers`;
}

function categoryHref(locale: SiteLocale, search: OfferSearch, category?: string): string {
    const query = new URLSearchParams();
    for (const key of ["q", "maxPriceMinor", "pickupFrom", "pickupTo", "city", "district", "sort", "size"] as const) {
        const value = search[key];
        if (value) query.set(key, value);
    }
    if (category) query.set("category", category);
    if (search.availableOnly === "false") query.set("availableOnly", "false");
    query.set("page", "0");
    return `${offersPath(locale)}?${query.toString()}#kulha-offers-results`;
}

/** Text-only category chips (All, Surprise, Bakery, …) exactly as the marketplace design shows them. */
export function OfferCategoryNav({ locale, search }: { locale: SiteLocale; search: OfferSearch }) {
    const t = publicOfferCopy(locale);
    const labels = offerDesignCopy(locale).categories;
    const ordered = ["SURPRISE_BASKET", ...offerCategories.filter((category) => category !== "SURPRISE_BASKET")] as (typeof offerCategories)[number][];

    return (
        <nav className="kulha-category-nav" aria-label={t.categoriesTitle}>
            <Link href={categoryHref(locale, search)} aria-current={!search.category ? "page" : undefined} className={!search.category ? "is-active" : ""}>
                {labels.ALL}
            </Link>
            {ordered.map((category) => (
                <Link
                    key={category}
                    href={categoryHref(locale, search, category)}
                    aria-current={search.category === category ? "page" : undefined}
                    className={search.category === category ? "is-active" : ""}
                >
                    {labels[category as keyof typeof labels] ?? labels.OTHER}
                </Link>
            ))}
        </nav>
    );
}
