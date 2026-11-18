"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { OfferSearch, PublicOfferSuggestion } from "@/lib/offers/public-api";
import { PriceSticker } from "@/components/ui/PriceSticker";
import { publicOfferCopy, offerCategoryLabel } from "@/lib/offers/public-copy";
import { offerDesignCopy } from "@/lib/offers/design-copy";
import { fetchPublicOfferSuggestions, offerSuggestionHref } from "@/lib/offers/suggestions";

function offersPath(locale: SiteLocale): string {
  return locale === "fr" ? "/offers" : `/${locale}/offers`;
}

function SearchIcon({ size = 20 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="10.8" cy="10.8" r="6.6" stroke="currentColor" strokeWidth="2" />
      <path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function suggestionLocation(item: PublicOfferSuggestion): string {
  return [item.district, item.city].filter(Boolean).join(" · ");
}

function suggestionIcon(category: string): string {
  const icons: Record<string, string> = {
    BREAD_PASTRY: "🥐",
    PREPARED_MEALS: "🍲",
    GROCERIES: "🛍️",
    FRUIT_VEG: "🥬",
    DRINKS: "🧃",
    SURPRISE_BASKET: "🧺",
    OTHER: "✳",
  };
  return icons[category] ?? icons.OTHER;
}

export function OfferSearchDisclosure({ locale, values }: { locale: SiteLocale; values: OfferSearch }) {
  const t = publicOfferCopy(locale);
  const [query, setQuery] = useState(values.q ?? "");
  const [suggestions, setSuggestions] = useState<PublicOfferSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // When the URL's search term changes (back/forward, a filter link), reset the box to match it.
  // Adjusting state during render avoids an extra effect-driven render pass.
  const [syncedQ, setSyncedQ] = useState(values.q);
  if (syncedQ !== values.q) {
    setSyncedQ(values.q);
    setQuery(values.q ?? "");
    setSuggestions([]);
    setActiveIndex(-1);
    setIsDismissed(false);
  }

  const normalized = query.trim();
  const searchActive = !isDismissed && normalized.length >= 2;
  // Drop any results and spinners the moment searching stops being active (short or dismissed query).
  const [wasSearchActive, setWasSearchActive] = useState(searchActive);
  if (wasSearchActive !== searchActive) {
    setWasSearchActive(searchActive);
    if (!searchActive) {
      setSuggestions([]);
      setIsLoading(false);
      setHasSearched(false);
      setHasError(false);
      setActiveIndex(-1);
    }
  }

  useEffect(() => {
    if (!searchActive) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setHasSearched(false);
      setHasError(false);
      try {
        const items = await fetchPublicOfferSuggestions(normalized, {
          city: values.city,
          district: values.district,
        }, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(items);
          setActiveIndex(-1);
        }
      } catch (error) {
        if (!controller.signal.aborted && !(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestions([]);
          setHasError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setHasSearched(true);
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchActive, normalized, values.city, values.district]);

  function clearQuery() {
    setQuery("");
    setSuggestions([]);
    setHasSearched(false);
    setHasError(false);
    setIsDismissed(false);
    setActiveIndex(-1);
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
      formRef.current?.requestSubmit();
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuggestions([]);
    const queryParams = new URLSearchParams();
    new FormData(event.currentTarget).forEach((value, key) => {
      if (typeof value === "string" && value !== "") queryParams.append(key, value);
    });
    const queryString = queryParams.toString();
    startTransition(() => router.push(`${offersPath(locale)}${queryString ? `?${queryString}` : ""}#kulha-offers-results`));
  }

  function chooseSuggestion(item: PublicOfferSuggestion) {
    setQuery(item.title);
    setSuggestions([]);
    setIsDismissed(true);
    setActiveIndex(-1);
    if (inputRef.current) inputRef.current.value = item.title;
    window.dispatchEvent(new Event("kulha:offers-filter-start"));
    startTransition(() => router.push(offerSuggestionHref(locale, item.id)));
  }

  const showStatus = query.trim().length >= 2 && !isDismissed && (isLoading || hasSearched && suggestions.length === 0);
  const hasSuggestions = suggestions.length > 0 && !isDismissed;

  return (
    <div className="kulha-search-disclosure">
      <form
        ref={formRef}
        action={offersPath(locale)}
        method="get"
        className="kulha-offers-search kulha-search-expanded"
        role="search"
        aria-label={t.searchLabel}
        onSubmit={submitSearch}
      >
        <span className="kulha-search-icon"><SearchIcon size={21} /></span>
        <label className="sr-only" htmlFor="kulha-offer-search">{t.searchLabel}</label>
        <input
          ref={inputRef}
          id="kulha-offer-search"
          name="q"
          type="search"
          maxLength={80}
          placeholder={offerDesignCopy(locale).searchPlaceholder}
          value={query}
          autoComplete="off"
          dir="auto"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={hasSuggestions}
          aria-controls={hasSuggestions ? "kulha-offer-suggestions" : undefined}
          aria-activedescendant={activeIndex >= 0 && hasSuggestions ? `kulha-offer-suggestion-${activeIndex}` : undefined}
          aria-busy={isLoading || isPending}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setSuggestions([]);
            setHasSearched(false);
            setHasError(false);
            setIsDismissed(false);
            setActiveIndex(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && (hasSuggestions || showStatus)) {
              event.preventDefault();
              setIsDismissed(true);
              setSuggestions([]);
              setActiveIndex(-1);
              return;
            }
            if (event.key === "ArrowDown" && suggestions.length) {
              event.preventDefault();
              setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1));
            }
            if (event.key === "ArrowUp" && suggestions.length) {
              event.preventDefault();
              setActiveIndex((current) => Math.max(current - 1, 0));
            }
            if (event.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
              event.preventDefault();
              chooseSuggestion(suggestions[activeIndex]);
            }
          }}
        />
        {(["category", "maxPriceMinor", "pickupFrom", "pickupTo", "city", "district", "sort", "size"] as const).map((key) =>
          values[key] ? <input key={key} type="hidden" name={key} value={values[key]} /> : null,
        )}
        <input type="hidden" name="availableOnly" value={values.availableOnly === "false" ? "false" : "true"} />
        <input type="hidden" name="page" value="0" />
        {query && (
          <button className="kulha-search-clear" type="button" onClick={clearQuery} aria-label={t.clearSearch} title={t.clearSearch}>
            <span aria-hidden="true">×</span>
          </button>
        )}
        <button className="kulha-search-submit" type="submit" aria-label={t.searchAction} title={t.searchAction}>
          <SearchIcon size={20} />
        </button>
      </form>
      {showStatus && (
        <div className="kulha-search-suggestion-status" role={hasError ? "alert" : "status"}>
          {isLoading ? t.suggestionsLoading : hasError ? t.suggestionsError : t.suggestionsEmpty}
        </div>
      )}
      {hasSuggestions && (
        <div className="kulha-search-suggestions">
          <div
            id="kulha-offer-suggestions"
            role="listbox"
            aria-label={t.suggestionsTitle}
          >
            {suggestions.map((item, index) => (
              <button
                key={item.id}
                id={`kulha-offer-suggestion-${index}`}
                type="button"
                role="option"
                aria-selected={activeIndex === index}
                className={`kulha-search-suggestion${activeIndex === index ? " is-active" : ""}`}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => chooseSuggestion(item)}
              >
                <span className="kulha-search-suggestion-art" aria-hidden="true">{suggestionIcon(item.category)}</span>
                <span className="kulha-search-suggestion-copy">
                  <strong><bdi dir="auto">{item.title}</bdi></strong>
                  <small>{t.suggestionShop} <bdi dir="auto">{item.merchantName}</bdi> · <bdi dir="auto">{suggestionLocation(item)}</bdi></small>
                  <small>{offerCategoryLabel(locale, item.category)}</small>
                </span>
                <span className="kulha-search-suggestion-price"><PriceSticker priceMinor={item.priceMinor} locale={locale} size="xs" /></span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
