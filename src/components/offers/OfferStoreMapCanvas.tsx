
"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap, Marker as MapLibreMarker, Popup as MapLibrePopup } from "maplibre-gl";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { getMadDiscountPercent, getMadPriceDisplayParts } from "@/lib/offers/price-display";
import { offerCategoryLabel } from "@/lib/offers/public-copy";
import type { MapCoordinate, OfferMapStore } from "@/lib/offers/map-ranking";
import type { DrivingRoute } from "@/lib/offers/nearby-client";
import { buildGoogleMapsDirectionsUrl } from "@/lib/maps/google-directions";
import { merchantInitials } from "@/lib/offers/merchant-initials";

type MapStatus = "loading" | "ready" | "error";
type MarkerRecord = {
    marker: MapLibreMarker;
    element: HTMLButtonElement;
    store: OfferMapStore;
};
type MapLibreModule = typeof import("maplibre-gl");

const BASEMAP_PATH = "/api/maps/morocco";
const HOVER_POPUP_ENABLED = false as boolean;

let pmtilesProtocolRegistered = false;
let maplibreWorkerConfigured = false;

function offerArtwork(category: string): { image?: string; glyph: string; tone: string } {
    const artwork: Record<string, { image?: string; glyph: string; tone: string }> = {
        BREAD_PASTRY: { image: "/offer-art/baguette.webp", glyph: "🥐", tone: "bakery" },
        PREPARED_MEALS: { glyph: "🍲", tone: "meals" },
        GROCERIES: { image: "/offer-art/greens.webp", glyph: "🛍️", tone: "grocery" },
        FRUIT_VEG: { image: "/offer-art/produce.webp", glyph: "🥬", tone: "produce" },
        DRINKS: { glyph: "🧃", tone: "drinks" },
        SURPRISE_BASKET: { glyph: "🧺", tone: "surprise" },
        OTHER: { image: "/offer-art/leaf.webp", glyph: "✳", tone: "other" },
    };

    return artwork[category] ?? artwork.OTHER;
}

function popupContent(
    store: OfferMapStore,
    locale: SiteLocale,
    userLocation: MapCoordinate | null,
): HTMLElement {
    const root = document.createElement("div");
    root.className = "kulha-maplibre-popup-card";

    const visual = document.createElement("div");
    const art = offerArtwork(store.bestOffer.category);

    visual.className = `kulha-maplibre-popup-card__visual is-${art.tone}`;

    if (art.image) {
        const image = document.createElement("img");
        image.src = art.image;
        image.alt = "";
        image.loading = "lazy";
        image.decoding = "async";

        image.onerror = () => {
            image.remove();

            const fallback = document.createElement("span");
            fallback.className = "kulha-maplibre-popup-card__glyph";
            fallback.textContent = art.glyph;

            visual.prepend(fallback);
        };

        visual.append(image);
    } else {
        const glyph = document.createElement("span");
        glyph.className = "kulha-maplibre-popup-card__glyph";
        glyph.textContent = art.glyph;

        visual.append(glyph);
    }

    const offer = store.bestOffer;

    const details = document.createElement("div");
    details.className = "kulha-maplibre-popup-card__details";

    const shopHeader = document.createElement("div");
    shopHeader.className = "kulha-maplibre-popup-card__shop";

    const avatar = document.createElement("span");
    avatar.className = "kulha-maplibre-popup-card__avatar";
    avatar.textContent = merchantInitials(store.merchant.name);

    const shopText = document.createElement("span");
    shopText.className = "kulha-maplibre-popup-card__shop-text";

    const eyebrow = document.createElement("small");
    eyebrow.textContent = locale === "ar"
        ? "أفضل عرض في هذا المتجر"
        : locale === "fr"
            ? "LE MEILLEUR DE CETTE BOUTIQUE"
            : "BEST OFFER AT THIS SHOP";

    const name = document.createElement("strong");
    name.className = "kulha-maplibre-popup-card__store";
    name.textContent = store.merchant.name;

    shopText.append(eyebrow, name);
    shopHeader.append(avatar, shopText);

    const category = document.createElement("span");
    category.className = "kulha-maplibre-popup-card__category";
    category.textContent = offerCategoryLabel(locale, offer.category);

    const title = document.createElement("strong");
    title.className = "kulha-maplibre-popup-card__offer";
    title.textContent = offer.title;

    const footer = document.createElement("div");
    footer.className = "kulha-maplibre-popup-card__footer";

    const priceGroup = document.createElement("div");
    priceGroup.className = "kulha-maplibre-popup-card__price-group";
    priceGroup.append(
        createPriceSticker(
            offer.priceMinor,
            offer.originalPriceMinor,
            locale,
        ),
    );

    const count = document.createElement("span");
    count.className = "kulha-maplibre-popup-card__count";
    count.textContent = `${store.offersCount} ${
        locale === "ar"
            ? "عروض"
            : locale === "fr"
                ? "offres"
                : "offers"
    }`;

    footer.append(priceGroup, count);

    const directions = document.createElement("a");
    directions.className = "kulha-maplibre-popup-card__directions";
    directions.href = buildGoogleMapsDirectionsUrl(userLocation, {
        latitude: store.latitude,
        longitude: store.longitude,
    });
    directions.target = "_blank";
    directions.rel = "noopener noreferrer";

    directions.setAttribute(
        "aria-label",
        locale === "ar"
            ? "افتح الطريق في خرائط Google"
            : locale === "fr"
                ? "Ouvrir l’itinéraire dans Google Maps"
                : "Open route in Google Maps",
    );

    const directionsText = document.createElement("span");
    directionsText.textContent = locale === "ar"
        ? "افتح الطريق في خرائط Google"
        : locale === "fr"
            ? "Ouvrir l’itinéraire dans Google Maps"
            : "Open route in Google Maps";

    const directionsIcon = document.createElement("span");
    directionsIcon.className = "kulha-maplibre-popup-card__directions-icon";
    directionsIcon.setAttribute("aria-hidden", "true");
    directionsIcon.textContent = "↗";

    directions.append(directionsText, directionsIcon);
    directions.addEventListener("click", (event) => event.stopPropagation());

    details.append(shopHeader, category, title, footer);
    root.append(visual, details, directions);

    return root;
}

function storeFeatureCollection(stores: OfferMapStore[]) {
    return {
        type: "FeatureCollection" as const,
        features: stores.map((store) => ({
            type: "Feature" as const,
            id: store.key,
            geometry: {
                type: "Point" as const,
                coordinates: [store.longitude, store.latitude] as [number, number],
            },
            properties: {
                storeKey: store.key,
                initials: merchantInitials(store.merchant.name),
            },
        })),
    };
}

function markerElement(
    store: OfferMapStore,
    selected: boolean,
): HTMLButtonElement {
    const button = document.createElement("button");

    button.type = "button";
    button.className = `km-pin${selected ? " is-selected" : ""}${
        store.positionAccuracy === "approximate" ? " is-approximate" : ""
    }`;

    button.setAttribute(
        "aria-label",
        `${store.merchant.name}: ${store.bestOffer.title}`,
    );

    button.setAttribute("aria-pressed", String(selected));

    button.title = `${store.merchant.name} · ${store.bestOffer.title} · ${
        getMadPriceDisplayParts(store.bestOffer.priceMinor, "fr").full
    }`;

    const body = document.createElement("span");
    body.className = "km-pin__body";

    const avatar = document.createElement("span");
    avatar.className = "km-pin__avatar";
    avatar.textContent = merchantInitials(store.merchant.name);

    const name = document.createElement("span");
    name.className = "km-pin__name";
    name.textContent = store.merchant.name.replace(/\s*\[[^\]]*]\s*$/, "");

    body.append(avatar, name);

    if (store.offersCount > 1) {
        const count = document.createElement("span");
        count.className = "km-pin__count";
        count.textContent = String(store.offersCount);

        body.append(count);
    }

    button.append(body);

    return button;
}

function userLocationElement(
    label: string,
    loading: boolean,
): HTMLDivElement {
    const element = document.createElement("div");

    element.className = `kulha-youdot${loading ? " is-ghost" : ""}`;
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", label);
    element.title = label;
    element.style.pointerEvents = "none";
    element.dataset.locationLoading = String(loading);

    if (!loading) {
        const halo = document.createElement("span");
        halo.className = "kulha-youdot__halo";
        halo.setAttribute("aria-hidden", "true");

        element.append(halo);
    }

    const dot = document.createElement("span");
    dot.className = "kulha-youdot__dot";

    const ns = "http://www.w3.org/2000/svg";
    const glyph = document.createElementNS(ns, "svg");

    glyph.setAttribute("viewBox", "0 0 24 24");
    glyph.setAttribute("aria-hidden", "true");

    const head = document.createElementNS(ns, "circle");
    head.setAttribute("cx", "12");
    head.setAttribute("cy", "8.2");
    head.setAttribute("r", "3.6");

    const shoulders = document.createElementNS(ns, "path");
    shoulders.setAttribute("d", "M4.8 20c.5-3.9 3.3-6 7.2-6s6.7 2.1 7.2 6z");

    glyph.append(head, shoulders);
    dot.append(glyph);
    element.append(dot);

    return element;
}

function createPriceSticker(
    priceMinor: number,
    originalPriceMinor: number | null,
    locale: SiteLocale,
): HTMLElement {
    const current = getMadPriceDisplayParts(priceMinor, locale);
    const discount = getMadDiscountPercent(priceMinor, originalPriceMinor);

    const original = discount !== null && originalPriceMinor !== null
        ? getMadPriceDisplayParts(originalPriceMinor, locale)
        : null;

    const sticker = document.createElement("span");
    sticker.className = "kulha-price-sticker kulha-price-sticker--sm kulha-price-sticker--inline";
    sticker.dir = "ltr";
    sticker.setAttribute("role", "img");

    const oldPriceLabel = locale === "fr"
        ? "prix initial"
        : locale === "ar"
            ? "السعر الأصلي"
            : "original price";

    const discountLabel = locale === "fr"
        ? "de réduction"
        : locale === "ar"
            ? "خصم"
            : "discount";

    sticker.setAttribute(
        "aria-label",
        original && discount !== null
            ? `${current.full}; ${oldPriceLabel}: ${original.full}; ${discount}% ${discountLabel}`
            : current.full,
    );

    if (discount !== null) {
        const badge = document.createElement("span");
        badge.className = "kulha-price-sticker__discount";
        badge.textContent = `-${discount}%`;
        badge.setAttribute("aria-hidden", "true");

        sticker.append(badge);
    }

    const plate = document.createElement("span");
    plate.className = "kulha-price-sticker__plate";
    plate.setAttribute("aria-hidden", "true");

    if (original) {
        const old = document.createElement("del");
        old.className = "kulha-price-sticker__old";
        old.textContent = original.full;

        plate.append(old);
    }

    const amount = document.createElement("span");
    amount.className = "kulha-price-sticker__amount";

    const parts = [
        ["kulha-price-sticker__major", current.major],
        ["kulha-price-sticker__fraction", current.fraction],
        ["kulha-price-sticker__currency", current.currency],
    ] as const;

    for (const [className, text] of parts) {
        const part = document.createElement("span");
        part.className = className;
        part.textContent = text;

        amount.append(part);
    }

    plate.append(amount);
    sticker.append(plate);

    return sticker;
}

function styleSpriteUrl(version: string): string {
    return `${window.location.origin}/maps/assets/sprites/${version}/light`;
}

export function OfferStoreMapCanvas({
                                        center,
                                        cameraRevision,
                                        stores,
                                        userLocation,
                                        userLocationLoading,
                                        storesLoading,
                                        emptyTitle,
                                        emptyMessage,
                                        selectedStoreKey,
                                        onSelectStore,
                                        onPreviewStore,
                                        route,
                                        zoomLabel,
                                        mapLoadingLabel,
                                        userLocationLabel,
                                        initialZoom = 13,
                                        locale,
                                        followUser = false,
                                        onUserDrag,
                                    }: {
    center: MapCoordinate;
    cameraRevision: number;
    stores: OfferMapStore[];
    userLocation: MapCoordinate | null;
    userLocationLoading: boolean;
    storesLoading: boolean;
    emptyTitle: string;
    emptyMessage: string;
    selectedStoreKey: string | null;
    onSelectStore: (store: OfferMapStore) => void;
    onPreviewStore: (store: OfferMapStore) => void;
    route: DrivingRoute | null;
    zoomLabel: string;
    mapLoadingLabel: string;
    zoomInLabel: string;
    zoomOutLabel: string;
    userLocationLabel: string;
    initialZoom?: number;
    locale: SiteLocale;
    followUser?: boolean;
    onUserDrag?: () => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const mapModuleRef = useRef<MapLibreModule | null>(null);

    const markersRef = useRef<Map<string, MarkerRecord>>(new Map());
    const storesRef = useRef(stores);
    storesRef.current = stores;
    const popupRef = useRef<MapLibrePopup | null>(null);
    const userMarkerRef = useRef<MapLibreMarker | null>(null);

    const lastCameraTargetRef = useRef<string | null>(null);

    const onSelectStoreRef = useRef(onSelectStore);
    const onPreviewStoreRef = useRef(onPreviewStore);
    const userLocationRef = useRef(userLocation);
    const onUserDragRef = useRef(onUserDrag);

    const selectedStoreKeyRef = useRef(selectedStoreKey);

    const mapConfigRef = useRef({
        center,
        initialZoom,
        locale,
    });

    const userAnimRef = useRef<number | null>(null);

    const [status, setStatus] = useState<MapStatus>("loading");
    const [errorMessage, setErrorMessage] = useState("");

    const hasStores = stores.length > 0;

    useEffect(() => {
        onSelectStoreRef.current = onSelectStore;
        onPreviewStoreRef.current = onPreviewStore;
        userLocationRef.current = userLocation;
        onUserDragRef.current = onUserDrag;
        selectedStoreKeyRef.current = selectedStoreKey;
    }, [
        onSelectStore,
        onPreviewStore,
        userLocation,
        onUserDrag,
        selectedStoreKey,
    ]);

    useEffect(() => {
        mapConfigRef.current = {
            center,
            initialZoom,
            locale,
        };
    }, [
        center.latitude,
        center.longitude,
        initialZoom,
        locale,
    ]);

    useEffect(() => {
        return () => {
            if (userAnimRef.current !== null) {
                cancelAnimationFrame(userAnimRef.current);
                userAnimRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!hasStores) return;

        const container = containerRef.current;
        if (!container) return;

        const mapContainer: HTMLDivElement = container;
        const markers = markersRef.current;

        let disposed = false;
        let map: MapLibreMap | null = null;
        let resizeObserver: ResizeObserver | null = null;
        let tileHealthTimer: number | null = null;

        async function initialize() {
            try {
                const maplibre = await import("maplibre-gl");

                if (disposed || !containerRef.current) return;

                const [
                    archiveResponse,
                    spriteVersionResponse,
                    workerResponse,
                    sharedWorkerResponse,
                ] = await Promise.all([
                    fetch(BASEMAP_PATH, {
                        method: "HEAD",
                        cache: "no-store",
                    }).catch(() => null),

                    fetch("/maps/assets/sprite-version.txt", {
                        cache: "no-store",
                    }).catch(() => null),

                    fetch("/maplibre-gl-worker.mjs", {
                        method: "HEAD",
                        cache: "no-store",
                    }).catch(() => null),

                    fetch("/maplibre-gl-shared.mjs", {
                        method: "HEAD",
                        cache: "no-store",
                    }).catch(() => null),
                ]);

                if (!workerResponse?.ok || !sharedWorkerResponse?.ok) {
                    throw new Error(
                        "Map assets are missing. Run scripts/maps/prepare-map-assets.ps1 from the frontend project, then refresh this page.",
                    );
                }

                if (!maplibreWorkerConfigured) {
                    maplibre.setWorkerUrl("/maplibre-gl-worker.mjs");
                    maplibreWorkerConfigured = true;
                }

                const hasArchive = Boolean(archiveResponse?.ok);

                const rasterFallbackStyle: import("maplibre-gl").StyleSpecification = {
                    version: 8,
                    glyphs: `${window.location.origin}/maps/assets/fonts/{fontstack}/{range}.pbf`,
                    sources: {
                        "kulha-streets": {
                            type: "raster",
                            tiles: [
                                "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
                            ],
                            tileSize: 256,
                            attribution:
                                '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
                        },
                    },
                    layers: [
                        {
                            id: "kulha-streets",
                            type: "raster",
                            source: "kulha-streets",
                        },
                    ],
                };

                let mapStyle: import("maplibre-gl").StyleSpecification =
                    rasterFallbackStyle;

                if (hasArchive) {
                    const [pmtiles, basemaps] = await Promise.all([
                        import("pmtiles"),
                        import("@protomaps/basemaps"),
                    ]);

                    if (!pmtilesProtocolRegistered) {
                        const protocol = new pmtiles.Protocol();

                        maplibre.addProtocol("pmtiles", protocol.tile);
                        pmtilesProtocolRegistered = true;
                    }

                    const spriteVersionText = spriteVersionResponse?.ok
                        ? (await spriteVersionResponse.text()).trim()
                        : "v4";

                    const spriteVersion =
                        spriteVersionText === "v3" ? "v3" : "v4";

                    const light = basemaps.namedFlavor("light");

                    const flavor = {
                        ...light,
                        background: "#f7f1e3",
                        earth: "#f7f1e3",
                        water: "#cfe2e6",
                        buildings: "#ece3d1",
                        park_a: "#d9e7cd",
                        park_b: "#d1e2c5",
                        highway: "#fffdf8",
                        major: "#fffdf8",
                        minor_a: "#fffdf8",
                        minor_b: "#fffdf8",
                        other: "#fffdf8",
                        link: "#fffdf8",
                        landcover: light.landcover
                            ? {
                                ...light.landcover,
                                grassland: "#e8efe3",
                                forest: "#dfe9da",
                                farmland: "#f0eddf",
                                scrub: "#e9ecdf",
                            }
                            : light.landcover,
                    };

                    mapStyle = {
                        version: 8,

                        glyphs: `${window.location.origin}/maps/assets/fonts/{fontstack}/{range}.pbf`,

                        sprite: styleSpriteUrl(spriteVersion),

                        sources: {
                            protomaps: {
                                type: "vector",
                                url: `pmtiles://${window.location.origin}${BASEMAP_PATH}`,
                                attribution:
                                    '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · <a href="https://protomaps.com" target="_blank" rel="noreferrer">Protomaps</a>',
                            },
                        },

                        layers: basemaps.layers("protomaps", flavor, {
                            lang: mapConfigRef.current.locale,
                        }),
                    };
                }

                if (disposed || !containerRef.current) return;

                const initialView = mapConfigRef.current;

                map = new maplibre.Map({
                    container: mapContainer,
                    style: mapStyle,
                    center: [
                        initialView.center.longitude,
                        initialView.center.latitude,
                    ],
                    zoom: Math.max(
                        4,
                        Math.min(18, initialView.initialZoom),
                    ),
                    minZoom: 4,
                    maxZoom: 19,
                    attributionControl: false,
                    renderWorldCopies: false,
                    cooperativeGestures: true,
                    pitchWithRotate: false,
                    dragRotate: false,
                });

                mapRef.current = map;
                mapModuleRef.current = maplibre;

                map.on("dragstart", () => {
                    onUserDragRef.current?.();
                });

                popupRef.current = new maplibre.Popup({
                    closeButton: false,
                    closeOnClick: false,
                    offset: 30,
                    className: "kulha-maplibre-popup",
                });

                map.addControl(
                    new maplibre.NavigationControl({
                        showCompass: false,
                        showZoom: true,
                        visualizePitch: false,
                    }),
                    "top-right",
                );

                let fallbackApplied = !hasArchive;
                let vectorTileReceived = false;

                const switchToRasterFallback = () => {
                    if (disposed || fallbackApplied || !map) return;

                    fallbackApplied = true;

                    if (tileHealthTimer !== null) {
                        window.clearTimeout(tileHealthTimer);
                    }

                    tileHealthTimer = null;

                    setStatus("loading");
                    setErrorMessage("");

                    map.setStyle(rasterFallbackStyle);
                };

                map.on("data", (event) => {
                    const sourceId =
                        "sourceId" in event
                            ? String(event.sourceId ?? "")
                            : "";

                    const sourceDataType =
                        "sourceDataType" in event
                            ? String(event.sourceDataType ?? "")
                            : "";

                    if (
                        sourceId === "protomaps" &&
                        sourceDataType === "content"
                    ) {
                        vectorTileReceived = true;
                    }
                });

                let initialLoadEventReceived = false;

                map.once("load", () => {
                    initialLoadEventReceived = true;
                });

                const handleClusterClick = (event: import("maplibre-gl").MapLayerMouseEvent) => {
                    const feature = event.features?.[0];
                    const clusterId = Number(feature?.properties?.cluster_id);
                    if (!feature || !Number.isFinite(clusterId) || feature.geometry.type !== "Point") return;

                    const point = feature.geometry.coordinates as [number, number];
                    const clusterSource = map?.getSource("kulha-store-clusters") as GeoJSONSource | undefined;
                    if (!clusterSource || !map) return;
                    void clusterSource.getClusterExpansionZoom(clusterId).then((zoom) => {
                        if (!disposed) map?.easeTo({ center: point, zoom, duration: 450 });
                    }).catch(() => {});
                };

                const handleSingleStoreClick = (event: import("maplibre-gl").MapLayerMouseEvent) => {
                    const key = String(event.features?.[0]?.properties?.storeKey ?? "");
                    const store = storesRef.current.find((candidate) => candidate.key === key);
                    if (store) onSelectStoreRef.current(store);
                };

                const setPointerCursor = () => {
                    if (map) map.getCanvas().style.cursor = "pointer";
                };
                const resetPointerCursor = () => {
                    if (map) map.getCanvas().style.cursor = "";
                };

                const installStoreLayers = () => {
                    if (!map || disposed || !map.isStyleLoaded()) return;

                    if (!map.getSource("kulha-store-clusters")) {
                        map.addSource("kulha-store-clusters", {
                            type: "geojson",
                            data: storeFeatureCollection(storesRef.current),
                            cluster: true,
                            clusterRadius: 48,
                            clusterMaxZoom: 11,
                        });

                        map.addLayer({
                            id: "kulha-store-cluster-circles",
                            type: "circle",
                            source: "kulha-store-clusters",
                            filter: ["has", "point_count"],
                            maxzoom: 12,
                            paint: {
                                "circle-color": [
                                    "step", ["get", "point_count"],
                                    "#f2bd42", 10, "#ed9440", 40, "#d94a39",
                                ],
                                "circle-radius": [
                                    "step", ["get", "point_count"],
                                    19, 10, 23, 40, 27,
                                ],
                                "circle-stroke-color": "#fffaf1",
                                "circle-stroke-width": 3,
                            },
                        });

                        map.addLayer({
                            id: "kulha-store-cluster-count",
                            type: "symbol",
                            source: "kulha-store-clusters",
                            filter: ["has", "point_count"],
                            maxzoom: 12,
                            layout: {
                                "text-field": ["get", "point_count_abbreviated"],
                                "text-font": ["Open Sans Bold"],
                                "text-size": 13,
                                "text-allow-overlap": true,
                            },
                            paint: { "text-color": "#173d2a" },
                        });

                        map.addLayer({
                            id: "kulha-store-single-points",
                            type: "circle",
                            source: "kulha-store-clusters",
                            filter: ["!", ["has", "point_count"]],
                            maxzoom: 12,
                            paint: {
                                "circle-color": "#0c5738",
                                "circle-radius": 15,
                                "circle-stroke-color": "#fffaf1",
                                "circle-stroke-width": 3,
                            },
                        });

                        map.addLayer({
                            id: "kulha-store-single-labels",
                            type: "symbol",
                            source: "kulha-store-clusters",
                            filter: ["!", ["has", "point_count"]],
                            maxzoom: 12,
                            layout: {
                                "text-field": ["get", "initials"],
                                "text-font": ["Open Sans Bold"],
                                "text-size": 10,
                                "text-allow-overlap": true,
                            },
                            paint: { "text-color": "#fffaf1" },
                        });
                    }

                    const source = map.getSource("kulha-store-clusters") as GeoJSONSource | undefined;
                    source?.setData(storeFeatureCollection(storesRef.current));

                    map.off("click", "kulha-store-cluster-circles", handleClusterClick);
                    map.on("click", "kulha-store-cluster-circles", handleClusterClick);
                    map.off("click", "kulha-store-single-points", handleSingleStoreClick);
                    map.on("click", "kulha-store-single-points", handleSingleStoreClick);

                    map.off("mouseenter", "kulha-store-cluster-circles", setPointerCursor);
                    map.on("mouseenter", "kulha-store-cluster-circles", setPointerCursor);
                    map.off("mouseleave", "kulha-store-cluster-circles", resetPointerCursor);
                    map.on("mouseleave", "kulha-store-cluster-circles", resetPointerCursor);
                    map.off("mouseenter", "kulha-store-single-points", setPointerCursor);
                    map.on("mouseenter", "kulha-store-single-points", setPointerCursor);
                    map.off("mouseleave", "kulha-store-single-points", resetPointerCursor);
                    map.on("mouseleave", "kulha-store-single-points", resetPointerCursor);
                };

                map.on("style.load", () => {
                    if (disposed) return;
                    installStoreLayers();
                    // Store clusters are local GeoJSON; don't make their visibility
                    // wait for every basemap tile or for the map's idle event.
                    setStatus("ready");

                    if (hasArchive && !fallbackApplied) {
                        if (tileHealthTimer !== null) {
                            window.clearTimeout(tileHealthTimer);
                        }

                        tileHealthTimer = window.setTimeout(() => {
                            if (!disposed && !vectorTileReceived) {
                                switchToRasterFallback();
                            }
                        }, 9000);
                    }
                });

                map.on("idle", () => {
                    if (
                        disposed ||
                        !initialLoadEventReceived ||
                        !map?.isStyleLoaded()
                    ) {
                        return;
                    }

                    if (hasArchive && !fallbackApplied && !vectorTileReceived) {
                        switchToRasterFallback();
                        return;
                    }

                    setStatus("ready");
                });

                map.on("error", (event) => {
                    if (disposed) return;

                    const sourceId =
                        "sourceId" in event
                            ? String(event.sourceId ?? "")
                            : "";

                    const message =
                        event.error instanceof Error
                            ? event.error.message
                            : "Map data could not be loaded.";

                    const lowerMessage = message.toLowerCase();

                    const localMapFailure =
                        sourceId === "protomaps" ||
                        lowerMessage.includes("pmtiles") ||
                        lowerMessage.includes("source layer") ||
                        lowerMessage.includes("range request");

                    const fallbackMapFailure =
                        sourceId === "kulha-streets" ||
                        lowerMessage.includes("raster tile") ||
                        lowerMessage.includes("tile request");

                    if (
                        hasArchive &&
                        !fallbackApplied &&
                        (localMapFailure || !vectorTileReceived)
                    ) {
                        switchToRasterFallback();
                        return;
                    }

                    if (fallbackApplied && fallbackMapFailure) {
                        setStatus("error");
                        setErrorMessage(
                            "The street map could not be loaded. Check the internet connection and refresh the page.",
                        );
                    }
                });

                resizeObserver = new ResizeObserver(() => {
                    map?.resize();
                });

                resizeObserver.observe(mapContainer);
            } catch (error) {
                if (disposed) return;

                setStatus("error");

                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "The map could not be initialized.",
                );
            }
        }

        void initialize();

        return () => {
            disposed = true;

            setStatus("loading");
            setErrorMessage("");

            if (tileHealthTimer !== null) {
                window.clearTimeout(tileHealthTimer);
            }

            resizeObserver?.disconnect();

            for (const record of markers.values()) {
                record.marker.remove();
            }

            markers.clear();

            userMarkerRef.current?.remove();
            userMarkerRef.current = null;

            popupRef.current?.remove();

            map?.remove();

            mapRef.current = null;
            mapModuleRef.current = null;
            popupRef.current = null;
            userMarkerRef.current = null;
            lastCameraTargetRef.current = null;
        };
    }, [hasStores]);

    useEffect(() => {
        const map = mapRef.current;
        const maplibre = mapModuleRef.current;
        const container = containerRef.current;

        if (
            !map ||
            !maplibre ||
            !container ||
            status === "loading" ||
            !map.isStyleLoaded()
        ) {
            return;
        }

        const markers = markersRef.current;

        for (const record of markers.values()) {
            record.marker.remove();
        }

        markers.clear();

        let popupCloseTimer: number | null = null;
        let popupRemoveTimer: number | null = null;
        let activePopupStoreKey: string | null = null;
        let lastPointer: { x: number; y: number } | null = null;
        let popupElement: HTMLElement | null = null;

        const popup = popupRef.current;

        if (!popup) return;

        const cancelPopupClose = () => {
            if (popupCloseTimer !== null) {
                window.clearTimeout(popupCloseTimer);
            }

            popupCloseTimer = null;

            if (popupRemoveTimer !== null) {
                window.clearTimeout(popupRemoveTimer);
            }

            popupRemoveTimer = null;
            popupElement?.classList.remove("is-closing");
        };

        const findMarkerAtPoint = (
            x: number,
            y: number,
        ): MarkerRecord | null => {
            let nearest: MarkerRecord | null = null;
            let nearestDistance = Number.POSITIVE_INFINITY;

            for (const record of markers.values()) {
                const rect = record.element.getBoundingClientRect();

                if (
                    x < rect.left ||
                    x > rect.right ||
                    y < rect.top ||
                    y > rect.bottom
                ) {
                    continue;
                }

                const dx = x - (rect.left + rect.width / 2);
                const dy = y - (rect.top + rect.height / 2);
                const distance = dx * dx + dy * dy;

                if (distance < nearestDistance) {
                    nearest = record;
                    nearestDistance = distance;
                }
            }

            return nearest;
        };

        const showPopup = (
            store: OfferMapStore,
            select = false,
        ) => {
            cancelPopupClose();

            if (!HOVER_POPUP_ENABLED) {
                if (select) {
                    onSelectStoreRef.current(store);
                }

                return;
            }

            if (select) {
                onSelectStoreRef.current(store);
            } else {
                onPreviewStoreRef.current(store);
            }

            if (activePopupStoreKey === store.key && popup.isOpen()) {
                return;
            }

            activePopupStoreKey = store.key;

            popup
                .setLngLat([store.longitude, store.latitude])
                .setDOMContent(
                    popupContent(store, locale, userLocationRef.current),
                )
                .addTo(map);

            popupElement = popup.getElement();

            if (popupElement.dataset.kulhaHoverBound !== "true") {
                popupElement.addEventListener(
                    "pointerenter",
                    handlePopupEnter,
                );

                popupElement.addEventListener(
                    "pointerleave",
                    handlePopupLeave,
                );

                popupElement.addEventListener(
                    "focusin",
                    handlePopupFocus,
                );

                popupElement.addEventListener(
                    "focusout",
                    handlePopupBlur,
                );

                popupElement.dataset.kulhaHoverBound = "true";
            }

            popupElement.classList.remove("is-closing");
            popupElement.classList.remove("is-visible");

            const visiblePopupElement = popupElement;

            window.requestAnimationFrame(() => {
                visiblePopupElement.classList.add("is-visible");
            });
        };

        const closePopupAnimated = () => {
            if (!popup.isOpen()) {
                activePopupStoreKey = null;
                return;
            }

            popupElement = popup.getElement();

            popupElement.classList.remove("is-visible");
            popupElement.classList.add("is-closing");

            popupRemoveTimer = window.setTimeout(() => {
                popup.remove();
                activePopupStoreKey = null;
                popupRemoveTimer = null;
            }, 170);
        };

        const schedulePopupClose = () => {
            if (popupCloseTimer !== null) {
                window.clearTimeout(popupCloseTimer);
            }

            popupCloseTimer = window.setTimeout(() => {
                popupCloseTimer = null;

                if (lastPointer) {
                    const markerAtPointer = findMarkerAtPoint(
                        lastPointer.x,
                        lastPointer.y,
                    );

                    if (markerAtPointer) {
                        showPopup(markerAtPointer.store);
                        return;
                    }

                    const elementAtPointer = document.elementFromPoint(
                        lastPointer.x,
                        lastPointer.y,
                    );

                    if (
                        elementAtPointer &&
                        popup.isOpen() &&
                        popupElement?.contains(elementAtPointer)
                    ) {
                        return;
                    }
                }

                closePopupAnimated();
            }, 240);
        };

        function handlePopupEnter() {
            cancelPopupClose();
        }

        function handlePopupLeave() {
            schedulePopupClose();
        }

        function handlePopupFocus() {
            cancelPopupClose();
        }

        function handlePopupBlur() {
            schedulePopupClose();
        }

        const handleContainerPointerMove = (event: PointerEvent) => {
            // Hover popups are disabled; avoid a DOM geometry scan on every pointer move.
            if (!HOVER_POPUP_ENABLED) return;
            lastPointer = {
                x: event.clientX,
                y: event.clientY,
            };

            const markerAtPointer = findMarkerAtPoint(
                event.clientX,
                event.clientY,
            );

            if (markerAtPointer) {
                if (markerAtPointer.store.key !== activePopupStoreKey) {
                    showPopup(markerAtPointer.store);
                } else {
                    cancelPopupClose();
                }

                return;
            }

            const target = event.target;

            if (
                target instanceof Node &&
                popup.isOpen() &&
                popupElement?.contains(target)
            ) {
                cancelPopupClose();
                return;
            }

            if (activePopupStoreKey) {
                schedulePopupClose();
            }
        };

        const handleContainerPointerLeave = (event: PointerEvent) => {
            lastPointer = {
                x: event.clientX,
                y: event.clientY,
            };

            schedulePopupClose();
        };

        container.addEventListener(
            "pointermove",
            handleContainerPointerMove,
        );

        container.addEventListener(
            "pointerleave",
            handleContainerPointerLeave,
        );

        const updateMarkerVisibility = () => {
            const showIndividualPins = map.getZoom() > 12;
            for (const record of markers.values()) {
                record.element.style.visibility = showIndividualPins ? "visible" : "hidden";
                record.element.style.pointerEvents = showIndividualPins ? "auto" : "none";
            }
        };
        map.on("zoom", updateMarkerVisibility);

        for (const store of stores) {
            const element = markerElement(
                store,
                store.key === selectedStoreKeyRef.current,
            );

            const marker = new maplibre.Marker({
                element,
                anchor: "bottom",
            })
                .setLngLat([store.longitude, store.latitude])
                .addTo(map);

            const preview = () => showPopup(store);

            const select = (event: Event) => {
                event.stopPropagation();
                showPopup(store, true);
            };

            const dismiss = () => schedulePopupClose();

            element.addEventListener("pointerenter", preview);
            element.addEventListener("pointerleave", dismiss);
            element.addEventListener("focus", preview);
            element.addEventListener("blur", dismiss);
            element.addEventListener("click", select);

            markers.set(store.key, {
                marker,
                element,
                store,
            });
        }
        updateMarkerVisibility();

        return () => {
            map.off("zoom", updateMarkerVisibility);
            if (popupCloseTimer !== null) {
                window.clearTimeout(popupCloseTimer);
            }

            if (popupRemoveTimer !== null) {
                window.clearTimeout(popupRemoveTimer);
            }

            container.removeEventListener(
                "pointermove",
                handleContainerPointerMove,
            );

            container.removeEventListener(
                "pointerleave",
                handleContainerPointerLeave,
            );

            if (popupElement) {
                popupElement.removeEventListener(
                    "pointerenter",
                    handlePopupEnter,
                );

                popupElement.removeEventListener(
                    "pointerleave",
                    handlePopupLeave,
                );

                popupElement.removeEventListener(
                    "focusin",
                    handlePopupFocus,
                );

                popupElement.removeEventListener(
                    "focusout",
                    handlePopupBlur,
                );

                delete popupElement.dataset.kulhaHoverBound;
            }

            for (const record of markers.values()) {
                record.marker.remove();
            }

            markers.clear();
            popup.remove();
        };
    }, [stores, locale, status]);

    useEffect(() => {
        const source = mapRef.current?.getSource("kulha-store-clusters") as GeoJSONSource | undefined;
        source?.setData(storeFeatureCollection(stores));
    }, [stores, status]);

    useEffect(() => {
        for (const [key, record] of markersRef.current) {
            const active = key === selectedStoreKey;

            record.element.classList.toggle("is-selected", active);
            record.element.setAttribute("aria-pressed", String(active));
        }
    }, [selectedStoreKey, stores, status]);

    useEffect(() => {
        const map = mapRef.current;

        if (!map || status !== "ready") return;

        const targetKey = `${center.latitude.toFixed(6)}:${center.longitude.toFixed(6)}:${initialZoom}:${cameraRevision}`;

        if (lastCameraTargetRef.current === targetKey) return;

        lastCameraTargetRef.current = targetKey;

        map.flyTo({
            center: [center.longitude, center.latitude],
            zoom: Math.max(4, Math.min(19, initialZoom)),
            duration: 650,
            essential: false,
        });
    }, [
        center.latitude,
        center.longitude,
        initialZoom,
        cameraRevision,
        status,
    ]);

    useEffect(() => {
        const map = mapRef.current;
        const maplibre = mapModuleRef.current;

        if (!map || !maplibre || status !== "ready") return;

        let disposed = false;
        let applied = false;

        const applyRoute = () => {
            if (disposed || applied || !map.isStyleLoaded()) return;

            const existingSource = map.getSource(
                "kulha-driving-route",
            ) as GeoJSONSource | undefined;

            if (!route) {
                existingSource?.setData({
                    type: "FeatureCollection",
                    features: [],
                });

                applied = true;
                return;
            }

            const coordinates = route.endpoints && !route.approximate
                ? [
                    route.endpoints.origin,
                    ...route.coordinates,
                    route.endpoints.destination,
                ]
                : route.coordinates;

            const feature = {
                type: "FeatureCollection" as const,
                features: [
                    {
                        type: "Feature" as const,
                        properties: {
                            kind: route.approximate ? "estimate" : "road",
                        },
                        geometry: {
                            type: "LineString" as const,
                            coordinates,
                        },
                    },
                ],
            };

            if (existingSource) {
                existingSource.setData(feature);
            } else {
                map.addSource("kulha-driving-route", {
                    type: "geojson",
                    data: feature,
                });
            }

            const firstSymbolLayer = map
                .getStyle()
                .layers?.find((layer) => layer.type === "symbol")?.id;

            const casingWidth: import("maplibre-gl").ExpressionSpecification = [
                "interpolate",
                ["linear"],
                ["zoom"],
                10,
                6,
                16,
                14,
            ];

            const lineWidth: import("maplibre-gl").ExpressionSpecification = [
                "interpolate",
                ["linear"],
                ["zoom"],
                10,
                3.5,
                16,
                8,
            ];

            const roundLayout = {
                "line-join": "round",
                "line-cap": "round",
            } as const;

            if (!map.getLayer("kulha-driving-route-casing")) {
                map.addLayer(
                    {
                        id: "kulha-driving-route-casing",
                        type: "line",
                        source: "kulha-driving-route",
                        layout: roundLayout,
                        filter: ["==", ["get", "kind"], "road"],
                        paint: {
                            "line-color": "#ffffff",
                            "line-width": casingWidth,
                            "line-opacity": 0.95,
                        },
                    },
                    firstSymbolLayer,
                );
            }

            if (!map.getLayer("kulha-driving-route-line")) {
                map.addLayer(
                    {
                        id: "kulha-driving-route-line",
                        type: "line",
                        source: "kulha-driving-route",
                        layout: roundLayout,
                        filter: ["==", ["get", "kind"], "road"],
                        paint: {
                            "line-color": "#1f6feb",
                            "line-width": lineWidth,
                            "line-opacity": 0.98,
                        },
                    },
                    firstSymbolLayer,
                );
            }

            if (!map.getLayer("kulha-driving-route-estimate")) {
                map.addLayer(
                    {
                        id: "kulha-driving-route-estimate",
                        type: "line",
                        source: "kulha-driving-route",
                        layout: {
                            "line-join": "round",
                            "line-cap": "round",
                        },
                        filter: ["==", ["get", "kind"], "estimate"],
                        paint: {
                            "line-color": "#1f6feb",
                            "line-width": 4,
                            "line-dasharray": [1.4, 1.6],
                            "line-opacity": 0.95,
                        },
                    },
                    firstSymbolLayer,
                );
            }

            if (coordinates.length > 1) {
                const bounds = new maplibre.LngLatBounds(
                    coordinates[0],
                    coordinates[0],
                );

                for (const coordinate of coordinates.slice(1)) {
                    bounds.extend(coordinate);
                }

                const box = map.getContainer();

                const padding = {
                    top: Math.min(
                        90,
                        Math.round(box.clientHeight * 0.14),
                    ),
                    bottom: Math.min(
                        230,
                        Math.round(box.clientHeight * 0.42),
                    ),
                    left: Math.min(
                        90,
                        Math.round(box.clientWidth * 0.12),
                    ),
                    right: Math.min(
                        90,
                        Math.round(box.clientWidth * 0.12),
                    ),
                };

                map.fitBounds(bounds, {
                    padding,
                    maxZoom: 16,
                    duration: 850,
                });
            }

            applied = true;
        };

        if (map.isStyleLoaded()) {
            applyRoute();
        }

        if (!applied) {
            map.on("style.load", applyRoute);
            map.on("idle", applyRoute);
        }

        return () => {
            disposed = true;

            map.off("style.load", applyRoute);
            map.off("idle", applyRoute);
        };
    }, [route, status]);

    useEffect(() => {
        const map = mapRef.current;

        if (
            !map ||
            status !== "ready" ||
            !followUser ||
            !userLocation
        ) {
            return;
        }

        map.easeTo({
            center: [userLocation.longitude, userLocation.latitude],
            duration: 900,
            essential: true,
        });
    }, [followUser, userLocation, status]);

    useEffect(() => {
        const map = mapRef.current;
        const maplibre = mapModuleRef.current;

        if (!map || !maplibre || status !== "ready") return;

        if (!userLocation) {
            userMarkerRef.current?.remove();
            userMarkerRef.current = null;
            return;
        }

        const existingElement = userMarkerRef.current?.getElement();

        const markerModeChanged =
            existingElement?.dataset.locationLoading !==
            String(userLocationLoading);

        if (!userMarkerRef.current || markerModeChanged) {
            userMarkerRef.current?.remove();

            const element = userLocationElement(
                userLocationLabel,
                userLocationLoading,
            );

            element.style.zIndex = "10000";
            element.dataset.kulhaUserMarker = "true";

            userMarkerRef.current = new maplibre.Marker({
                element,
                anchor: "center",
            })
                .setLngLat([
                    userLocation.longitude,
                    userLocation.latitude,
                ])
                .addTo(map);
        } else {
            const marker = userMarkerRef.current;
            const from = marker.getLngLat();

            const to = {
                lng: userLocation.longitude,
                lat: userLocation.latitude,
            };

            if (userAnimRef.current !== null) {
                cancelAnimationFrame(userAnimRef.current);
            }

            const jump =
                Math.abs(to.lng - from.lng) +
                Math.abs(to.lat - from.lat);

            if (
                jump === 0 ||
                jump > 0.05 ||
                window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
            ) {
                marker.setLngLat([to.lng, to.lat]);
            } else {
                const startedAt = performance.now();
                const duration = 900;

                const step = (now: number) => {
                    const progress = Math.min(
                        1,
                        (now - startedAt) / duration,
                    );

                    const eased = 1 - Math.pow(1 - progress, 3);

                    marker.setLngLat([
                        from.lng + (to.lng - from.lng) * eased,
                        from.lat + (to.lat - from.lat) * eased,
                    ]);

                    userAnimRef.current =
                        progress < 1
                            ? requestAnimationFrame(step)
                            : null;
                };

                userAnimRef.current = requestAnimationFrame(step);
            }

            const element = marker.getElement();

            element.setAttribute("aria-label", userLocationLabel);
            element.title = userLocationLabel;
        }
    }, [
        userLocation,
        userLocationLoading,
        userLocationLabel,
        status,
    ]);

    return (
        <div className="kulha-maplibre-map">
            <div
                ref={containerRef}
                className="kulha-maplibre-map__canvas"
                role="region"
                aria-label={zoomLabel}
            />

            {status !== "error" && (hasStores || storesLoading) && (
                <div
                    className={`kulha-maplibre-map__skeleton${
                        status === "ready" ? " is-fading" : ""
                    }`}
                    role="status"
                    aria-label={mapLoadingLabel}
                    aria-hidden={status === "ready"}
                >
                    <div className="kulha-maplibre-map__skeleton-shimmer" />

                    <div className="kulha-maplibre-map__skeleton-pins">
                        <i />
                        <i />
                        <i />
                        <i />
                    </div>

                    <div className="kulha-maplibre-map__skeleton-floating">
                        <i />
                        <i />
                    </div>

                    <div className="kulha-maplibre-map__skeleton-zoom">
                        <i />
                        <i />
                    </div>
                </div>
            )}

            {!hasStores && !storesLoading && (
                <div
                    className="kulha-maplibre-map__notice"
                    role="status"
                >
                    <strong>{emptyTitle}</strong>
                    <span>{emptyMessage}</span>
                </div>
            )}

            {status === "error" && (
                <div
                    className="kulha-maplibre-map__notice"
                    role="status"
                >
                    <strong>
                        {locale === "ar"
                            ? "تعذر تحميل الخريطة"
                            : locale === "fr"
                                ? "Carte indisponible"
                                : "Map unavailable"}
                    </strong>

                    <span>{errorMessage}</span>
                </div>
            )}
        </div>
    );
}
