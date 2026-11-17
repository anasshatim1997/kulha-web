"use client";

import { useState } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { OfferSearch } from "@/lib/offers/public-api";
import { searchNearbyOffers } from "@/lib/offers/nearby-client";
import { publicOfferCopy } from "@/lib/offers/public-copy";
import { useOfferNearby } from "@/components/offers/OfferNearbyContext";

type LocationState = "idle" | "loading" | "error";

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12_000,
      maximumAge: 0,
    });
  });
}

function locationError(error: unknown, copy: ReturnType<typeof publicOfferCopy>): string {
  if (error instanceof Error && error.message === "unsupported") return copy.nearMeUnsupported;
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = Number((error as { code: unknown }).code);
    if (code === 1) return copy.nearMePermissionDenied;
    if (code === 2) return copy.nearMeUnavailable;
    if (code === 3) return copy.nearMeTimeout;
  }
  if (error instanceof Error && error.message.startsWith("PUBLIC_OFFERS_NEARBY_")) return copy.nearbyServiceError;
  return copy.nearMeError;
}

export function OfferNearMeButton({ locale, values }: { locale: SiteLocale; values: OfferSearch }) {
  const t = publicOfferCopy(locale);
  const { setResults, clearResults, results } = useOfferNearby();
  const [state, setState] = useState<LocationState>("idle");
  const [message, setMessage] = useState("");
  const [radiusMeters, setRadiusMeters] = useState(5000);

  async function findNearby() {
    setState("loading");
    setMessage("");
    try {
      const position = await getCurrentPosition();
      const page = await searchNearbyOffers({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        radiusMeters,
        ...(values.q ? { q: values.q } : {}),
        ...(values.category ? { category: values.category } : {}),
        ...(values.maxPriceMinor ? { maxPriceMinor: Number(values.maxPriceMinor) } : {}),
        ...(values.pickupFrom ? { pickupFrom: values.pickupFrom } : {}),
        ...(values.pickupTo ? { pickupTo: values.pickupTo } : {}),
        ...(values.city ? { city: values.city } : {}),
        ...(values.district ? { district: values.district } : {}),
        availableOnly: values.availableOnly !== "false",
        page: 0,
        size: Math.min(Number(values.size || 20), 50),
      });
      setResults(page);
      setMessage(t.nearbySuccess.replace("{count}", String(page.total)).replace("{radius}", String(radiusMeters / 1000)));
    } catch (error) {
      setMessage(locationError(error, t));
      setState("error");
      return;
    }
    setState("idle");
  }

  return (
    <div className="kulha-near-me-wrap">
      <button
        className={`kulha-near-me-button${results ? " is-active" : ""}`}
        type="button"
        onClick={() => void findNearby()}
        disabled={state === "loading"}
        aria-busy={state === "loading"}
        title={t.nearMeHint}
      >
        <svg className="kulha-near-me-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
          <path d="M19 10.2c0 5.1-7 10.3-7 10.3S5 15.3 5 10.2a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2.35" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        <span>{state === "loading" ? t.nearMeLoading : t.nearMeLabel}</span>
      </button>
      <label className="kulha-nearby-radius">
        <span className="sr-only">{t.radiusLabel}</span>
        <select value={radiusMeters} onChange={(event) => setRadiusMeters(Number(event.currentTarget.value))} disabled={state === "loading"} aria-label={t.radiusLabel}>
          <option value={1000}>1 km</option>
          <option value={3000}>3 km</option>
          <option value={5000}>5 km</option>
          <option value={10000}>10 km</option>
          <option value={25000}>25 km</option>
        </select>
      </label>
      {results && <button type="button" className="kulha-near-me-reset" onClick={() => { clearResults(); setMessage(""); }}>{t.resetNearby}</button>}
      {message && <p className={`kulha-near-me-feedback${state === "error" ? " is-error" : ""}`} role={state === "error" ? "alert" : "status"}>{message}</p>}
    </div>
  );
}
