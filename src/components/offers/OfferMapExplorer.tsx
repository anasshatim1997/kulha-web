"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { offerCategoryLabel, publicOfferCopy } from "@/lib/offers/public-copy";
import { formatPickupWindow } from "@/lib/offers/format";
import { localizedOfferPath } from "@/lib/offers/paths";
import type { OfferSearch, PublicOffer, PublicOfferDetail } from "@/lib/offers/public-api";
import { averageMapCoordinate, groupOffersIntoMapStores, groupOffersWithoutCoordinates, hasMapCoordinates, type MapCoordinate, type OfferMapStore, type OfferMapStoreCandidate } from "@/lib/offers/map-ranking";
import { geocodePublicShop } from "@/lib/offers/map-geocoding";
import { getDrivingRoute, searchOffersForMap, type DrivingRoute, type RouteMode } from "@/lib/offers/nearby-client";
import { OfferStoreMapCanvas } from "@/components/offers/OfferStoreMapCanvas";
import { buildGoogleMapsDirectionsUrl } from "@/lib/maps/google-directions";
import "@/components/offers/map-route.css";
import "@/components/offers/offer-map.css";
import { merchantInitials } from "@/lib/offers/merchant-initials";
import { PriceSticker } from "@/components/ui/PriceSticker";
import { OfferFilterBar } from "@/components/offers/OfferFilterBar";
import { getCasablancaQuickPickupRanges } from "@/lib/time/casablanca";

const CASABLANCA_CENTER: MapCoordinate = { latitude: 33.5731, longitude: -7.5898 };
const MOROCCO_CENTER: MapCoordinate = { latitude: 31.7917, longitude: -7.0926 };

type Props = {
    locale: SiteLocale;
    values: OfferSearch;
    initialOffers: PublicOffer[];
    focusOffer?: PublicOfferDetail | null;
    backHref: string;
    initialLoadFailed?: boolean;
    initialTotal?: number;
    initialFiltersOpen?: boolean;
};

type Position = MapCoordinate;
type MobileView = "map" | "list";
type StoreEntry = OfferMapStore | OfferMapStoreCandidate;
type GeolocationState = "idle" | "locating" | "granted" | "denied" | "unavailable" | "timeout" | "unsupported" | "insecure";
type LocationError = { code?: number; message?: string };
type PermissionSnapshot = PermissionState | "unknown";

function routeDistanceLabel(meters: number): string {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function routeDurationLabel(seconds: number): string {
    const minutes = Math.max(1, Math.round(seconds / 60));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining ? `${hours} h ${remaining} min` : `${hours} h`;
}

function requestCurrentPosition(options: PositionOptions): Promise<Position> {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
            reject,
            options,
        );
    });
}

function geolocationErrorCode(error: unknown): number | null {
    if (typeof error !== "object" || error === null || !("code" in error)) return null;
    const code = Number((error as LocationError).code);
    return Number.isFinite(code) ? code : null;
}

function locationFailureState(error: unknown, permissionState: PermissionState | "unknown"): GeolocationState {
    const code = geolocationErrorCode(error);
    if (code === 1 || permissionState === "denied") return "denied";
    if (code === 3) return "timeout";
    return "unavailable";
}

function locationMessageForState(state: GeolocationState, copy: ReturnType<typeof publicOfferCopy>): string {
    switch (state) {
        case "denied": return copy.mapLocationDenied;
        case "unavailable": return copy.mapLocationUnavailable;
        case "timeout": return copy.mapLocationTimeout;
        case "unsupported": return copy.mapLocationUnsupported;
        case "insecure": return copy.mapLocationInsecure;
        default: return "";
    }
}

function distanceMetersBetween(left: Position, right: Position): number {
    const toRadians = (degrees: number) => degrees * Math.PI / 180;
    const latitudeDelta = toRadians(right.latitude - left.latitude);
    const longitudeDelta = toRadians(right.longitude - left.longitude);
    const latitude1 = toRadians(left.latitude);
    const latitude2 = toRadians(right.latitude);
    const haversine = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
    return 6_371_000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function distanceLabel(offer: PublicOffer, position: Position | null, locale: SiteLocale): string | null {
    const kilometers = position && hasMapCoordinates(offer)
        ? distanceMetersBetween(position, {
        latitude: offer.merchant.latitude as number,
        longitude: offer.merchant.longitude as number,
    }) / 1000
        : offer.distanceKm ?? null;
    if (kilometers === null || !Number.isFinite(kilometers)) return null;
    if (kilometers < 1) return `${Math.max(10, Math.round(kilometers * 1000 / 10) * 10)} m`;
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(kilometers)} km`;
}

function repairMojibake(value: string): string {
    let repaired = value;
    for (let pass = 0; pass < 2; pass += 1) {
        const next = repaired.replace(/[ÃÂ][\u0080-\u00bf]|â[\u0080-\u00bf]{2}/g, (fragment) => {
            try {
                const bytes = Uint8Array.from(Array.from(fragment, (character) => character.charCodeAt(0)));
                return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
            } catch {
                return fragment;
            }
        });
        if (next === repaired) break;
        repaired = next;
    }
    return repaired;
}

function normalizeMapOffer(offer: PublicOffer): PublicOffer {
    return {
        ...offer,
        title: repairMojibake(offer.title),
        merchant: {
            ...offer.merchant,
            name: repairMojibake(offer.merchant.name),
            address: repairMojibake(offer.merchant.address),
            city: repairMojibake(offer.merchant.city),
            district: offer.merchant.district ? repairMojibake(offer.merchant.district) : null,
            pickupInstructions: offer.merchant.pickupInstructions ? repairMojibake(offer.merchant.pickupInstructions) : null,
        },
    };
}

function mergeOffers(...collections: PublicOffer[][]): PublicOffer[] {
    const merged = new Map<string, PublicOffer>();
    for (const collection of collections) {
        for (const sourceOffer of collection) {
            const offer = normalizeMapOffer(sourceOffer);
            const previous = merged.get(offer.id);
            if (!previous || (!hasMapCoordinates(previous) && hasMapCoordinates(offer))) merged.set(offer.id, offer);
        }
    }
    return [...merged.values()];
}

function storesSignature(items: OfferMapStore[]): string {
    return items
        .map((store) => [
            store.key,
            store.latitude,
            store.longitude,
            store.positionAccuracy ?? "",
            store.merchant.name,
            store.offersCount,
            store.bestOffer.id,
            store.bestOffer.priceMinor,
        ].join("|"))
        .sort()
        .join(";");
}

function withPosition(offers: PublicOffer[], position: Position): PublicOffer[] {
    return offers.map((offer) => ({
        ...offer,
        merchant: {
            ...offer.merchant,
            latitude: hasMapCoordinates(offer) ? offer.merchant.latitude : position.latitude,
            longitude: hasMapCoordinates(offer) ? offer.merchant.longitude : position.longitude,
        },
    }));
}

function cityCenter(city?: string): Position {
    const normalized = city?.trim().toLocaleLowerCase();
    if (!normalized) return MOROCCO_CENTER;
    if (normalized === "casablanca") return CASABLANCA_CENTER;
    if (normalized === "rabat") return { latitude: 34.0209, longitude: -6.8416 };
    if (normalized === "marrakech") return { latitude: 31.6295, longitude: -7.9811 };
    if (normalized === "tanger" || normalized === "tangier") return { latitude: 35.7595, longitude: -5.8340 };
    if (normalized === "fes" || normalized === "fès") return { latitude: 34.0331, longitude: -5.0003 };
    if (normalized === "agadir") return { latitude: 30.4278, longitude: -9.5981 };
    return MOROCCO_CENTER;
}


const CATEGORY_TONE: Record<string, string> = { BREAD_PASTRY: "bakery", PREPARED_MEALS: "meals", GROCERIES: "grocery", FRUIT_VEG: "produce", DRINKS: "drinks", SURPRISE_BASKET: "surprise", OTHER: "other" };
const CATEGORY_GLYPH: Record<string, string> = { BREAD_PASTRY: "🥐", PREPARED_MEALS: "🍲", GROCERIES: "🛍️", FRUIT_VEG: "🥬", DRINKS: "🧃", SURPRISE_BASKET: "🧺", OTHER: "✳" };
const mapCopy = {
    fr: { search: "Rechercher paniers ou ingrédients…", filters: "Filtres", nearby: "Paniers à proximité", found: "{count} trouvés", left: "{count} restants", reserve: "Réserver", directions: "Itinéraire", locate: "Me localiser", none: "Aucun panier ne correspond.", list: "Paniers", map: "Carte" },
    en: { search: "Search baskets or ingredients…", filters: "Filters", nearby: "Nearby baskets", found: "{count} found", left: "{count} left", reserve: "Reserve", directions: "Directions", locate: "Locate me", none: "No baskets match.", list: "Baskets", map: "Map" },
    ar: { search: "ابحث عن سلال أو مكونات…", filters: "تصفية السلال", nearby: "سلال قريبة", found: "{count} نتيجة", left: "متبقي {count}", reserve: "احجز", directions: "الاتجاهات", locate: "حدد موقعي", none: "لا توجد سلال مطابقة.", list: "السلال", map: "الخريطة" },
} as const;


function MapIcon({ name }: { name: "back" | "search" | "bag" | "locate" | "nav" | "sliders" }) {
    const paths = {
        back: <path d="m15 18-6-6 6-6" />,
        search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></>,
        bag: <><path d="M6 8h12l1 12H5L6 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
        locate: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
        nav: <path d="M3.5 11 20 4l-7 16.5-2.2-7.3z" />,
        sliders: <><path d="M4 7h6M14 7h6M4 17h2M10 17h10" /><circle cx="12" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
    } as const;
    return <svg className="km-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export function OfferMapExplorer({ locale, values, initialOffers, focusOffer = null, backHref, initialLoadFailed = false, initialTotal = initialOffers.length, initialFiltersOpen = false }: Props) {
    const t = publicOfferCopy(locale);
    const [offers, setOffers] = useState<PublicOffer[]>(() => mergeOffers(initialOffers, focusOffer ? [focusOffer] : []));
    const [stores, setStores] = useState<OfferMapStore[]>(() => groupOffersIntoMapStores(mergeOffers(initialOffers, focusOffer ? [focusOffer] : [])));
    const [unlocatedStores, setUnlocatedStores] = useState<OfferMapStoreCandidate[]>(() => groupOffersWithoutCoordinates(mergeOffers(initialOffers, focusOffer ? [focusOffer] : [])));
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [center, setCenter] = useState<Position>(() => cityCenter(values.city));
    const [userLocation, setUserLocation] = useState<Position | null>(null);
    const [locationState, setLocationState] = useState<GeolocationState>("idle");
    const [permissionState, setPermissionState] = useState<PermissionSnapshot>("unknown");
    const [cameraRevision, setCameraRevision] = useState(0);
    const [fallbackLoading, setFallbackLoading] = useState(initialLoadFailed);
    const [message, setMessage] = useState(initialLoadFailed ? t.mapServiceError : "");
    const [mobileView, setMobileView] = useState<MobileView>("map");
    const [query, setQuery] = useState(values.q ?? "");
    const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
    const [userZoom, setUserZoom] = useState<number | null>(null);
    const [following, setFollowing] = useState(false);
    const [route, setRoute] = useState<DrivingRoute | null>(null);
    const [routeOrigin, setRouteOrigin] = useState<Position | null>(null);
    const [routeDestination, setRouteDestination] = useState<Position | null>(null);
    const [routeStoreKey, setRouteStoreKey] = useState<string | null>(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const [routeError, setRouteError] = useState(false);
    const [routeMode, setRouteMode] = useState<RouteMode>("driving");
    const routeRequestId = useRef(0);
    const offersRef = useRef(offers);
    offersRef.current = offers;
    const userLocationRef = useRef<Position | null>(null);
    const firstGpsFixApplied = useRef(false);
    const catalogRequestId = useRef(0);
    const locationWatchId = useRef<number | null>(null);
    const locationRequestId = useRef(0);
    const locationStateRef = useRef<GeolocationState>("idle");
    const permissionStateRef = useRef<PermissionSnapshot>("unknown");
    const permissionCleanupRef = useRef<(() => void) | null>(null);
    const locateMeRef = useRef<(recenter?: boolean) => Promise<void>>(async () => {});
    const locateInFlight = useRef<Promise<void> | null>(null);

    const bootstrapRef = useRef<{
        initialLoadFailed: boolean;
        initialOffersLength: number;
        initialTotal: number;
        loadMapOffers: () => Promise<void>;
        loadAdditionalMapOffers: (total: number) => Promise<void>;
    }>({
        initialLoadFailed,
        initialOffersLength: initialOffers.length,
        initialTotal,
        loadMapOffers: async () => {},
        loadAdditionalMapOffers: async () => {},
    });

    const selectedEntry = useMemo<StoreEntry | null>(() => {
        return stores.find((store) => store.key === selectedKey)
            ?? unlocatedStores.find((store) => store.key === selectedKey)
            ?? stores[0]
            ?? unlocatedStores[0]
            ?? null;
    }, [stores, unlocatedStores, selectedKey]);
    const googleDirectionsHref = routeDestination ? buildGoogleMapsDirectionsUrl(routeOrigin, routeDestination, routeMode) : null;
    const locationNoticeState = locationState === "denied" && permissionState === "granted" ? "unavailable" : locationState;
    const locationNotice = userLocation ? "" : locationMessageForState(locationNoticeState, t);
    const routeStore = routeStoreKey ? stores.find((store) => store.key === routeStoreKey) ?? null : null;
    const routeCopy = locale === "ar" ? {
        to: "الطريق إلى", walking: "مشياً", driving: "بالسيارة", loading: "جارٍ حساب الطريق…",
        needLocation: "فعّل الموقع لرسم الطريق، أو افتحه في خرائط Google.",
        unavailable: "تعذر حساب المسار. جرّب فتحه في خرائط Google.",
        approx: "تقدير بخط مستقيم (خدمة المسارات غير متاحة)", go: "افتح في خرائط Google", close: "إغلاق المسار", routeBtn: "الطريق",
    } : locale === "fr" ? {
        to: "Itinéraire vers", walking: "À pied", driving: "Voiture", loading: "Calcul de l’itinéraire…",
        needLocation: "Activez la localisation pour tracer l’itinéraire, ou ouvrez-le dans Google Maps.",
        unavailable: "Impossible de calculer l’itinéraire. Ouvrez-le dans Google Maps.",
        approx: "Tracé à vol d’oiseau (service d’itinéraire indisponible)", go: "Ouvrir dans Google Maps", close: "Fermer l’itinéraire", routeBtn: "Itinéraire",
    } : {
        to: "Directions to", walking: "Walk", driving: "Drive", loading: "Finding the best route…",
        needLocation: "Turn on location to draw the route, or open it in Google Maps.",
        unavailable: "Could not calculate this route. Open it in Google Maps.",
        approx: "Straight-line estimate (routing service unavailable)", go: "Open in Google Maps", close: "Close route", routeBtn: "Route",
    };
    const mc = mapCopy[locale] ?? mapCopy.en;
    const visibleOffers = useMemo(() => {
        const needle = query.trim().toLocaleLowerCase();
        return offers.filter((offer) => !needle || [offer.title, offer.merchant.name, offer.merchant.district ?? "", offer.category].some((value) => value.toLocaleLowerCase().includes(needle)));
    }, [offers, query]);
    const visibleIds = useMemo(() => new Set(visibleOffers.map((offer) => offer.id)), [visibleOffers]);
    const visibleStores = useMemo(() => stores.filter((store) => store.offers.some((offer) => visibleIds.has(offer.id))), [stores, visibleIds]);
    const activeStore = stores.find((store) => store.key === selectedKey) ?? null;
    const cardOffer = activeStore
        ? (activeStore.offers.find((offer) => offer.id === selectedOfferId && visibleIds.has(offer.id))
            ?? (visibleIds.has(activeStore.bestOffer.id) ? activeStore.bestOffer : activeStore.offers.find((offer) => visibleIds.has(offer.id))))
        ?? null
        : null;
    const mapZoom = useMemo(() => {
        if (focusOffer) return 15;
        if (stores.length < 2) return 14;
        const latitudes = stores.map((store) => store.latitude);
        const longitudes = stores.map((store) => store.longitude);
        const spread = Math.max(Math.max(...latitudes) - Math.min(...latitudes), Math.max(...longitudes) - Math.min(...longitudes));
        return spread > 0.16 ? 11 : spread > 0.09 ? 12 : spread > 0.045 ? 13 : 14;
    }, [stores, focusOffer]);

    // Re-seed the map whenever the server-provided offers, the focused offer or the city change.
    // This is derived-state syncing, so it runs during render (React re-renders straight away) instead of
    // in an effect that would paint the stale map first and then cascade another render.
    const [syncedInputs, setSyncedInputs] = useState<{ initialOffers: PublicOffer[]; focusOffer: PublicOfferDetail | null; city: string | undefined } | null>(null);
    const inputFocus = focusOffer ?? null;
    if (!syncedInputs || syncedInputs.initialOffers !== initialOffers || syncedInputs.focusOffer !== inputFocus || syncedInputs.city !== values.city) {
        setSyncedInputs({ initialOffers, focusOffer: inputFocus, city: values.city });
        const combined = mergeOffers(initialOffers, focusOffer ? [focusOffer] : []);
        const nextStores = groupOffersIntoMapStores(combined);
        const nextUnlocated = groupOffersWithoutCoordinates(combined);
        setOffers(combined);
        commitStores(nextStores);
        setUnlocatedStores(nextUnlocated);
        const focusedStore = focusOffer ? nextStores.find((store) => store.offers.some((offer) => offer.id === focusOffer.id)) : null;
        const firstStore = focusedStore ?? nextStores[0] ?? null;
        setSelectedKey(firstStore?.key ?? nextUnlocated[0]?.key ?? null);
        const initialPosition = focusedStore
            ? { latitude: focusedStore.latitude, longitude: focusedStore.longitude }
            : averageMapCoordinate(nextStores);
        setCenter(initialPosition ?? cityCenter(focusOffer?.merchant.city ?? values.city));
    }

    function setGeolocationState(next: GeolocationState) {
        locationStateRef.current = next;
        setLocationState(next);
    }

    function commitStores(next: OfferMapStore[]) {
        setStores((previous) => (storesSignature(previous) === storesSignature(next) ? previous : next));
    }

    function stopLocationWatch() {
        if (locationWatchId.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
            navigator.geolocation.clearWatch(locationWatchId.current);
            locationWatchId.current = null;
        }
    }

    function removePermissionListener() {
        permissionCleanupRef.current?.();
        permissionCleanupRef.current = null;
    }

    useEffect(() => {
        const bootstrapTimer = window.setTimeout(() => {
            const bootstrap = bootstrapRef.current;

            if (bootstrap.initialLoadFailed) {
                void bootstrap.loadMapOffers();
            } else if (bootstrap.initialTotal > bootstrap.initialOffersLength) {
                void bootstrap.loadAdditionalMapOffers(bootstrap.initialTotal);
            }

        }, 0);

        return () => {
            window.clearTimeout(bootstrapTimer);

            locationRequestId.current += 1;

            const watchId = locationWatchId.current;

            if (watchId !== null && typeof navigator !== "undefined" && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchId);
                locationWatchId.current = null;
            }

            permissionCleanupRef.current?.();
            permissionCleanupRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!focusOffer || hasMapCoordinates(focusOffer)) return;
        let cancelled = false;
        void geocodePublicShop({ address: focusOffer.merchant.address, district: focusOffer.merchant.district, city: focusOffer.merchant.city, locale })
            .then((location) => {
                if (cancelled || !location) return;
                setCenter({ latitude: location.latitude, longitude: location.longitude });
                if (location.accuracy === "area") {
                    setMessage(t.mapApproximateAreaOnly);
                    return;
                }
                const located = withPosition([focusOffer], location)[0];
                const merged = mergeOffers(offersRef.current, initialOffers, [focusOffer, located]);
                const nextStores = groupOffersIntoMapStores(merged).map((store) => store.offers.some((item) => item.id === focusOffer.id)
                    ? { ...store, positionAccuracy: "approximate" as const }
                    : store);
                const selected = nextStores.find((store) => store.offers.some((item) => item.id === focusOffer.id));
                offersRef.current = merged;
                setOffers(merged);
                commitStores(nextStores);
                setUnlocatedStores(groupOffersWithoutCoordinates(merged));
                setSelectedKey(selected?.key ?? null);
                setMessage(t.mapApproximatePin);
            })
            .catch(() => {
                if (!cancelled) setMessage(t.mapGeocodeUnavailable);
            });
        return () => { cancelled = true; };
    }, [
        focusOffer,
        initialOffers,
        locale,
        t.mapApproximateAreaOnly,
        t.mapApproximatePin,
        t.mapGeocodeUnavailable,
    ]);

    function applyDevicePosition(position: Position, recenter = false) {
        const isFirstFix = !firstGpsFixApplied.current;
        setGeolocationState("granted");
        setMessage("");
        firstGpsFixApplied.current = true;
        userLocationRef.current = position;
        setUserLocation(position);

        // Sit the camera on the person: first GPS fix (unless a specific offer is focused) and every "locate me" tap.
        const centreOnMe = recenter || (isFirstFix && !focusOffer);
        if (centreOnMe) {
            setCenter(position);
            setUserZoom(15);
            setCameraRevision((current) => current + 1);
        }
        const currentOffers = offersRef.current;
        const nextStores = groupOffersIntoMapStores(currentOffers, Date.now(), position);
        const nextUnlocated = groupOffersWithoutCoordinates(currentOffers);
        commitStores(nextStores);
        setUnlocatedStores(nextUnlocated);
        setSelectedKey((current) =>
            nextStores.some((store) => store.key === current) || nextUnlocated.some((store) => store.key === current)
                ? current
                : nextStores[0]?.key ?? nextUnlocated[0]?.key ?? null,
        );
    }

    async function loadAdditionalMapOffers(total: number) {
        const requestId = ++catalogRequestId.current;
        const pageSize = 50;
        const pageCount = Math.max(1, Math.ceil(total / pageSize));
        for (let pageIndex = 1; pageIndex < pageCount; pageIndex += 1) {
            try {
                const page = await searchOffersForMap({
                    ...values,
                    city: values.city,
                    page: String(pageIndex),
                    size: "50",
                    availableOnly: "true",
                });
                if (requestId !== catalogRequestId.current) return;
                const combined = mergeOffers(offersRef.current, page.items);
                offersRef.current = combined;
                const origin = userLocationRef.current ?? undefined;
                const nextStores = groupOffersIntoMapStores(combined, Date.now(), origin);
                const nextUnlocated = groupOffersWithoutCoordinates(combined);
                setOffers(combined);
                commitStores(nextStores);
                setUnlocatedStores(nextUnlocated);
                setSelectedKey((current) =>
                    nextStores.some((store) => store.key === current) || nextUnlocated.some((store) => store.key === current)
                        ? current
                        : nextStores[0]?.key ?? nextUnlocated[0]?.key ?? null,
                );
            } catch {
                return;
            }
        }
    }

    async function loadMapOffers() {
        const requestId = ++catalogRequestId.current;
        setFallbackLoading(true);
        const city = values.city;
        try {
            const page = await searchOffersForMap({
                ...values,
                city,
                page: "0",
                size: "50",
                availableOnly: "true",
            });
            if (requestId !== catalogRequestId.current) return;
            const combined = mergeOffers(initialOffers, focusOffer ? [focusOffer] : [], page.items);
            const nextStores = groupOffersIntoMapStores(combined, Date.now(), userLocationRef.current ?? undefined);
            const nextUnlocated = groupOffersWithoutCoordinates(combined);
            offersRef.current = combined;
            setOffers(combined);
            commitStores(nextStores);
            setUnlocatedStores(nextUnlocated);
            setSelectedKey((current) =>
                focusOffer
                    ? nextStores.find((store) => store.offers.some((offer) => offer.id === focusOffer.id))?.key ?? current
                    : nextStores.some((store) => store.key === current) || nextUnlocated.some((store) => store.key === current)
                        ? current
                        : nextStores[0]?.key ?? nextUnlocated[0]?.key ?? null,
            );
            setMessage(nextStores.length || nextUnlocated.length ? "" : t.mapNoStores);
        } catch {
            if (requestId === catalogRequestId.current) {
                setMessage(offersRef.current.length ? "" : t.mapServiceError);
            }
        } finally {
            if (requestId === catalogRequestId.current) setFallbackLoading(false);
        }
    }

    bootstrapRef.current = {
        initialLoadFailed,
        initialOffersLength: initialOffers.length,
        initialTotal,
        loadMapOffers,
        loadAdditionalMapOffers,
    };

    async function runLocate(recenter = false): Promise<void> {
        const requestId = ++locationRequestId.current;
        setMessage("");
        stopLocationWatch();
        removePermissionListener();
        if (typeof window === "undefined" || !window.isSecureContext) {
            setGeolocationState("insecure");
            return;
        }
        if (!navigator.geolocation) {
            setGeolocationState("unsupported");
            return;
        }

        let permission: PermissionStatus | null = null;
        try {
            if (navigator.permissions?.query) {
                permission = await navigator.permissions.query({ name: "geolocation" as PermissionName });
            }
        } catch {
            permission = null;
        }
        if (requestId !== locationRequestId.current) return;

        permissionStateRef.current = permission?.state ?? "unknown";
        setPermissionState(permission?.state ?? "unknown");

        if (permission) {
            const handlePermissionChange = () => {
                if (requestId !== locationRequestId.current) return;
                const nextPermissionState = permission!.state;
                permissionStateRef.current = nextPermissionState;
                setPermissionState(nextPermissionState);
                if (nextPermissionState === "denied") {
                    stopLocationWatch();
                    setGeolocationState(userLocationRef.current ? "granted" : "denied");
                    return;
                }
                if (nextPermissionState === "granted" && locationStateRef.current === "denied" && !userLocationRef.current) {
                    void locateMeRef.current(false);
                }
            };
            permission.addEventListener("change", handlePermissionChange);
            permissionCleanupRef.current = () => permission?.removeEventListener("change", handlePermissionChange);
        }

        if (permission?.state === "denied") {
            setGeolocationState("denied");
            return;
        }

        setGeolocationState("locating");

        const handleLocationFailure = (error: unknown) => {
            if (userLocationRef.current) {
                setGeolocationState("granted");
                return;
            }
            setGeolocationState(locationFailureState(error, permissionStateRef.current));
        };

        let position: Position;
        try {
            position = await requestCurrentPosition({
                enableHighAccuracy: true,
                timeout: 12_000,
                maximumAge: 30_000,
            });
        } catch (firstError) {
            if (requestId !== locationRequestId.current) return;
            const firstCode = geolocationErrorCode(firstError);
            const blockedByUser = firstCode === 1 && permissionStateRef.current !== "granted";
            if (blockedByUser) {
                handleLocationFailure(firstError);
                return;
            }
            try {
                position = await requestCurrentPosition({
                    enableHighAccuracy: false,
                    timeout: 15_000,
                    maximumAge: 60_000,
                });
            } catch (retryError) {
                if (requestId === locationRequestId.current) handleLocationFailure(retryError);
                return;
            }
        }

        if (requestId !== locationRequestId.current) return;
        if (!Number.isFinite(position.latitude) || !Number.isFinite(position.longitude)
            || position.latitude < -90 || position.latitude > 90
            || position.longitude < -180 || position.longitude > 180) {
            handleLocationFailure({ code: 2 });
            return;
        }
        applyDevicePosition(position, recenter);

        try {
            const watchId = navigator.geolocation.watchPosition(
                (nextPosition) => {
                    if (requestId !== locationRequestId.current) return;
                    const nextLocation = {
                        latitude: nextPosition.coords.latitude,
                        longitude: nextPosition.coords.longitude,
                    };
                    if (Number.isFinite(nextLocation.latitude) && Number.isFinite(nextLocation.longitude)
                        && nextLocation.latitude >= -90 && nextLocation.latitude <= 90
                        && nextLocation.longitude >= -180 && nextLocation.longitude <= 180) {
                        applyDevicePosition(nextLocation);
                    }
                },
                () => {},
                { enableHighAccuracy: true, maximumAge: 2_000, timeout: 20_000 },
            );
            if (requestId === locationRequestId.current) locationWatchId.current = watchId;
            else navigator.geolocation.clearWatch(watchId);
        } catch {
            locationWatchId.current = null;
        }
    }

    function locateMe(recenter = false): Promise<void> {
        const run = runLocate(recenter);
        locateInFlight.current = run;
        const clear = () => {
            if (locateInFlight.current === run) locateInFlight.current = null;
        };
        void run.then(clear, clear);
        return run;
    }

    locateMeRef.current = locateMe;

    async function locateUnpinnedStore(candidate: OfferMapStoreCandidate): Promise<OfferMapStore | null> {
        setMessage("");
        try {
            const location = await geocodePublicShop({
                address: candidate.merchant.address,
                district: candidate.merchant.district,
                city: candidate.merchant.city,
                locale,
            });
            if (!location) {
                setMessage(t.mapGeocodeNoResult);
                return null;
            }
            setCenter({ latitude: location.latitude, longitude: location.longitude });
            if (location.accuracy === "area") {
                setMessage(t.mapApproximateAreaOnly);
                return null;
            }
            const locatedOffers = withPosition(candidate.offers, location);
            const merged = mergeOffers(offersRef.current, locatedOffers);
            const nextStores = groupOffersIntoMapStores(merged, Date.now(), userLocation ?? undefined).map((store) =>
                store.offers.some((offer) => candidate.offers.some((item) => item.id === offer.id))
                    ? { ...store, positionAccuracy: "approximate" as const }
                    : store,
            );
            const selected = nextStores.find((store) => store.offers.some((offer) => candidate.offers.some((item) => item.id === offer.id))) ?? null;
            offersRef.current = merged;
            setOffers(merged);
            commitStores(nextStores);
            setUnlocatedStores(groupOffersWithoutCoordinates(merged));
            setSelectedKey(selected?.key ?? null);
            setMobileView("map");
            setMessage(t.mapApproximatePin);
            return selected;
        } catch {
            setMessage(t.mapGeocodeUnavailable);
            return null;
        } finally {
        }
    }

    async function showRouteToStore(store: OfferMapStore, requestedMode?: RouteMode) {
        const requestId = ++routeRequestId.current;
        const destination = { latitude: store.latitude, longitude: store.longitude };
        if (requestedMode) setRouteMode(requestedMode);
        const sameTrip = routeStoreKey === store.key && routeOrigin !== null && routeDestination !== null;
        const hasPreviousRoute = sameTrip && route !== null;
        setSelectedKey(store.key);
        setCenter(destination);
        setMobileView("map");
        setRouteStoreKey(store.key);
        setRouteDestination(destination);
        setMessage("");
        setRouteLoading(true);
        setRouteError(false);

        let origin = sameTrip ? routeOrigin : userLocationRef.current ?? userLocation;
        if (!hasPreviousRoute) setRoute(null);
        if (!sameTrip) setRouteOrigin(null);

        if (!origin) {
            try {
                await (locateInFlight.current ?? locateMeRef.current(false));
                origin = userLocationRef.current;
                if (!origin) {
                    if (requestId === routeRequestId.current) {
                        setRouteLoading(false);
                        setRouteError(false);
                    }
                    return;
                }
            } catch {
                if (requestId === routeRequestId.current) {
                    setRouteLoading(false);
                    setRouteError(false);
                }
                return;
            }
        }

        if (requestId !== routeRequestId.current) return;
        setRouteOrigin(origin);
        const mode: RouteMode = requestedMode ?? "driving";
        setRouteMode(mode);
        try {
            const result = await getDrivingRoute(origin, destination, mode);
            if (requestId !== routeRequestId.current) return;
            setRoute({ ...result, endpoints: { origin: [origin.longitude, origin.latitude], destination: [destination.longitude, destination.latitude] } });
            setMessage("");
            setRouteError(false);
        } catch {
            if (requestId === routeRequestId.current) {
                setRoute(null);
                setRouteError(true);
                setMessage("");
            }
        } finally {
            if (requestId === routeRequestId.current) setRouteLoading(false);
        }
    }

    function clearRoute() {
        routeRequestId.current += 1;
        setRoute(null);
        setRouteOrigin(null);
        setRouteDestination(null);
        setRouteStoreKey(null);
        setRouteLoading(false);
        setRouteError(false);
    }

    function previewStore(store: OfferMapStore) {
        if (!routeStoreKey) setSelectedKey(store.key);
    }

    async function showOfferOnMap(offer: PublicOffer) {
        clearRoute();
        setSelectedOfferId(offer.id);
        const store = stores.find((item) => item.offers.some((candidate) => candidate.id === offer.id));
        if (store) {
            setSelectedKey(store.key);
            setCenter({ latitude: store.latitude, longitude: store.longitude });
            setMobileView("map");
            return;
        }
        const candidate = unlocatedStores.find((item) => item.offers.some((candidateOffer) => candidateOffer.id === offer.id));
        if (candidate) await locateUnpinnedStore(candidate);
    }

    const routeTo = routeStore && routeDestination && googleDirectionsHref ? (
        <section className="kulha-route-sheet km-route" aria-live="polite">
            <button type="button" className="kulha-route-sheet__close" onClick={clearRoute} aria-label={routeCopy.close} title={routeCopy.close}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
            <div className="kulha-route-sheet__head">
                <span className="kulha-route-sheet__avatar" aria-hidden="true">{merchantInitials(routeStore.merchant.name)}</span>
                <div><span>{routeCopy.to}</span><strong>{routeStore.merchant.name}</strong></div>
            </div>
            <div className="kulha-route-sheet__modes" role="tablist">
                <button type="button" role="tab" aria-selected={routeMode === "walking"} className={routeMode === "walking" ? "is-active" : ""} onClick={() => void showRouteToStore(routeStore, "walking")}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13" cy="4.5" r="1.8" /><path d="M9 21l2.2-6.5L9 12.5l1.5-4 3.5 1 2 3.5M11.2 14.5 14 17l1 4" /></svg>{routeCopy.walking}
                </button>
                <button type="button" role="tab" aria-selected={routeMode === "driving"} className={routeMode === "driving" ? "is-active" : ""} onClick={() => void showRouteToStore(routeStore, "driving")}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16v-5l1.7-4.5A2 2 0 0 1 8.6 5h6.8a2 2 0 0 1 1.9 1.5L19 11v5M3 16h18v2.5a.5.5 0 0 1-.5.5H19v-1.5H5V19H3.5a.5.5 0 0 1-.5-.5Z" /><circle cx="7.5" cy="13.5" r=".9" /><circle cx="16.5" cy="13.5" r=".9" /></svg>{routeCopy.driving}
                </button>
            </div>
            {routeLoading ? (
                <p className="kulha-route-sheet__status" role="status">{routeCopy.loading}</p>
            ) : route ? (
                <div className="kulha-route-sheet__metrics">
                    <strong>{routeDurationLabel(route.durationSeconds)}</strong>
                    <span>{routeDistanceLabel(route.distanceMeters)}</span>
                    {route.approximate && <small>{routeCopy.approx}</small>}
                </div>
            ) : (
                <p className="kulha-route-sheet__status" role="status">{routeError ? routeCopy.unavailable : routeCopy.needLocation}</p>
            )}
            <a className="kulha-route-sheet__go" href={googleDirectionsHref} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></svg>
                {routeCopy.go}
            </a>
        </section>
    ) : null;

    return (
        <main className="km" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
            <header className="km-topbar">
                <Link href={backHref} className="km-round" aria-label={t.back} title={t.back}><MapIcon name="back" /></Link>
                <label className="km-search">
                    <MapIcon name="search" />
                    <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mc.search} aria-label={mc.search} />
                </label>
                <OfferFilterBar
                    locale={locale}
                    values={{ ...values, q: query.trim() || undefined }}
                    pickupRanges={getCasablancaQuickPickupRanges()}
                    total={initialTotal}
                    initialOpen={initialFiltersOpen}
                    basePath={localizedOfferPath(locale, "/offers/map")}
                />
            </header>

            <div className="km-switch" role="group" aria-label={locale === "ar" ? "عرض الخريطة والعروض" : locale === "fr" ? "Affichage de la carte et des offres" : "Map and offers view"}>
                <button type="button" className={mobileView === "map" ? "is-active" : ""} aria-pressed={mobileView === "map"} onClick={() => setMobileView("map")}>{mc.map}</button>
                <button type="button" className={mobileView === "list" ? "is-active" : ""} aria-pressed={mobileView === "list"} onClick={() => setMobileView("list")}>{mc.list} <b>{visibleOffers.length}</b></button>
            </div>

            <div className={`km-body is-${mobileView}-view`}>
                <aside className="km-sidebar" aria-label={mc.nearby} aria-busy={fallbackLoading}>
                    <div className="km-sidebar__head">
                        <h2>{mc.nearby}</h2>
                        {fallbackLoading ? <span className="km-skel km-skel--count" aria-hidden="true" /> : <span>{mc.found.replace("{count}", String(visibleOffers.length))}</span>}
                    </div>
                    {visibleOffers.length === 0 ? (
                        fallbackLoading ? (
                            <div className="km-list" role="status" aria-label={t.mapLoading} aria-busy="true">
                                {Array.from({ length: 4 }, (_, index) => (
                                    <div key={index} className="km-row km-row--skeleton" aria-hidden="true">
                                        <span className="km-skel km-skel--tile" />
                                        <span className="km-row__body"><i className="km-skel" /><i className="km-skel km-skel--wide" /><i className="km-skel" /></span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="km-empty"><strong>{offers.length === 0 ? t.mapNoStores : mc.none}</strong><p>{initialLoadFailed ? t.mapServiceError : t.emptyHint}</p></div>
                        )
                    ) : (
                        <div className="km-list" aria-busy={fallbackLoading}>
                            {visibleOffers.map((offer) => {
                                const located = stores.some((item) => item.offers.some((candidate) => candidate.id === offer.id));
                                const candidate = unlocatedStores.some((item) => item.offers.some((candidateOffer) => candidateOffer.id === offer.id));
                                const active = cardOffer?.id === offer.id;
                                const window = offer.pickupStart && offer.pickupEnd ? formatPickupWindow(offer.pickupStart, offer.pickupEnd, locale) : t.notProvided;
                                const tone = CATEGORY_TONE[offer.category] ?? "other";
                                return (
                                    <button
                                        key={offer.id}
                                        type="button"
                                        className={`km-row${active ? " is-selected" : ""}${offer.availableUnits <= 0 ? " is-sold-out" : ""}`}
                                        aria-pressed={active}
                                        disabled={!located && !candidate}
                                        onClick={() => void showOfferOnMap(offer)}
                                    >
                                        <span className={`km-tile is-${tone}`} aria-hidden="true"><span className="km-row__glyph">{CATEGORY_GLYPH[offer.category] ?? CATEGORY_GLYPH.OTHER}</span></span>
                                        <span className="km-row__body">
                                            <span className="km-row__eyebrow">
                                                <small><bdi dir="auto">{offer.merchant.name}</bdi></small>
                                                <span className="km-row__category">{offerCategoryLabel(locale, offer.category)}</span>
                                            </span>
                                            <strong><bdi dir="auto">{offer.title}</bdi></strong>
                                            <em>
                                                <span><bdi dir="auto">{window}</bdi></span>
                                                <span className={offer.availableUnits > 0 ? "km-row__availability" : "km-row__availability is-sold-out"}>
                                                    {offer.availableUnits > 0 ? mc.left.replace("{count}", String(offer.availableUnits)) : t.soldOut}
                                                </span>
                                            </em>
                                        </span>
                                        <span className="km-row__price">
                                            <PriceSticker priceMinor={offer.priceMinor} originalPriceMinor={offer.originalPriceMinor} locale={locale} size="sm" />
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </aside>

                <section className="km-map" aria-label={t.mapZoom}>
                    <div className="km-notices">
                        {message && <p className="kulha-map-message km-notice" role="status">{message}</p>}
                        {locationNotice && (
                            <div className="kulha-map-location-message km-notice" role="status" aria-live="polite">
                                <p>{locationNotice}</p>
                                {locationNoticeState === "denied" && <small>{t.mapLocationDeniedHint}</small>}
                                {(locationNoticeState === "unavailable" || locationNoticeState === "timeout") && (
                                    <button type="button" onClick={() => void locateMe(true)}>{t.mapLocationRetry}</button>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="kulha-map-canvas-wrap km-canvas">
                        <OfferStoreMapCanvas
                            center={center}
                            cameraRevision={cameraRevision}
                            stores={visibleStores}
                            userLocation={userLocation}
                            userLocationLoading={locationState === "locating" && userLocation !== null && permissionState !== "denied"}
                            storesLoading={fallbackLoading}
                            emptyTitle={unlocatedStores.length ? t.mapUnlocatedTitle : t.mapNoStores}
                            emptyMessage={unlocatedStores.length ? t.mapUnlocatedHint : t.mapNoStores}
                            selectedStoreKey={selectedEntry && "latitude" in selectedEntry ? selectedEntry.key : null}
                            route={route}
                            onPreviewStore={previewStore}
                            onSelectStore={(store) => { clearRoute(); setSelectedOfferId(null); setSelectedKey(store.key); setMobileView("map"); }}
                            zoomLabel={t.mapZoom}
                            mapLoadingLabel={t.mapLoading}
                            zoomInLabel={t.mapZoomIn}
                            zoomOutLabel={t.mapZoomOut}
                            userLocationLabel={t.mapYourLocation}
                            initialZoom={userZoom ?? mapZoom}
                            followUser={following}
                            onUserDrag={() => setFollowing(false)}
                            locale={locale}
                        />
                        <button className={`km-locate${following ? " is-following" : ""}`} type="button" aria-pressed={following} onClick={() => { setFollowing(true); void locateMe(true); }} disabled={locationState === "locating"} aria-label={locationState === "locating" ? t.mapLoading : t.mapLocateMe} title={locationState === "locating" ? t.mapLoading : t.mapLocateMe}>
                            <MapIcon name="locate" />
                        </button>

                        {routeTo ?? (activeStore && cardOffer && (
                            <article className="km-card" aria-live="polite">
                                <span className={`km-tile km-tile--lg is-${CATEGORY_TONE[cardOffer.category] ?? "other"}`}><MapIcon name="bag" /></span>
                                <div className="km-card__body">
                                    <small><bdi dir="auto">{activeStore.merchant.name}</bdi>{distanceLabel(cardOffer, userLocation, locale) && <> · {distanceLabel(cardOffer, userLocation, locale)}</>}</small>
                                    <Link href={localizedOfferPath(locale, `/offers/${cardOffer.id}`)} className="km-card__title"><bdi dir="auto">{cardOffer.title}</bdi></Link>
                                    <div className="km-card__price">
                                        <PriceSticker priceMinor={cardOffer.priceMinor} originalPriceMinor={cardOffer.originalPriceMinor} locale={locale} size="sm" />
                                    </div>
                                    <div className="km-card__actions">
                                        <Link href={localizedOfferPath(locale, `/offers/${cardOffer.id}`)} className="km-btn km-btn--primary" aria-disabled={cardOffer.availableUnits <= 0}>{mc.reserve}</Link>
                                        <button type="button" className="km-btn km-btn--ghost" onClick={() => void showRouteToStore(activeStore)}><MapIcon name="nav" />{mc.directions}</button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
