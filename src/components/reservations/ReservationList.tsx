"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { reservationCopy, reservationLocaleTag } from "@/lib/i18n/reservation-copy";
import { localePath } from "@/lib/navigation";
import { api } from "@/lib/api/client";
import { useSession } from "@/components/session/SessionProvider";
import { formatPickupWindow } from "@/lib/offers/format";
import type { Reservation, ReservationPage } from "@/lib/reservations/types";
import styles from "./ReservationScreens.module.css";
import { ReservationLoading } from "./ReservationLoading";

type Tab = "upcoming" | "past" | "cancelled";
type Collections = Record<Tab, Reservation[]>;

function money(minor: number, locale: SiteLocale): string {
  return new Intl.NumberFormat(reservationLocaleTag(locale), {
    style: "currency", currency: "MAD", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(minor / 100);
}

export function ReservationList({ locale }: { locale: SiteLocale }) {
  const t = reservationCopy(locale);
  const { state } = useSession();
  const [active, setActive] = useState<Tab>("upcoming");
  const [items, setItems] = useState<Collections>({ upcoming: [], past: [], cancelled: [] });
  const [counts, setCounts] = useState<Record<Tab, number>>({ upcoming: 0, past: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [visibleCodes, setVisibleCodes] = useState<string[]>([]);

  const load = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const [upcoming, past, cancelled] = await Promise.all([
        api.get<ReservationPage>("/reservations?status=upcoming&page=0&size=50"),
        api.get<ReservationPage>("/reservations?status=past&page=0&size=50"),
        api.get<ReservationPage>("/reservations?status=cancelled&page=0&size=50"),
      ]);
      if (isActive()) {
        setItems({ upcoming: upcoming.items, past: past.items, cancelled: cancelled.items });
        setCounts({ upcoming: upcoming.total, past: past.total, cancelled: cancelled.total });
        setError(false);
      }
    } catch {
      if (isActive()) setError(true);
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (state.status !== "authenticated" || !state.user.roles.includes("CUSTOMER")) return;
    let active = true;
    void load(() => active);
    return () => { active = false; };
  }, [state.status, state.status === "authenticated" ? state.user.id : null, state.status === "authenticated" ? state.user.roles.includes("CUSTOMER") : false, load]);

  const current = items[active];
  const label = active === "upcoming" ? t.upcoming : active === "past" ? t.past : t.cancelled;

  if (state.status === "loading") {
    return <div className={styles.page} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><ReservationLoading label={t.loadingReservation} /></div>;
  }
  if (state.status !== "authenticated" || !state.user.roles.includes("CUSTOMER")) {
    return <div className={styles.page} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><div className={styles.stateCard} role="alert">{t.forbidden}</div></div>;
  }

  return (
    <div className={styles.page} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className={styles.listHeader}>
        <h1>{t.myReservations}</h1>
        <p>{t.subtitle}</p>
      </header>

      <div className={styles.tabs} role="tablist" aria-label={t.myReservations}>
        <button type="button" role="tab" aria-selected={active === "upcoming"} className={active === "upcoming" ? styles.activeTab : ""} onClick={() => setActive("upcoming")}>{t.upcoming}<span>{counts.upcoming}</span></button>
        <button type="button" role="tab" aria-selected={active === "past"} className={active === "past" ? styles.activeTab : ""} onClick={() => setActive("past")}>{t.past}<span>{counts.past}</span></button>
        <button type="button" role="tab" aria-selected={active === "cancelled"} className={active === "cancelled" ? styles.activeTab : ""} onClick={() => setActive("cancelled")}>{t.cancelled}<span>{counts.cancelled}</span></button>
      </div>

      <section className={styles.listResults} role="tabpanel" aria-label={label} aria-live="polite">
        {loading ? <ReservationLoading label={t.loadingReservation} /> :
          error ? <div className={styles.stateCard} role="alert"><p>{t.unknownError}</p><button type="button" className={styles.secondaryButton} onClick={() => { setLoading(true); setError(false); void load(); }}>{t.retryList}</button></div> :
          current.length === 0 ? (
            <div className={styles.emptyCard}>
              <span className={styles.emptyIcon} aria-hidden="true">▱</span>
              <h2>{active === "upcoming" ? t.emptyUpcoming : active === "past" ? t.emptyPast : t.emptyCancelled}</h2>
              <p>{active === "upcoming" ? t.emptyUpcomingBody : active === "past" ? t.emptyPastBody : t.emptyCancelledBody}</p>
              {active === "upcoming" && <Link className={styles.primaryButton} href={localePath(locale, "/offers")}>{t.explore}</Link>}
            </div>
          ) : (
            <>
              {active !== "upcoming" && <h2 className={styles.earlierLabel}>{t.earlier}</h2>}
              <div className={styles.reservationCards}>
                {current.map((reservation) => {
                  const showCode = visibleCodes.includes(reservation.reference);
                  const detailHref = localePath(locale, "/reservations/" + encodeURIComponent(reservation.reference));
                  return (
                    <article className={styles.reservationCard} key={reservation.reference}>
                      <div className={styles.reservationMark} aria-hidden="true">▱</div>
                      <div className={styles.reservationDescription}>
                        <div className={styles.referenceLine}>
                          <span className={styles.statusPill}>{reservation.statusLabel}</span>
                          <span className={styles.referenceText}>{reservation.reference}</span>
                        </div>
                        <span className={styles.merchantName}>{reservation.merchantName}</span>
                        <h2>{reservation.offerTitle}</h2>
                        <p className={styles.pickupText}><span aria-hidden="true">◷</span>{formatPickupWindow(reservation.pickupStart, reservation.pickupEnd, locale)}</p>
                        {showCode && <div className={styles.inlinePickupCode}><span>{t.pickupCode}</span><strong>{reservation.pickupCode}</strong></div>}
                      </div>
                      <strong className={styles.cardPrice}>{money(reservation.totalPriceMinor, locale)}</strong>
                      <div className={styles.cardActions}>
                        {active === "upcoming" && <button className={styles.primarySmallButton} type="button" aria-expanded={showCode} onClick={() => setVisibleCodes((codes) => showCode ? codes.filter((code) => code !== reservation.reference) : [...codes, reservation.reference])}>{showCode ? t.hide : t.show}</button>}
                        <Link className={styles.secondarySmallButton} href={detailHref}>{t.details}</Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
      </section>
    </div>
  );
}
