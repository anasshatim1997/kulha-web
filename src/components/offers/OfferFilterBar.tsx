
"use client";

import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    useTransition,
    type CSSProperties,
    type FormEvent,
    type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { publicOfferCopy } from "@/lib/offers/public-copy";
import type { OfferSearch } from "@/lib/offers/public-api";
import { offerDistricts } from "@/lib/offers/location-options";
import { utcToCasablancaLocal } from "@/lib/time/casablanca";
import { offerDesignCopy } from "@/lib/offers/design-copy";

export const MAX_PRICE_PRESETS_MINOR = [5000, 10000, 20000] as const;

type FilterKey =
    | "q"
    | "category"
    | "maxPriceMinor"
    | "pickupFrom"
    | "pickupTo"
    | "city"
    | "district"
    | "sort"
    | "availableOnly";

export type QuickPickupRanges = Record<
    "now" | "tonight" | "tomorrow",
    { from: string; to: string }
>;

function offersPath(locale: SiteLocale): string {
    return locale === "fr" ? "/offers" : `/${locale}/offers`;
}

function displayInstant(value: string, locale: SiteLocale): string {
    const date = new Date(value);

    if (!Number.isFinite(date.getTime())) return value;

    const localeTag =
        locale === "fr"
            ? "fr-MA"
            : locale === "ar"
                ? "ar-MA"
                : "en-MA";

    return new Intl.DateTimeFormat(localeTag, {
        timeZone: "Africa/Casablanca",
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}

function filterHref(
    values: OfferSearch,
    locale: SiteLocale,
    overrides: Partial<Record<FilterKey, string>> = {},
    omit?: FilterKey,
    basePath?: string,
): string {
    const query = new URLSearchParams();

    const keys: FilterKey[] = [
        "q",
        "category",
        "maxPriceMinor",
        "pickupFrom",
        "pickupTo",
        "city",
        "district",
        "sort",
    ];

    for (const key of keys) {
        if (key === omit) continue;

        const value = overrides[key] ?? values[key];

        if (value) query.set(key, value);
    }

    if (omit !== "availableOnly") {
        const availableOnly =
            overrides.availableOnly ?? values.availableOnly;

        if (availableOnly === "false") {
            query.set("availableOnly", "false");
        } else if (availableOnly === "true") {
            query.set("availableOnly", "true");
        }
    }

    query.set("page", "0");
    query.set("size", values.size || "20");

    if (basePath?.includes("/offers/map")) query.set("filters", "open");
    return `${basePath ?? offersPath(locale)}?${query.toString()}#kulha-offers-results`;
}

function matchesQuickPickup(
    from: string | undefined,
    to: string | undefined,
    range: { from: string; to: string },
): boolean {
    if (!from || !to) return false;

    const fromDelta = Math.abs(Date.parse(from) - Date.parse(range.from));
    const toDelta = Math.abs(Date.parse(to) - Date.parse(range.to));

    return (
        Number.isFinite(fromDelta) &&
        Number.isFinite(toDelta) &&
        fromDelta <= 120_000 &&
        toDelta <= 120_000
    );
}

function localInputValue(value: string | undefined): string {
    if (!value) return "";

    try {
        return utcToCasablancaLocal(value);
    } catch {
        return "";
    }
}

function submitGetForm(
    event: FormEvent<HTMLFormElement>,
    locale: SiteLocale,
    navigate: (href: string) => void,
    basePath = offersPath(locale),
) {
    event.preventDefault();

    const query = new URLSearchParams();
    const data = new FormData(event.currentTarget);

    data.forEach((value, key) => {
        if (typeof value === "string" && value !== "") {
            query.append(key, value);
        }
    });

    for (const key of ["pickupFrom", "pickupTo"] as const) {
        if (data.get(`${key}Local`) === "") {
            query.delete(key);
        }
    }

    if (basePath.includes("/offers/map")) query.set("filters", "open");
    const search = query.toString();

    navigate(
        `${basePath}${search ? `?${search}` : ""}#kulha-offers-results`,
    );
}

function priceChipLabel(
    minor: number,
    d: ReturnType<typeof offerDesignCopy>,
    locale: SiteLocale,
): string {
    const amount = new Intl.NumberFormat(
        locale === "fr"
            ? "fr-MA"
            : locale === "ar"
                ? "ar-MA"
                : "en-MA",
        {
            maximumFractionDigits: 2,
        },
    ).format(minor / 100);

    return `${d.under} ${amount} ${d.mad}`;
}

export function OfferActiveFilters({
                                       locale,
                                       values,
                                       pickupRanges,
                                       total,
                                       children,
                                   }: {
    locale: SiteLocale;
    values: OfferSearch;
    pickupRanges?: QuickPickupRanges;
    total?: number;
    children?: ReactNode;
}) {
    const t = publicOfferCopy(locale);
    const d = offerDesignCopy(locale);

    const chips: {
        key: FilterKey | "pickup";
        label: string;
        omit: FilterKey[];
    }[] = [];

    if (values.q) {
        chips.push({
            key: "q",
            label: `“${values.q}”`,
            omit: ["q"],
        });
    }

    if (values.maxPriceMinor) {
        const minorUnits = Number(values.maxPriceMinor);

        chips.push({
            key: "maxPriceMinor",
            label:
                Number.isSafeInteger(minorUnits) && minorUnits >= 0
                    ? priceChipLabel(minorUnits, d, locale)
                    : values.maxPriceMinor,
            omit: ["maxPriceMinor"],
        });
    }

    const quick = pickupRanges
        ? (Object.keys(pickupRanges) as (keyof QuickPickupRanges)[]).find(
            (key) =>
                matchesQuickPickup(
                    values.pickupFrom,
                    values.pickupTo,
                    pickupRanges[key],
                ),
        )
        : undefined;

    if ((values.pickupFrom || values.pickupTo) && !quick) {
        const label = [
            values.pickupFrom && displayInstant(values.pickupFrom, locale),
            values.pickupTo && displayInstant(values.pickupTo, locale),
        ]
            .filter(Boolean)
            .join(" → ");

        chips.push({
            key: "pickup",
            label,
            omit: ["pickupFrom", "pickupTo"],
        });
    }

    if (values.availableOnly === "false") {
        chips.push({
            key: "availableOnly",
            label: d.soldOutIncluded,
            omit: ["availableOnly"],
        });
    }

    if (chips.length === 0 && total === undefined) {
        return null;
    }

    return (
        <div className="kulha-results-bar">
            {total !== undefined && (
                <h2
                    id="kulha-results-title"
                    className="kulha-results-bar-count"
                    aria-live="polite"
                    aria-label={t.availableTitle}
                >
                    <bdi dir="auto">{total}</bdi>{" "}
                    {total === 1 ? d.basketSingle : d.basketPlural}
                </h2>
            )}

            {chips.length > 0 && (
                <div
                    className="kulha-active-filters"
                    aria-label={t.activeFilters}
                >
                    {chips.map((chip) => (
                        <Link
                            key={chip.key}
                            href={omitFilters(values, locale, chip.omit)}
                            scroll={false}
                            className="kulha-filter-chip"
                        >
                            <span>
                                <bdi dir="auto">{chip.label}</bdi>
                            </span>

                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="m7 7 10 10M17 7 7 17" />
                            </svg>

                            <span className="sr-only">
                                {t.removeFilter}
                            </span>
                        </Link>
                    ))}

                    <Link
                        className="kulha-filter-clear-all"
                        href={offersPath(locale)}
                        scroll={false}
                    >
                        {d.clearAll}
                    </Link>
                </div>
            )}

            {children}
        </div>
    );
}

function omitFilters(
    values: OfferSearch,
    locale: SiteLocale,
    omit: FilterKey[],
): string {
    const query = new URLSearchParams();

    for (const key of [
        "q",
        "category",
        "maxPriceMinor",
        "pickupFrom",
        "pickupTo",
        "city",
        "district",
        "sort",
    ] as const) {
        if (omit.includes(key)) continue;

        if (values[key]) {
            query.set(key, values[key] as string);
        }
    }

    if (
        !omit.includes("availableOnly") &&
        values.availableOnly === "false"
    ) {
        query.set("availableOnly", "false");
    }

    query.set("page", "0");
    query.set("size", values.size || "20");

    return `${offersPath(locale)}?${query.toString()}#kulha-offers-results`;
}

const MAX_PRICE_CHOICES = ["", "2000", "4000", "6000"] as const;

export function OfferFilterBar({
                                   locale,
                                   values,
                                   pickupRanges,
                                   total,
                                   initialOpen = false,
                               }: {
    locale: SiteLocale;
    values: OfferSearch;
    pickupRanges: QuickPickupRanges;
    total?: number;
    initialOpen?: boolean;
}) {
    const t = publicOfferCopy(locale);
    const d = offerDesignCopy(locale);
    const router = useRouter();

    const [isPending, startTransition] = useTransition();
    const targetPath = basePath ?? offersPath(locale);

    const [isOpen, setIsOpen] = useState(initialOpen);

    const hasCustomPickup =
        Boolean(values.pickupFrom || values.pickupTo) &&
        !(Object.keys(pickupRanges) as (keyof QuickPickupRanges)[]).some(
            (key) =>
                matchesQuickPickup(
                    values.pickupFrom,
                    values.pickupTo,
                    pickupRanges[key],
                ),
        );

    const [customOpen, setCustomOpen] = useState(hasCustomPickup);

    const toggleRef = useRef<HTMLButtonElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);

    const [anchor, setAnchor] = useState<{
        top: number;
        inline: number;
        arrow: number;
    } | null>(null);

    const [closing, setClosing] = useState(false);

    const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );

    const closeRef = useRef<() => void>(() => {});

    useEffect(() => {
        return () => {
            if (closeTimer.current !== undefined) {
                clearTimeout(closeTimer.current);
            }
        };
    }, []);

    const close = () => {
        if (closing) return;

        if (
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            setAnchor(null);
            setIsOpen(false);
            setClosing(false);
            return;
        }

        setClosing(true);

        closeTimer.current = setTimeout(() => {
            closeTimer.current = undefined;

            setAnchor(null);
            setIsOpen(false);
            setClosing(false);
        }, 150);
    };

    useLayoutEffect(() => {
        closeRef.current = close;
    });

    useLayoutEffect(() => {
        if (!isOpen) return;

        const toggle = toggleRef.current;

        if (!toggle) return;

        const desktop = window.matchMedia("(min-width: 760px)").matches;
        const GAP = 20;

        const place = () => {
            if (!desktop) {
                setAnchor(null);
                return;
            }

            const rect = toggle.getBoundingClientRect();
            const rtl = getComputedStyle(toggle).direction === "rtl";
            const root = document.documentElement;

            setAnchor({
                top: Math.round(rect.bottom + GAP),
                inline: Math.round(
                    rtl ? rect.left : root.clientWidth - rect.right,
                ),
                arrow: Math.round(rect.width / 2),
            });
        };

        place();

        const root = document.documentElement;

        const previous = {
            overflow: root.style.overflow,
            gutter: root.style.scrollbarGutter,
        };

        root.style.scrollbarGutter = "stable";
        root.style.overflow = "hidden";

        const onKey = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;

            event.preventDefault();

            closeRef.current();
            toggle.focus();
        };

        window.addEventListener("keydown", onKey);
        window.addEventListener("resize", place);

        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("resize", place);

            root.style.overflow = previous.overflow;
            root.style.scrollbarGutter = previous.gutter;
        };
    }, [isOpen]);

    const popoverStyle = anchor
        ? ({
            "--ko-pop-top": `${anchor.top}px`,
            "--ko-pop-inline": `${anchor.inline}px`,
            "--ko-pop-arrow": `${anchor.arrow}px`,
        } as CSSProperties)
        : undefined;

    const navigate = (href: string) => {
        startTransition(() => router.push(href));
    };

    const selectedQuickPickup = (
        Object.keys(pickupRanges) as (keyof QuickPickupRanges)[]
    ).find((key) =>
        matchesQuickPickup(
            values.pickupFrom,
            values.pickupTo,
            pickupRanges[key],
        ),
    );

    const hasFilters = Boolean(
        values.q ||
        values.category ||
        values.maxPriceMinor ||
        values.pickupFrom ||
        values.pickupTo ||
        values.city ||
        values.district ||
        values.availableOnly === "false" ||
        (values.sort && values.sort !== "pickup_end"),
    );

    const activeCount = [
        values.q,
        values.category,
        values.maxPriceMinor,
        values.city,
        values.district,
        hasCustomPickup,
        values.availableOnly === "false",
        values.sort && values.sort !== "pickup_end",
    ].filter(Boolean).length;

    const submitLabel = isPending
        ? d.applying
        : d.showBaskets
            .replace(
                "{count}",
                total === undefined ? "" : String(total),
            )
            .replace("  ", " ")
            .trim();

    const quickChip = (
        key: keyof QuickPickupRanges,
        label: string,
    ) => (
        <Link
            key={key}
            href={filterHref(values, locale, {
                pickupFrom: pickupRanges[key].from,
                pickupTo: pickupRanges[key].to,
            }, undefined, targetPath)}
            scroll={false}
            suppressHydrationWarning
            className={`kulha-quick-chip${
                selectedQuickPickup === key ? " is-active" : ""
            }`}
            aria-current={
                selectedQuickPickup === key ? "page" : undefined
            }
        >
            {label}
        </Link>
    );

    return (
        <section
            className="kulha-filter-shell kulha-inline-filter-bar"
            aria-busy={isPending}
            aria-label={t.filterFormLabel}
        >
            <button
                ref={toggleRef}
                type="button"
                className={`${triggerClassName ?? "kulha-filter-toggle"}${
                    isOpen ? " is-open" : ""
                }`}
                aria-expanded={isOpen}
                aria-controls="kulha-filter-panel"
                onClick={() => {
                    if (isOpen) {
                        closeRef.current();
                    } else {
                        setIsOpen(true);
                    }
                }}
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 8h9m4 0h3M4 16h3m4 0h9" />
                    <circle cx="15" cy="8" r="2" />
                    <circle cx="9" cy="16" r="2" />
                </svg>

                <span>{d.filters}</span>

                {activeCount > 0 && (
                    <span className="kulha-filter-toggle-count">
                        {activeCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <button
                    type="button"
                    className={`kulha-filter-backdrop${
                        closing ? " is-closing" : ""
                    }`}
                    aria-label={d.filtersClose}
                    tabIndex={-1}
                    onClick={() => closeRef.current()}
                />
            )}

            <div
                className={`kulha-filter-expanded${
                    closing ? " is-closing" : ""
                }`}
                id="kulha-filter-panel"
                hidden={!isOpen}
                role="dialog"
                aria-modal="true"
                aria-labelledby="kulha-filter-dialog-title"
                style={popoverStyle}
            >
                <div
                    className="kulha-filter-dialog-body"
                    ref={bodyRef}
                >
                    <div className="kulha-filter-dialog-top">
                        <h2 id="kulha-filter-dialog-title">
                            {d.filters}
                        </h2>

                        <div className="kulha-filter-dialog-actions">
                            {hasFilters && (
                                <Link
                                    href={targetPath}
                                    scroll={false}
                                    className="kulha-filter-reset"
                                >
                                    {d.reset}
                                </Link>
                            )}

                            <button
                                type="button"
                                className="kulha-filter-close"
                                aria-label={d.filtersClose}
                                onClick={() => closeRef.current()}
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="m6 6 12 12M18 6 6 18" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="kulha-filter-quick-row">
                        <span className="kulha-filter-section-label">
                            {d.pickup}
                        </span>

                        <div className="kulha-filter-price-chips">
                            {quickChip("now", t.pickupNow)}
                            {quickChip("tonight", t.pickupTonight)}
                            {quickChip("tomorrow", t.pickupTomorrow)}

                            <button
                                type="button"
                                className={`kulha-quick-chip${
                                    hasCustomPickup ? " is-active" : ""
                                }`}
                                aria-expanded={customOpen}
                                onClick={() => setCustomOpen(true)}
                            >
                                {d.pickPickupTime}
                            </button>
                        </div>
                    </div>

                    <div
                        className="kulha-filter-price-quick"
                        aria-label={d.maxPrice}
                    >
                        <span className="kulha-filter-section-label">
                            {d.maxPrice}
                        </span>

                        <div className="kulha-filter-price-chips">
                            {MAX_PRICE_CHOICES.map((value) => (
                                <Link
                                    key={value || "any"}
                                    href={filterHref(values, locale, {
                                        maxPriceMinor: value,
                                    }, undefined, targetPath)}
                                    scroll={false}
                                    className={`kulha-quick-chip${
                                        (values.maxPriceMinor ?? "") === value
                                            ? " is-active"
                                            : ""
                                    }`}
                                >
                                    {value
                                        ? `${d.under} ${Number(value) / 100}`
                                        : d.any}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <form
                        id="kulha-filter-form"
                        className="kulha-area-form"
                        action={targetPath}
                        method="get"
                        aria-label={t.filterFormLabel}
                        onSubmit={(event) =>
                            submitGetForm(event, locale, navigate, targetPath)
                        }
                    >
                        {values.q && (
                            <input
                                type="hidden"
                                name="q"
                                value={values.q}
                            />
                        )}

                        {values.category && (
                            <input
                                type="hidden"
                                name="category"
                                value={values.category}
                            />
                        )}

                        <input
                            type="hidden"
                            name="page"
                            value="0"
                        />

                        <input
                            type="hidden"
                            name="size"
                            value={values.size || "20"}
                        />

                        <input
                            type="hidden"
                            name="pickupFrom"
                            value={values.pickupFrom ?? ""}
                        />

                        <input
                            type="hidden"
                            name="pickupTo"
                            value={values.pickupTo ?? ""}
                        />

                        {values.city && (
                            <input
                                type="hidden"
                                name="city"
                                value={values.city}
                            />
                        )}

                        <input
                            type="hidden"
                            name="maxPriceMinor"
                            value={values.maxPriceMinor ?? ""}
                        />

                        <div className="kulha-filter-fields-grid">
                            <label>
                                <span>{d.area}</span>

                                <span className="kulha-select">
                                    <select
                                        name="district"
                                        defaultValue={values.district ?? ""}
                                    >
                                        <option value="">
                                            {d.allAreas}
                                        </option>

                                        {values.district &&
                                            !offerDistricts(values.city).some(
                                                (district) =>
                                                    district.value ===
                                                    values.district,
                                            ) && (
                                                <option value={values.district}>
                                                    {values.district}
                                                </option>
                                            )}

                                        {offerDistricts(values.city).map(
                                            (district) => (
                                                <option
                                                    key={district.value}
                                                    value={district.value}
                                                >
                                                    {district.labels[locale]}
                                                </option>
                                            ),
                                        )}
                                    </select>

                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </span>
                            </label>

                            <label>
                                <span>{d.sortBy}</span>

                                <span className="kulha-select">
                                    <select
                                        name="sort"
                                        defaultValue={
                                            values.sort ?? "pickup_end"
                                        }
                                    >
                                        <option value="pickup_end">
                                            {locale === "fr"
                                                ? "Se termine bientôt"
                                                : locale === "ar"
                                                    ? "ينتهي قريباً"
                                                    : "Ending soon"}
                                        </option>

                                        <option value="price">
                                            {t.price}
                                        </option>

                                        <option value="newest">
                                            {t.newest}
                                        </option>
                                    </select>

                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </span>
                            </label>
                        </div>

                        <div className="kulha-filter-extra-row">
                            <label className="kulha-include-soldout-toggle">
                                <span>{d.includeSoldOut}</span>

                                <input
                                    type="checkbox"
                                    role="switch"
                                    name="availableOnly"
                                    value="false"
                                    defaultChecked={
                                        values.availableOnly === "false"
                                    }
                                />

                                <span
                                    className="kulha-switch"
                                    aria-hidden="true"
                                />
                            </label>

                            <details
                                className="kulha-custom-filter-disclosure"
                                open={customOpen}
                                onToggle={(event) => {
                                    const open = event.currentTarget.open;

                                    setCustomOpen(open);

                                    if (open) {
                                        requestAnimationFrame(() =>
                                            bodyRef.current?.scrollTo({
                                                top: bodyRef.current.scrollHeight,
                                                behavior: "smooth",
                                            }),
                                        );
                                    }
                                }}
                            >
                                <summary>
                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="8.5"
                                        />
                                        <path d="M12 7.5V12l3 2" />
                                    </svg>

                                    <span>{d.customPickup}</span>

                                    <svg
                                        className="kulha-summary-chevron"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </summary>

                                <div className="kulha-filter-fields">
                                    <label>
                                        <span>{t.pickupFrom}</span>

                                        <input
                                            type="datetime-local"
                                            name="pickupFromLocal"
                                            defaultValue={localInputValue(
                                                values.pickupFrom,
                                            )}
                                        />
                                    </label>

                                    <label>
                                        <span>{t.pickupTo}</span>

                                        <input
                                            type="datetime-local"
                                            name="pickupToLocal"
                                            defaultValue={localInputValue(
                                                values.pickupTo,
                                            )}
                                        />
                                    </label>
                                </div>
                            </details>

                            <div className="kulha-filter-actions">
                                <button
                                    type="button"
                                    className="kulha-filter-cancel"
                                    onClick={() => closeRef.current()}
                                >
                                    {d.cancel}
                                </button>

                                <button
                                    type="submit"
                                    disabled={isPending}
                                >
                                    {submitLabel}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}
