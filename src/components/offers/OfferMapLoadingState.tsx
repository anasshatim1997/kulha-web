import type { SiteLocale } from "@/lib/i18n/site-copy";
import { publicOfferCopy } from "@/lib/offers/public-copy";

export function OfferMapLoadingState({ locale }: { locale: SiteLocale }) {
    const copy = publicOfferCopy(locale);
    const isArabic = locale === "ar";
    const mapLabel = isArabic ? "الخريطة" : locale === "fr" ? "Carte" : "Map";
    const offersLabel = isArabic ? "السلال" : locale === "fr" ? "Paniers" : "Baskets";
    const title = isArabic ? "سلال قريبة" : locale === "fr" ? "Paniers à proximité" : "Nearby baskets";

    return (
        <div className="kulha-map-page-shell" lang={locale} dir={isArabic ? "rtl" : "ltr"}>
            <main className="km" aria-busy="true" aria-label={copy.loading}>
                <header className="km-topbar">
                    <span className="km-round km-loading-round" aria-hidden="true"><i className="km-skel" /></span>
                    <div className="km-search km-loading-search" aria-hidden="true">
                        <span className="km-loading-search-icon" />
                        <span className="km-loading-search-text" />
                    </div>
                    <span className="km-filters km-loading-filters" aria-hidden="true"><i className="km-skel" /></span>
                </header>

                <div className="km-switch" role="group" aria-label={isArabic ? "عرض الخريطة والسلال" : locale === "fr" ? "Affichage de la carte et des paniers" : "Map and baskets view"}>
                    <button type="button" className="is-active" aria-pressed="true" disabled>{mapLabel}</button>
                    <button type="button" aria-pressed="false" disabled>{offersLabel}</button>
                </div>

                <div className="km-body is-map-view">
                    <aside className="km-sidebar" aria-label={title}>
                        <div className="km-sidebar__head">
                            <h2>{title}</h2>
                            <span className="km-skel km-skel--count" />
                        </div>
                        <div className="km-list" role="status" aria-label={copy.mapLoading}>
                            {Array.from({ length: 4 }, (_, index) => (
                                <div className="km-row km-row--skeleton" key={index} aria-hidden="true">
                                    <span className="km-skel km-skel--tile" />
                                    <span className="km-row__body">
                                        <i className="km-skel km-skel--merchant" />
                                        <i className="km-skel km-skel--wide" />
                                        <i className="km-skel km-skel--meta" />
                                    </span>
                                    <span className="km-row__price"><i className="km-skel km-skel--badge" /><i className="km-skel km-skel--amount" /></span>
                                </div>
                            ))}
                        </div>
                    </aside>

                    <section className="km-map" aria-label={copy.mapZoom}>
                        <div className="km-loading-map" aria-hidden="true">
                            <span className="km-loading-map-road km-loading-map-road--one" />
                            <span className="km-loading-map-road km-loading-map-road--two" />
                            <span className="km-loading-map-road km-loading-map-road--three" />
                            <i className="km-loading-map-pin is-one" />
                            <i className="km-loading-map-pin is-two" />
                            <i className="km-loading-map-pin is-three" />
                            <span className="km-loading-map-zoom"><i /><i /></span>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
