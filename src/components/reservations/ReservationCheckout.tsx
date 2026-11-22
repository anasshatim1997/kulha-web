"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { reservationCopy, reservationLocaleTag } from "@/lib/i18n/reservation-copy";
import { localePath } from "@/lib/navigation";
import { api } from "@/lib/api/client";
import { useSession } from "@/components/session/SessionProvider";
import { formatPickupDate, formatPickupWindow } from "@/lib/offers/format";
import type { Reservation, ReservationAvailability } from "@/lib/reservations/types";
import styles from "./ReservationScreens.module.css";
import { ReservationLoading } from "./ReservationLoading";

function money(minor: number, locale: SiteLocale): string {
  return new Intl.NumberFormat(reservationLocaleTag(locale), {
    style: "currency", currency: "MAD", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(minor / 100);
}

function ErrorState({ text, onRetry, retry }: { text: string; onRetry?: () => void; retry: string }) {
  return <section className={styles.stateCard} role="alert"><p>{text}</p>{onRetry && <button className={styles.secondaryButton} type="button" onClick={onRetry}>{retry}</button>}</section>;
}



export function ReservationCheckout({ offerId, locale }: { offerId: string; locale: SiteLocale }) {
  const t = reservationCopy(locale);
  const router = useRouter();
  const { state } = useSession();
  const [quantity, setQuantity] = useState(1);
  const [availability, setAvailability] = useState<ReservationAvailability | null>(null);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const reservationAttempt = useRef<{ fingerprint: string; key: string } | null>(null);

  async function loadAvailability() {
    setLoading(true);
    setError(null);
    try {
      const value = await api.get<ReservationAvailability>(
        "/reservations/availability?offerId=" + encodeURIComponent(offerId) + "&quantity=" + quantity,
      );
      setAvailability(value);
      setSelectedSlot(0);
    } catch {
      setError(t.unavailable);
      setAvailability(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api.get<ReservationAvailability>(
      "/reservations/availability?offerId=" + encodeURIComponent(offerId) + "&quantity=" + quantity,
    ).then((value) => {
      if (active) {
        setAvailability(value);
        setSelectedSlot(0);
      }
    }).catch(() => {
      if (active) {
        setError(t.unavailable);
        setAvailability(null);
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [offerId, quantity, t.unavailable]);

  async function confirmReservation() {
    if (submitting || !availability || availability.totalPriceMinor === null || !availability.slots[selectedSlot]) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const slot = availability.slots[selectedSlot];
      const payload = { offerId, quantity, pickupStart: slot.start, pickupEnd: slot.end };
      const fingerprint = JSON.stringify(payload);
      const storageKey = "kulha:reservation-idempotency:" + offerId;
      let attempt = reservationAttempt.current;
      if (!attempt || attempt.fingerprint !== fingerprint) {
        let saved: { fingerprint?: string; key?: string } | null = null;
        try {
          const raw = window.sessionStorage.getItem(storageKey);
          saved = raw ? JSON.parse(raw) as { fingerprint?: string; key?: string } : null;
        } catch {
          saved = null;
        }
        attempt = saved?.fingerprint === fingerprint && saved.key
          ? { fingerprint, key: saved.key }
          : { fingerprint, key: window.crypto.randomUUID() };
        reservationAttempt.current = attempt;
        window.sessionStorage.setItem(storageKey, JSON.stringify(attempt));
      }
      const created = await api.post<Reservation>("/reservations", payload, {
        headers: { "Idempotency-Key": attempt.key },
      });
      if (!created?.reference) throw new Error("Reservation response did not include a reference.");
      window.dispatchEvent(new Event("kulha:navigation-start"));
      // Client-side replace avoids a full document reload and prevents accidental resubmission via Back.
      router.replace(localePath(locale, "/reservations/confirmed/" + encodeURIComponent(created.reference)));
      window.sessionStorage.removeItem(storageKey);
      reservationAttempt.current = null;
    } catch {
      setSubmitError(t.createError);
      await loadAvailability();
    } finally {
      setSubmitting(false);
    }
  }

  const authenticated = state.status === "authenticated" && state.user.roles.includes("CUSTOMER");
  const accountReady = state.status === "authenticated";
  const slot = availability?.slots[selectedSlot];
  const total = availability?.totalPriceMinor;
  const regularTotal = availability?.originalTotalPriceMinor;
  const savings = availability?.savingsMinor;
  const available = Boolean(availability && availability.slots.length > 0 && total !== null && total !== undefined);

  if (state.status === "loading") {
    return <div className={styles.page + " kulha-reservation-viewport"} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><div className={styles.stateCard} aria-live="polite">{t.loadingReservation}</div></div>;
  }
  if (!accountReady) {
    return <div className={styles.page + " kulha-reservation-viewport"} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><ErrorState text={t.session} retry={t.retry} /><Link className={styles.primaryButton} href={localePath(locale, "/login")}>{locale === "ar" ? "تسجيل الدخول" : locale === "en" ? "Sign in" : "Se connecter"}</Link></div>;
  }
  if (!authenticated) {
    return <div className={styles.page + " kulha-reservation-viewport"} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><ErrorState text={t.forbidden} retry={t.retry} /></div>;
  }
  const backHref = localePath(locale, "/offers/" + encodeURIComponent(offerId));
  return (
    <div className={styles.page + " " + styles.checkoutPage + " kulha-reservation-viewport"} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className={styles.pageTop}>
        <Link className={styles.backLink} href={backHref}><span aria-hidden="true">‹</span>{t.back}</Link>
      </div>
      <div className={styles.headingRow}>
        <h1>{t.checkout}</h1>
        {loading && availability && <span className={styles.availabilityRefreshing} role="status">{t.loading}</span>}
      </div>

      {loading && !availability ? <ReservationLoading label={t.loading} /> :
        error ? <ErrorState text={error} onRetry={loadAvailability} retry={t.retry} /> :
        !availability || !availability.slots.length ? <ErrorState text={t.unavailable} onRetry={loadAvailability} retry={t.retry} /> : (
          <div className={styles.checkoutGrid} aria-busy={loading}>
            <div className={styles.checkoutMain}>
              <section className={styles.productCard}>
                <div className={styles.bagIllustration} aria-hidden="true">▱</div>
                <div className={styles.productInfo}>
                  <span className={styles.merchantName}>{availability.merchantName}</span>
                  <h2>{availability.offerTitle}</h2>
                  <span className={styles.pill}>{t.basket}</span>
                </div>
                <div className={styles.productPrice}>
                  {availability.unitPriceMinor !== null ? money(availability.unitPriceMinor, locale) : "—"}
                  {availability.originalPriceMinor !== null && availability.unitPriceMinor !== null && availability.originalPriceMinor > availability.unitPriceMinor
                    && <del className={styles.originalPrice}>{money(availability.originalPriceMinor, locale)}</del>}
                </div>
              </section>

              <section className={styles.panel}>
                <div className={styles.sectionLabel}>{t.quantity}</div>
                <div className={styles.quantityRow}>
                  <div className={styles.stepper} aria-label={t.quantity}>
                    <button type="button" aria-label={locale === "ar" ? "تقليل الكمية" : locale === "en" ? "Decrease quantity" : "Diminuer la quantité"} disabled={quantity <= 1 || submitting} onClick={() => { setLoading(true); setError(null); setQuantity((value) => Math.max(1, value - 1)); }}>−</button>
                    <output aria-live="polite">{quantity}</output>
                    <button type="button" aria-label={locale === "ar" ? "زيادة الكمية" : locale === "en" ? "Increase quantity" : "Augmenter la quantité"} disabled={quantity >= availability.maxQuantity || submitting} onClick={() => { setLoading(true); setError(null); setQuantity((value) => Math.min(availability.maxQuantity, value + 1)); }}>＋</button>
                  </div>
                  <div className={styles.quantityNote}>
                    <strong>{availability.availableUnits} {t.leftToday}</strong>
                    <span>{t.maxPerReservation}: {availability.maxQuantity}</span>
                    {total === null && <span className={styles.inlineError}>{t.quantityError}</span>}
                  </div>
                </div>
              </section>

              <section className={styles.panel}>
                <div className={styles.sectionLabel}>{t.pickup}</div>
                <div className={styles.pickupRows}>
                  <div className={styles.pickupRow}><span className={styles.detailIcon} aria-hidden="true">▦</span><div><strong>{t.pickupDate}</strong><span>{slot ? formatPickupDate(slot.start, locale) : "—"}</span></div></div>
                  <div className={styles.pickupRow}><span className={styles.detailIcon} aria-hidden="true">◷</span><div><strong>{t.pickupTime}</strong><span>{slot ? formatPickupWindow(slot.start, slot.end, locale) : "—"}</span><small>{t.heldUntil}</small></div></div>
                  <div className={styles.pickupRow}><span className={styles.detailIcon} aria-hidden="true">⌖</span><div><strong>{availability.merchantName}</strong><span>{[availability.merchantAddress, availability.merchantCity].filter(Boolean).join(", ")}</span>{availability.merchantPickupInstructions && <small>{availability.merchantPickupInstructions}</small>}</div></div>
                </div>
              </section>
            </div>

            <aside className={styles.summaryCard} aria-label={t.orderSummary}>
              <h2>{t.orderSummary}</h2>
              <div className={styles.summaryLine}><span>{t.basketOne}{quantity}</span><strong>{total != null ? money(total, locale) : "—"}</strong></div>
              {regularTotal != null && savings != null && savings > 0 && <>
                <div className={styles.summaryLine}><span>{t.regularValue}</span><del>{money(regularTotal, locale)}</del></div>
                <div className={styles.summaryLine}><span>{t.youSave}</span><strong>{money(savings, locale)}</strong></div>
              </>}
              <div className={styles.summaryDivider} />
              <div className={styles.totalLine}><strong>{t.totalAtPickup}</strong><b>{total != null ? money(total, locale) : "—"}</b></div>
              <div className={styles.notice}><span aria-hidden="true">♢</span><p>{t.notCharged}</p></div>
              {submitError && <p className={styles.formError} role="alert">{submitError}</p>}
              <button className={styles.confirmButton} type="button" disabled={!available || submitting || loading} onClick={() => void confirmReservation()}>
                {submitting ? t.confirming : t.confirm}
              </button>
              <p className={styles.terms}>{t.freeCancel}<br />{t.terms}</p>
            </aside>
          </div>
        )}
    </div>
  );
}
