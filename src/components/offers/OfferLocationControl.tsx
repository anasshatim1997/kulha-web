"use client";

import { useState } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { OfferSearch } from "@/lib/offers/public-api";
import { publicOfferCopy } from "@/lib/offers/public-copy";
import { offerAreaLabel } from "@/lib/offers/design-copy";
import { searchNearbyOffers } from "@/lib/offers/nearby-client";
import { useOfferNearby } from "@/components/offers/OfferNearbyContext";

type LocationState = "idle" | "loading" | "error";
type ReverseLocation = { label?: string };

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12_000,
      maximumAge: 30_000,
    });
  });
}

function getErrorMessage(error: unknown, copy: ReturnType<typeof publicOfferCopy>): string {
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

export function OfferLocationControl({ locale, values }: { locale: SiteLocale; values: OfferSearch }) {
  const copy = publicOfferCopy(locale);
  const { setResults } = useOfferNearby();
  const [state, setState] = useState<LocationState>("idle");
  const areaLabel = offerAreaLabel(locale, values);
  const [geoLabel, setLocationLabel] = useState<string | null>(null);
  // A device location the visitor approved wins; otherwise show the chosen area ("Casablanca · Maarif").
  const locationLabel = geoLabel ?? areaLabel ?? copy.nearMeLabel;
  const [message, setMessage] = useState("");

  async function loadLocation(latitude: number, longitude: number) {
    const requestedSize = Number(values.size ?? 20);
    const nearbySize = Number.isInteger(requestedSize) && requestedSize > 0 ? Math.min(requestedSize, 50) : 20;
    const nearbyRequest = searchNearbyOffers({
      latitude, longitude, radiusMeters: 5000,
      ...(values.q ? { q: values.q } : {}),
      ...(values.category ? { category: values.category } : {}),
      ...(values.maxPriceMinor ? { maxPriceMinor: Number(values.maxPriceMinor) } : {}),
      ...(values.pickupFrom ? { pickupFrom: values.pickupFrom } : {}),
      ...(values.pickupTo ? { pickupTo: values.pickupTo } : {}),
      ...(values.city ? { city: values.city } : {}),
      ...(values.district ? { district: values.district } : {}),
      availableOnly: values.availableOnly !== "false", page: 0, size: nearbySize,
    });
    const reverseRequest = fetch("/api/bff/map/reverse-geocode", {
      method: "POST", cache: "no-store", credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude, locale }),
      signal: AbortSignal.timeout(10_000),
    }).then(async (response) => {
      if (!response.ok) throw new Error(`REVERSE_GEOCODE_${response.status}`);
      return await response.json() as ReverseLocation;
    });
    const [nearbyResult, locationResult] = await Promise.allSettled([nearbyRequest, reverseRequest]);
    const label = locationResult.status === "fulfilled" && locationResult.value.label ? locationResult.value.label : copy.nearMeLabel;
    setLocationLabel(label);
    if (nearbyResult.status === "rejected") throw nearbyResult.reason;
    setResults(nearbyResult.value);
  }

  async function locate() {
    setState("loading");
    setMessage("");
    try {
      const position = await getCurrentPosition();
      await loadLocation(position.coords.latitude, position.coords.longitude);
      setState("idle");
    } catch (error) {
      setMessage(getErrorMessage(error, copy));
      setState("error");
    }
  }

  return (
    <div className="kulha-location-control-wrap">
      <button
        type="button"
        className={`kulha-location-control${state === "error" ? " is-error" : ""}`}
        onClick={() => void locate()}
        disabled={state === "loading"}
        aria-busy={state === "loading"}
        title={locationLabel}
        aria-label={locationLabel}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 10.2c0 5.1-7 10.3-7 10.3S5 15.3 5 10.2a7 7 0 1 1 14 0Z" />
          <circle cx="12" cy="10" r="2.35" />
        </svg>
        <span className="kulha-location-control-label">{state === "loading" ? copy.nearMeLoading : locationLabel}</span>
        <svg className="kulha-location-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
      </button>
      {message && <p className="kulha-location-feedback" role="alert">{message}</p>}
    </div>
  );
}
