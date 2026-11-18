"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { OfferSearch } from "@/lib/offers/public-api";
import { publicOfferCopy } from "@/lib/offers/public-copy";
import { offerAreaLabel } from "@/lib/offers/design-copy";
import { searchNearbyOffers } from "@/lib/offers/nearby-client";
import { useOfferNearby } from "@/components/offers/OfferNearbyContext";

type LocationState = "idle" | "loading" | "error";
type ReverseLocation = { label?: string };
type SavedLocation = { latitude: number; longitude: number; label: string; savedAt: number };
const SAVED_LOCATION_KEY = "kulha:approved-location:v1";
const LOCATION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

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
  const restoreSnapshotRef = useRef({ values, copy });
  const { setResults } = useOfferNearby();
  const [state, setState] = useState<LocationState>("idle");
  const areaLabel = offerAreaLabel(locale, values);
  const [geoLabel, setLocationLabel] = useState<string | null>(null);
  // A device location the visitor approved wins; otherwise show the chosen area ("Casablanca · Maarif").
  const locationLabel = geoLabel ?? areaLabel ?? copy.nearMeLabel;
  const [message, setMessage] = useState("");

  async function loadLocation(latitude: number, longitude: number, existingLabel?: string) {
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
    const reverseRequest = existingLabel ? Promise.resolve({ label: existingLabel }) : fetch("/api/bff/map/reverse-geocode", {
      method: "POST", cache: "no-store", credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude, locale }),
      signal: AbortSignal.timeout(10_000),
    }).then(async (response) => {
      if (!response.ok) throw new Error(`REVERSE_GEOCODE_${response.status}`);
      return await response.json() as ReverseLocation;
    });
    const [nearbyResult, locationResult] = await Promise.allSettled([nearbyRequest, reverseRequest]);
    const label = locationResult.status === "fulfilled" && locationResult.value.label ? locationResult.value.label : existingLabel ?? copy.nearMeLabel;
    setLocationLabel(label);
    // Persist the visitor-approved location even if the offers endpoint is temporarily unavailable.
    try {
      window.localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify({ latitude, longitude, label, savedAt: Date.now() } satisfies SavedLocation));
    } catch { /* Storage can be unavailable in private browsing; the current session still works. */ }
    if (nearbyResult.status === "rejected") throw nearbyResult.reason;
    setResults(nearbyResult.value);
  }

  // A visitor who already granted permission should not have to repeat the action after a reload.
    useEffect(() => {
        let cancelled = false;

        try {
            const raw = window.localStorage.getItem(SAVED_LOCATION_KEY);
            if (!raw) return;

            const saved = JSON.parse(raw) as SavedLocation;

            if (
                !Number.isFinite(saved.latitude) ||
                !Number.isFinite(saved.longitude) ||
                !saved.savedAt ||
                Date.now() - saved.savedAt > LOCATION_MAX_AGE
            ) {
                window.localStorage.removeItem(SAVED_LOCATION_KEY);
                return;
            }

            const snapshot = restoreSnapshotRef.current;
            const savedLabel = saved.label || snapshot.copy.nearMeLabel;
            const savedValues = snapshot.values;

            void searchNearbyOffers({
                latitude: saved.latitude,
                longitude: saved.longitude,
                radiusMeters: 5000,
                ...(savedValues.q ? { q: savedValues.q } : {}),
                ...(savedValues.category ? { category: savedValues.category } : {}),
                ...(savedValues.maxPriceMinor ? { maxPriceMinor: Number(savedValues.maxPriceMinor) } : {}),
                ...(savedValues.pickupFrom ? { pickupFrom: savedValues.pickupFrom } : {}),
                ...(savedValues.pickupTo ? { pickupTo: savedValues.pickupTo } : {}),
                ...(savedValues.city ? { city: savedValues.city } : {}),
                ...(savedValues.district ? { district: savedValues.district } : {}),
                availableOnly: savedValues.availableOnly !== "false",
                page: 0,
                size: Math.min(Math.max(Number(savedValues.size ?? 20), 1), 50),
            }).then((page) => {
                if (cancelled) return;

                setLocationLabel(savedLabel);
                setResults(page);
            }).catch(() => {
                if (cancelled) return;

                setLocationLabel(savedLabel);
                setMessage(snapshot.copy.nearbyServiceError);
            });
        } catch {
        }

        return () => {
            cancelled = true;
        };
    }, [setResults]);

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
