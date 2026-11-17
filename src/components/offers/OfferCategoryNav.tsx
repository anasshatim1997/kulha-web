import Link from "next/link";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { OfferSearch } from "@/lib/offers/public-api";
import { offerCategories, offerCategoryLabel, publicOfferCopy } from "@/lib/offers/public-copy";

type CategoryIconName = "ALL" | "BREAD_PASTRY" | "PREPARED_MEALS" | "GROCERIES" | "FRUIT_VEG" | "DRINKS" | "SURPRISE_BASKET" | "OTHER";

function CategoryIcon({ name }: { name: CategoryIconName }) {
    // One 24px grid, 1.5 stroke, rounded joins: a quiet line-icon set where every category has its own silhouette.
    const common = {
        width: 24,
        height: 24,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.5,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        "aria-hidden": true as const,
    };

    switch (name) {
        case "ALL":
            return <svg {...common}><rect x="4" y="4" width="6.5" height="6.5" rx="1.75" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.75" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.75" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.75" /></svg>;
        case "SURPRISE_BASKET": // gift box with bow
            return <svg {...common}><rect x="3.5" y="8.5" width="17" height="3.5" rx="1" /><path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12M12 8.5V20" /><path d="M12 8.5C10.2 8.5 8 8 8 6.4 8 5 9.1 4.3 10.2 4.5c1.1.2 1.8 1.9 1.8 4Zm0 0c1.8 0 4-.5 4-2.1 0-1.4-1.1-2.1-2.2-1.9-1.1.2-1.8 1.9-1.8 4Z" /></svg>;
        case "BREAD_PASTRY": // wheat ear
            return <svg {...common}><path d="M12 21V9.5" /><path d="M12 3c1.3 1.3 1.3 3.7 0 5.5-1.3-1.8-1.3-4.2 0-5.5Z" /><path d="M12 12.5c-2.6.2-4.2-1.3-4.4-4 2.6-.2 4.2 1.3 4.4 4Zm0 0c2.6.2 4.2-1.3 4.4-4-2.6-.2-4.2 1.3-4.4 4Z" /><path d="M12 17.5c-2.6.2-4.2-1.3-4.4-4 2.6-.2 4.2 1.3 4.4 4Zm0 0c2.6.2 4.2-1.3 4.4-4-2.6-.2-4.2 1.3-4.4 4Z" /></svg>;
        case "PREPARED_MEALS": // cloche
            return <svg {...common}><path d="M4.5 17a7.5 7.5 0 0 1 15 0" /><path d="M3 17h18M3 20h18" /><path d="M12 9.5V8" /><circle cx="12" cy="7" r="1" /></svg>;
        case "GROCERIES": // shopping bag
            return <svg {...common}><path d="M6.2 8h11.6l1 11.1a1 1 0 0 1-1 1.1H6.2a1 1 0 0 1-1-1.1L6.2 8Z" /><path d="M9 8V7a3 3 0 0 1 6 0v1" /></svg>;
        case "FRUIT_VEG": // apple
            return <svg {...common}><path d="M12 8.8c-1.7-1.3-5.700-1.100-5.7 3.5 0 3.6 2.2 8 5.7 8s5.700-4.4 5.700-8c0-4.600-4-4.800-5.700-3.500Z" /><path d="M12 8.800c0-2.200.9-3.7 2.700-4.500" /></svg>;
        case "DRINKS": // cup with lid and straw
            return <svg {...common}><path d="M7 8.500h10l-1.1 10.700a1.2 1.2 0 0 1-1.2 1H9.300a1.2 1.2 0 0 1-1.200-1L7 8.500Z" /><path d="M5.8 8.500h12.400M13 8.500l1.200-4.500H17" /></svg>;
        default: // sparkle
            return <svg {...common}><path d="M12 3.500c.7 4.2 2.3 5.8 6.5 6.500-4.200.7-5.8 2.300-6.5 6.500-.7-4.200-2.300-5.800-6.500-6.5 4.200-.7 5.800-2.3 6.500-6.500Z" /><path d="M18.5 16.500v4M16.5 18.500h4" /></svg>;
    }
}

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

export function OfferCategoryNav({ locale, search }: { locale: SiteLocale; search: OfferSearch }) {
    const t = publicOfferCopy(locale);

    return (
        <nav className="kulha-category-nav" aria-label={t.categoriesTitle}>
            <Link href={categoryHref(locale, search)} aria-current={!search.category ? "page" : undefined} className={!search.category ? "is-active" : ""}>
                <span className="kulha-category-icon"><CategoryIcon name="ALL" /></span>{t.allCategories}
            </Link>
            {(["SURPRISE_BASKET", ...offerCategories.filter((category) => category !== "SURPRISE_BASKET")] as (typeof offerCategories)[number][]).map((category) => (
                <Link
                    key={category}
                    href={categoryHref(locale, search, category)}
                    aria-current={search.category === category ? "page" : undefined}
                    className={search.category === category ? "is-active" : ""}
                >
                    <span className="kulha-category-icon"><CategoryIcon name={category} /></span>{offerCategoryLabel(locale, category)}
                </Link>
            ))}
        </nav>
    );
}