"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { formatMad } from "@/lib/offers/format";
import { publicOfferCopy, offerCategoryLabel } from "@/lib/offers/public-copy";
import type { OfferSearch } from "@/lib/offers/public-api";
import { offerCities, offerDistricts } from "@/lib/offers/location-options";
import { utcToCasablancaLocal } from "@/lib/time/casablanca";

export const MAX_PRICE_PRESETS_MINOR = [5000, 10000, 20000] as const;

type FilterKey = "q" | "category" | "maxPriceMinor" | "pickupFrom" | "pickupTo" | "city" | "district" | "sort" | "availableOnly";
type QuickPickupRanges = Record<"now" | "tonight" | "tomorrow", { from: string; to: string }>;

function offersPath(locale: SiteLocale): string {
    return locale === "fr" ? "/offers" : `/${locale}/offers`;
}

function displayInstant(value: string, locale: SiteLocale): string {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return value;
    const localeTag = locale === "fr" ? "fr-MA" : locale === "ar" ? "ar-MA" : "en-MA";
    return new Intl.DateTimeFormat(localeTag, {
        timeZone: "Africa/Casablanca",
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}

function filterHref(values: OfferSearch, locale: SiteLocale, overrides: Partial<Record<FilterKey, string>> = {}, omit?: FilterKey): string {
    const query = new URLSearchParams();
    const keys: FilterKey[] = ["q", "category", "maxPriceMinor", "pickupFrom", "pickupTo", "city", "district", "sort"];
    for (const key of keys) {
        if (key === omit) continue;
        const value = overrides[key] ?? values[key];
        if (value) query.set(key, value);
    }
    if (omit !== "availableOnly") {
        const availableOnly = overrides.availableOnly ?? values.availableOnly;
        if (availableOnly === "false") query.set("availableOnly", "false");
        else if (availableOnly === "true") query.set("availableOnly", "true");
    }
    query.set("page", "0");
    query.set("size", values.size || "20");
    return `${offersPath(locale)}?${query.toString()}#kulha-offers-results`;
}

function matchesQuickPickup(from: string | undefined, to: string | undefined, range: { from: string; to: string }): boolean {
    if (!from || !to) return false;
    const fromDelta = Math.abs(Date.parse(from) - Date.parse(range.from));
    const toDelta = Math.abs(Date.parse(to) - Date.parse(range.to));
    return Number.isFinite(fromDelta) && Number.isFinite(toDelta) && fromDelta <= 120_000 && toDelta <= 120_000;
}

function localInputValue(value: string | undefined): string {
    if (!value) return "";
    try {
        return utcToCasablancaLocal(value);
    } catch {
        return "";
    }
}

function submitGetForm(event: FormEvent<HTMLFormElement>, locale: SiteLocale, navigate: (href: string) => void) {
    event.preventDefault();
    const query = new URLSearchParams();
    const data = new FormData(event.currentTarget);
    data.forEach((value, key) => {
        if (typeof value === "string" && value !== "") query.append(key, value);
    });
    // The hidden pickupFrom/pickupTo carry the current range. When the visitor empties the matching
    // custom-time field they mean "no limit", so the stale hidden value must not survive the submit.
    for (const key of ["pickupFrom", "pickupTo"] as const) {
        if (data.get(`${key}Local`) === "") query.delete(key);
    }
    const search = query.toString();
    navigate(`${offersPath(locale)}${search ? `?${search}` : ""}#kulha-offers-results`);
}

export function OfferActiveFilters({ locale, values }: { locale: SiteLocale; values: OfferSearch }) {
    const t = publicOfferCopy(locale);
    const chips: { key: FilterKey; label: string; value: string }[] = [];
    if (values.q) chips.push({ key: "q", label: t.searchLabel, value: values.q });
    if (values.category) chips.push({ key: "category", label: t.category, value: offerCategoryLabel(locale, values.category) });
    if (values.maxPriceMinor) {
        const minorUnits = Number(values.maxPriceMinor);
        chips.push({ key: "maxPriceMinor", label: t.maxPrice, value: Number.isSafeInteger(minorUnits) && minorUnits >= 0 ? formatMad(minorUnits, locale) : values.maxPriceMinor });
    }
    if (values.pickupFrom) chips.push({ key: "pickupFrom", label: t.pickupFrom, value: displayInstant(values.pickupFrom, locale) });
    if (values.pickupTo) chips.push({ key: "pickupTo", label: t.pickupTo, value: displayInstant(values.pickupTo, locale) });
    const selectedCity = offerCities().find((city) => city.value === values.city);
    const selectedDistrict = offerDistricts().find((district) => district.value === values.district);
    if (values.city) chips.push({ key: "city", label: t.city, value: selectedCity?.labels[locale] ?? values.city });
    if (values.district) chips.push({ key: "district", label: t.district, value: selectedDistrict?.labels[locale] ?? values.district });
    if (values.sort && values.sort !== "pickup_end") chips.push({ key: "sort", label: t.sort, value: values.sort === "price" ? t.price : values.sort === "newest" ? t.newest : t.pickupEnd });
    if (values.availableOnly === "false") chips.push({ key: "availableOnly", label: t.availabilityFilter, value: t.includeSoldOut });

    if (chips.length === 0) return null;

    return (
        <div className="kulha-active-filters" aria-label={t.activeFilters}>
            <span className="kulha-active-filters-title">{t.activeFilters}</span>
            {chips.map((chip) => (
                <Link key={chip.key} href={filterHref(values, locale, {}, chip.key)} scroll={false} className="kulha-filter-chip">
                    <span>{chip.label}: <bdi dir="auto">{chip.value}</bdi></span>
                    <span aria-hidden="true">×</span>
                    <span className="sr-only">{t.removeFilter}</span>
                </Link>
            ))}
            <Link className="kulha-filter-clear-all" href={offersPath(locale)} scroll={false}>{t.reset}</Link>
        </div>
    );
}

export function OfferFilterBar({ locale, values, pickupRanges, initialOpen = false }: { locale: SiteLocale; values: OfferSearch; pickupRanges: QuickPickupRanges; initialOpen?: boolean }) {
    const t = publicOfferCopy(locale);
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(initialOpen);
    const navigate = (href: string) => startTransition(() => router.push(href));
    const selectedQuickPickup = (Object.keys(pickupRanges) as (keyof QuickPickupRanges)[]).find((key) => matchesQuickPickup(values.pickupFrom, values.pickupTo, pickupRanges[key]));
    const hasFilters = Boolean(values.q || values.category || values.maxPriceMinor || values.pickupFrom || values.pickupTo || values.city || values.district || values.availableOnly === "false" || (values.sort && values.sort !== "pickup_end"));
    const activeCount = [values.category, values.city, values.maxPriceMinor, values.pickupFrom || values.pickupTo, values.district, values.availableOnly === "false", values.sort && values.sort !== "pickup_end"].filter(Boolean).length;
    const labels = locale === "fr"
        ? { filters: "Filtres", close: "Masquer les filtres" }
        : locale === "ar"
            ? { filters: "عوامل التصفية", close: "إخفاء عوامل التصفية" }
            : { filters: "Filters", close: "Hide filters" };

    return (
        <section className="kulha-filter-shell kulha-inline-filter-bar" aria-busy={isPending} aria-label={t.filterFormLabel}>
            <div className="kulha-filter-toggle-row">
                <button
                    type="button"
                    className="kulha-filter-toggle"
                    aria-expanded={isOpen}
                    aria-controls="kulha-filter-panel"
                    onClick={() => setIsOpen((open) => !open)}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h9m4 0h3M4 17h3m4 0h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></svg>
                    <span>{isOpen ? labels.close : labels.filters}</span>
                    {activeCount > 0 && <span className="kulha-filter-toggle-count">{activeCount}</span>}
                    <svg className="kulha-filter-toggle-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {hasFilters && <Link href={offersPath(locale)} scroll={false} className="kulha-filter-reset">{t.reset}</Link>}
            </div>

            <div className="kulha-filter-expanded" id="kulha-filter-panel" hidden={!isOpen}>
                <div className="kulha-filter-heading">
                    <div className="kulha-filter-heading-copy">
                        <span className="kulha-filter-eyebrow">{t.filterFormLabel}</span>
                        <h3>{locale === "fr" ? "Trouvez le panier qu’il vous faut" : locale === "ar" ? "اعثر على السلة المناسبة لك" : "Find the basket that fits"}</h3>
                        <p>{locale === "fr" ? "Choisissez votre retrait, votre budget et votre quartier." : locale === "ar" ? "اختر موعد الاستلام والميزانية والحي." : "Choose a pickup time, budget and neighbourhood."}</p>
                    </div>
                </div>

                <div className="kulha-filter-quick-row">
                    <span className="kulha-filter-section-label">{t.pickupQuickLabel}</span>
                    <div className="kulha-sidebar-chip-list">
                        <Link href={filterHref(values, locale, { pickupFrom: pickupRanges.now.from, pickupTo: pickupRanges.now.to })} scroll={false} suppressHydrationWarning className={`kulha-quick-chip${selectedQuickPickup === "now" ? " is-active" : ""}`} aria-current={selectedQuickPickup === "now" ? "page" : undefined}>
                            <span className="kulha-quick-chip-dot" aria-hidden="true" />{t.pickupNow}
                        </Link>
                        <Link href={filterHref(values, locale, { pickupFrom: pickupRanges.tonight.from, pickupTo: pickupRanges.tonight.to })} scroll={false} suppressHydrationWarning className={`kulha-quick-chip${selectedQuickPickup === "tonight" ? " is-active" : ""}`} aria-current={selectedQuickPickup === "tonight" ? "page" : undefined}>
                            <span className="kulha-quick-chip-dot" aria-hidden="true" />{t.pickupTonight}
                        </Link>
                        <Link href={filterHref(values, locale, { pickupFrom: pickupRanges.tomorrow.from, pickupTo: pickupRanges.tomorrow.to })} scroll={false} suppressHydrationWarning className={`kulha-quick-chip${selectedQuickPickup === "tomorrow" ? " is-active" : ""}`} aria-current={selectedQuickPickup === "tomorrow" ? "page" : undefined}>
                            <span className="kulha-quick-chip-dot" aria-hidden="true" />{t.pickupTomorrow}
                        </Link>
                    </div>
                </div>

                <form id="kulha-filter-form" className="kulha-area-form" action={offersPath(locale)} method="get" aria-label={t.filterFormLabel} onSubmit={(event) => submitGetForm(event, locale, navigate)}>
                    {values.q && <input type="hidden" name="q" value={values.q} />}
                    {values.category && <input type="hidden" name="category" value={values.category} />}
                    <input type="hidden" name="page" value="0" />
                    <input type="hidden" name="size" value={values.size || "20"} />
                    <input type="hidden" name="pickupFrom" value={values.pickupFrom ?? ""} />
                    <input type="hidden" name="pickupTo" value={values.pickupTo ?? ""} />

                    <div className="kulha-filter-fields-grid">
                        <label>
                            <span>{t.city}</span>
                            <select name="city" defaultValue={values.city ?? ""}>
                                <option value="">{t.cityPlaceholder}</option>
                                {values.city && !offerCities().some((city) => city.value === values.city) && <option value={values.city}>{values.city}</option>}
                                {offerCities().map((city) => <option key={city.value} value={city.value}>{city.labels[locale]}</option>)}
                            </select>
                        </label>
                        <label>
                            <span>{t.district}</span>
                            <select name="district" defaultValue={values.district ?? ""}>
                                <option value="">{t.districtPlaceholder}</option>
                                {values.district && !offerDistricts(values.city).some((district) => district.value === values.district) && <option value={values.district}>{values.district}</option>}
                                {offerDistricts(values.city).map((district) => <option key={district.value} value={district.value}>{district.labels[locale]}</option>)}
                            </select>
                        </label>
                        <label>
                            <span>{t.maxPrice}</span>
                            <select name="maxPriceMinor" defaultValue={values.maxPriceMinor ?? ""}>
                                <option value="">{locale === "ar" ? "أي سعر" : locale === "fr" ? "Tous les prix" : "Any price"}</option>
                                {values.maxPriceMinor && !MAX_PRICE_PRESETS_MINOR.includes(Number(values.maxPriceMinor) as typeof MAX_PRICE_PRESETS_MINOR[number]) && <option value={values.maxPriceMinor}>{formatMad(Number(values.maxPriceMinor), locale)}</option>}
                                {MAX_PRICE_PRESETS_MINOR.map((amount) => <option key={amount} value={amount}>{t.underPrice} {formatMad(amount, locale)}</option>)}
                            </select>
                        </label>
                        <label>
                            <span>{t.sort}</span>
                            <select name="sort" defaultValue={values.sort ?? "pickup_end"}>
                                <option value="pickup_end">{t.pickupEnd}</option>
                                <option value="price">{t.price}</option>
                                <option value="newest">{t.newest}</option>
                            </select>
                        </label>
                    </div>

                    <div className="kulha-filter-extra-row">
                        <label className="kulha-include-soldout-toggle">
                            <input type="checkbox" name="availableOnly" value="false" defaultChecked={values.availableOnly === "false"} />
                            <span>{t.includeSoldOut}</span>
                        </label>
                        <details className="kulha-custom-filter-disclosure">
                            <summary>{t.customFilters}</summary>
                            <div className="kulha-filter-desktop">
                                <div className="kulha-filter-fields">
                                    <label>
                                        <span>{t.pickupFrom}</span>
                                        <input type="datetime-local" name="pickupFromLocal" defaultValue={localInputValue(values.pickupFrom)} />
                                    </label>
                                    <label>
                                        <span>{t.pickupTo}</span>
                                        <input type="datetime-local" name="pickupToLocal" defaultValue={localInputValue(values.pickupTo)} />
                                    </label>
                                </div>
                            </div>
                        </details>
                        <div className="kulha-filter-actions">
                            <button type="submit" disabled={isPending}>{isPending ? (locale === "fr" ? "Application…" : locale === "ar" ? "جارٍ التطبيق…" : "Applying…") : t.apply}</button>
                        </div>
                    </div>
                </form>
            </div>
        </section>
    );
}