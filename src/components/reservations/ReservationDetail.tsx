"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { reservationCopy, reservationLocaleTag } from "@/lib/i18n/reservation-copy";
import { localePath } from "@/lib/navigation";
import { api } from "@/lib/api/client";
import { useSession } from "@/components/session/SessionProvider";
import { formatPickupWindow } from "@/lib/offers/format";
import type { Reservation } from "@/lib/reservations/types";
import { ReservationQrCode } from "@/components/reservations/ReservationQrCode";
import styles from "./ReservationScreens.module.css";

function money(minor: number, locale: SiteLocale): string {
  return new Intl.NumberFormat(reservationLocaleTag(locale), {
    style: "currency", currency: "MAD", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(minor / 100);
}

export function ReservationDetail({ reference, locale }: { reference: string; locale: SiteLocale }) {
  const t = reservationCopy(locale);
  const { state } = useSession();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("NOT_SPECIFIED");
  const [cancelComment, setCancelComment] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const value = await api.get<Reservation>("/reservations/" + encodeURIComponent(reference));
      setReservation(value);
    } catch {
      setError(true);
      setReservation(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!confirmCancel) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !cancelling) setConfirmCancel(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [confirmCancel, cancelling]);

  useEffect(() => {
    let active = true;
    api.get<Reservation>("/reservations/" + encodeURIComponent(reference))
      .then((value) => { if (active) setReservation(value); })
      .catch(() => { if (active) { setError(true); setReservation(null); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reference]);

  async function cancelReservation() {
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await api.patch<Reservation>(
        "/reservations/" + encodeURIComponent(reference) + "/cancel",
        { reasonCode: cancelReason, comment: cancelComment.trim() || undefined },
      );
      setReservation(updated);
      setConfirmCancel(false);
      setCancelReason("NOT_SPECIFIED");
      setCancelComment("");
    } catch {
      setCancelError(t.cancelUnavailable);
    } finally {
      setCancelling(false);
    }
  }

  if (state.status === "loading" || loading) {
    return <div className={styles.page + " kulha-reservation-viewport"} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><div className={styles.stateCard} aria-live="polite">{t.loadingReservation}</div></div>;
  }
  if (state.status !== "authenticated" || !state.user.roles.includes("CUSTOMER")) {
    return <div className={styles.page + " kulha-reservation-viewport"} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><div className={styles.stateCard} role="alert">{t.forbidden}</div></div>;
  }
  if (error || !reservation) {
    return <div className={styles.page + " kulha-reservation-viewport"} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><div className={styles.stateCard} role="alert"><p>{t.errorTitle}</p><button className={styles.secondaryButton} type="button" onClick={() => void load()}>{t.retry}</button><Link href={localePath(locale, "/reservations")}>{t.backToReservations}</Link></div></div>;
  }

  // The API owns this classification. Do not derive upcoming/past from the browser clock.
  const isUpcoming = reservation.classification === "UPCOMING";
  const address = [reservation.merchantAddress, reservation.merchantCity].filter(Boolean).join(", ");
  const directions = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);

  return (
    <div className={styles.page + " kulha-reservation-viewport"} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-classification={reservation.classification.toLowerCase()}>
      <div className={styles.pageTop}>
        <Link className={styles.backLink} href={localePath(locale, "/reservations")}><span aria-hidden="true">‹</span>{t.backToReservations}</Link>
        <div className={styles.detailTopActions}>
          <span className={styles.statusPill}>{reservation.statusLabel}</span>
          {isUpcoming && reservation.canCancel && (
            <button className={styles.dangerButton} type="button" onClick={() => setConfirmCancel(true)}>{t.cancelReservation}</button>
          )}
        </div>
      </div>
      <header className={styles.listHeader}>
        <h1>{isUpcoming ? t.upcomingTitle : t.pastTitle}</h1>
        <p>{reservation.reference}</p>
      </header>

      <div className={styles.detailGrid}>
        <section className={styles.confirmationSummary}>
          <div className={styles.confirmationProduct}>
            <div className={styles.smallBag} aria-hidden="true">▱</div>
            <div><span>{reservation.merchantName}</span><h2>{reservation.offerTitle}</h2></div>
            <span className={styles.statusPill}>{reservation.statusLabel}</span>
          </div>
          <dl className={styles.definitionList}>
            <div><dt>{t.pickupWindow}</dt><dd>{formatPickupWindow(reservation.pickupStart, reservation.pickupEnd, locale)}</dd></div>
            <div><dt>{t.address}</dt><dd><span>{address}</span><a className={styles.mapLink} href={directions} target="_blank" rel="noreferrer"><span aria-hidden="true">⌖</span>{t.directions}</a></dd></div>
            <div><dt>{t.quantityLabel}</dt><dd>× {reservation.quantity}</dd></div>
            <div><dt>{t.totalPrice}</dt><dd>{money(reservation.totalPriceMinor, locale)}</dd></div>
          </dl>
        </section>

        <aside className={styles.detailCodeColumn}>
          <section className={styles.codeCard}>
            <span className={styles.codeCaption}>{t.pickupCode}</span>
            {reservation.status === "CONFIRMED" ? <>
              {reservation.pickupQrPayload && <ReservationQrCode payload={reservation.pickupQrPayload} label={t.pickupCode} />}
              <strong className={styles.pickupCodeFallback}>{reservation.pickupCode}</strong>
            </> : <strong className={styles.statusPill}>{reservation.statusLabel}</strong>}
            <p>{reservation.merchantPickupInstructions || reservation.pickupInstructions}</p>
          </section>
        </aside>
      </div>

      {reservation.status === "CANCELLED" && <p className={styles.cancelSuccess} role="status">{t.cancelSuccess}</p>}
      {confirmCancel && (
        <div className={styles.cancelOverlay} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !cancelling) setConfirmCancel(false);
        }}>
          <section className={styles.cancelDialog} role="dialog" aria-modal="true" aria-labelledby="cancel-reason-title">
            <div className={styles.cancelDialogHead}>
              <div><strong id="cancel-reason-title">{t.cancelReasonTitle}</strong><p>{t.cancelReasonNote}</p><p className={styles.cancelImpact}>{t.cancelImpact}</p><p className={styles.cancelReservationContext}>{reservation.offerTitle} · {formatPickupWindow(reservation.pickupStart, reservation.pickupEnd, locale)}</p></div>
              <button type="button" className={styles.cancelDialogClose} aria-label={t.keepReservation} onClick={() => setConfirmCancel(false)}>×</button>
            </div>
            <fieldset className={styles.cancelReasons}>
              <legend>{t.cancelReasonQuestion}</legend>
              {[
                ["NOT_SPECIFIED", t.reasonPreferNot],
                ["PICKUP_TIME", t.reasonPickupTime],
                ["TOO_FAR", t.reasonTooFar],
                ["CHANGED_MIND", t.reasonChangedMind],
                ["FOUND_ALTERNATIVE", t.reasonFoundAlternative],
                ["OFFER_EXPECTATION", t.reasonOfferExpectation],
                ["BOOKED_BY_MISTAKE", t.reasonMistake],
                ["OTHER", t.reasonOther],
              ].map(([code, label]) => (
                <label key={code}>
                  <input type="radio" name="cancel-reason" value={code} checked={cancelReason === code} onChange={() => setCancelReason(code)} />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
            <label className={styles.cancelComment}>
              <span>{t.cancelComment}</span>
              <textarea value={cancelComment} onChange={(event) => setCancelComment(event.target.value.slice(0, 500))} maxLength={500} rows={2} placeholder={t.cancelCommentPlaceholder} />
            </label>
            {cancelError && <p className={styles.formError} role="alert">{cancelError}</p>}
            <div className={styles.cancelDialogActions}>
              <button className={styles.secondaryButton} type="button" disabled={cancelling} onClick={() => setConfirmCancel(false)}>{t.keepReservation}</button>
              <button className={styles.dangerButton} type="button" disabled={cancelling} onClick={() => void cancelReservation()}>{cancelling ? t.cancelling : t.confirmCancel}</button>
            </div>
          </section>
        </div>
      )}
      <div className={styles.detailFooter}>
        <Link className={styles.primaryButton} href={localePath(locale, "/reservations")}>{t.backToReservations}</Link>
      </div>
    </div>
  );
}
