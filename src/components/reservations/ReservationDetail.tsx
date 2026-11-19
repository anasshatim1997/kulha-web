"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { reservationCopy, reservationLocaleTag } from "@/lib/i18n/reservation-copy";
import { localePath } from "@/lib/navigation";
import { api } from "@/lib/api/client";
import { useSession } from "@/components/session/SessionProvider";
import { formatPickupWindow } from "@/lib/offers/format";
import type { PickupCredential, Reservation } from "@/lib/reservations/types";
import styles from "./ReservationScreens.module.css";

function money(minor: number, locale: SiteLocale): string {
  return new Intl.NumberFormat(reservationLocaleTag(locale), {
    style: "currency", currency: "MAD", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(minor / 100);
}

const CANCELLATION_REASONS = [
  ["PICKUP_TIME", "cancelReasonPickupTime"],
  ["TOO_FAR", "cancelReasonTooFar"],
  ["CHANGED_MIND", "cancelReasonChangedMind"],
  ["FOUND_ALTERNATIVE", "cancelReasonFoundAlternative"],
  ["OFFER_NOT_AS_EXPECTED", "cancelReasonOfferNotExpected"],
  ["RESERVED_BY_MISTAKE", "cancelReasonMistake"],
  ["OTHER", "cancelReasonOther"],
] as const;

export function ReservationDetail({ reference, locale }: { reference: string; locale: SiteLocale }) {
  const t = reservationCopy(locale);
  const { state } = useSession();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [credential, setCredential] = useState<PickupCredential | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [error, setError] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [reasonCode, setReasonCode] = useState("NOT_PROVIDED");
  const [comment, setComment] = useState("");

  const issueCredential = useCallback(async () => {
    setQrLoading(true);
    setQrError(false);
    try {
      const value = await api.post<PickupCredential>(
        "/reservations/" + encodeURIComponent(reference) + "/pickup-credential",
      );
      setCredential(value);
    } catch {
      setCredential(null);
      setQrError(true);
    } finally {
      setQrLoading(false);
    }
  }, [reference]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const value = await api.get<Reservation>("/reservations/" + encodeURIComponent(reference));
      setReservation(value);
      if (value.status === "CONFIRMED" && value.classification === "UPCOMING") await issueCredential();
      else setCredential(null);
    } catch {
      setError(true);
      setReservation(null);
    } finally {
      setLoading(false);
    }
  }, [issueCredential, reference]);

  useEffect(() => {
    let active = true;
    api.get<Reservation>("/reservations/" + encodeURIComponent(reference))
      .then(async (value) => {
        if (!active) return;
        setReservation(value);
        if (value.status === "CONFIRMED" && value.classification === "UPCOMING") {
          setQrLoading(true);
          setQrError(false);
          try {
            const qr = await api.post<PickupCredential>(
              "/reservations/" + encodeURIComponent(reference) + "/pickup-credential",
            );
            if (active) setCredential(qr);
          } catch {
            if (active) setQrError(true);
          } finally {
            if (active) setQrLoading(false);
          }
        }
      })
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
        { reasonCode: reasonCode || "NOT_PROVIDED", comment: comment.trim() || undefined },
      );
      setReservation(updated);
      setCredential(null);
      setConfirmCancel(false);
      setComment("");
    } catch {
      setCancelError(t.cancelUnavailable);
    } finally {
      setCancelling(false);
    }
  }

  if (state.status === "loading" || loading) {
    return <div className={styles.page} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><div className={styles.stateCard} aria-live="polite">{t.loadingReservation}</div></div>;
  }
  if (state.status !== "authenticated" || !state.user.roles.includes("CUSTOMER")) {
    return <div className={styles.page} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><div className={styles.stateCard} role="alert">{t.forbidden}</div></div>;
  }
  if (error || !reservation) {
    return <div className={styles.page} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><div className={styles.stateCard} role="alert"><p>{t.errorTitle}</p><button className={styles.secondaryButton} type="button" onClick={() => void load()}>{t.retry}</button><Link href={localePath(locale, "/reservations")}>{t.backToReservations}</Link></div></div>;
  }

  // Upcoming/past comes from the API. The browser does not calculate reservation status.
  const isUpcoming = reservation.classification === "UPCOMING";
  const canShowQr = isUpcoming && reservation.status === "CONFIRMED";
  const address = [reservation.merchantAddress, reservation.merchantCity].filter(Boolean).join(", ");
  const directions = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);
  const expiresLabel = credential ? new Intl.DateTimeFormat(reservationLocaleTag(locale), {
    timeZone: "Africa/Casablanca", dateStyle: "short", timeStyle: "short",
  }).format(new Date(credential.expiresAt)) : "";

  return (
    <div className={styles.page} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-classification={reservation.classification.toLowerCase()}>
      <div className={styles.pageTop}>
        <Link className={styles.backLink} href={localePath(locale, "/reservations")}><span aria-hidden="true">‹</span>{t.backToReservations}</Link>
        <span className={styles.statusPill}>{reservation.statusLabel}</span>
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
            <div><dt>{t.reference}</dt><dd>{reservation.reference}</dd></div>
            <div><dt>{t.basketLabel}</dt><dd>{reservation.offerTitle} × {reservation.quantity}</dd></div>
            <div><dt>{t.merchant}</dt><dd>{reservation.merchantName}</dd></div>
            <div><dt>{t.pickupWindow}</dt><dd>{formatPickupWindow(reservation.pickupStart, reservation.pickupEnd, locale)}</dd></div>
            <div><dt>{t.address}</dt><dd>{address}</dd></div>
            <div><dt>{t.unitPrice}</dt><dd>{money(reservation.unitPriceMinor, locale)}</dd></div>
            <div><dt>{t.totalPrice}</dt><dd>{money(reservation.totalPriceMinor, locale)}</dd></div>
          </dl>
        </section>

        <aside className={styles.detailCodeColumn}>
          <section className={styles.codeCard} aria-label={t.pickupCode}>
            <span className={styles.codeCaption}>{t.pickupCode}</span>
            {credential && <Image src={credential.qrImageDataUrl} alt={t.qrAlt} width={200} height={200} unoptimized className={styles.qrImage} />}
            {canShowQr && qrLoading && <span className={styles.qrLoading} role="status">{t.loadingReservation}</span>}
            {canShowQr && qrError && !qrLoading && <div className={styles.qrError} role="status"><span>{t.qrUnavailable}</span><button type="button" className={styles.secondaryButton} onClick={() => void issueCredential()}>{t.refreshQr}</button></div>}
            <strong className={styles.pickupCode}>{reservation.pickupCode}</strong>
            {credential && <small className={styles.qrExpiry}>{t.qrExpires} {expiresLabel}</small>}
            <p>{reservation.merchantPickupInstructions || reservation.pickupInstructions}</p>
          </section>
        </aside>
      </div>

      <div className={styles.detailFooter}>
        {isUpcoming && reservation.canCancel && (
          <div className={styles.cancelArea}>
            {cancelError && <p className={styles.formError} role="alert">{cancelError}</p>}
            {!confirmCancel ? (
              <button className={styles.dangerButton} type="button" onClick={() => setConfirmCancel(true)}>{t.cancelReservation}</button>
            ) : (
              <section className={styles.cancelPanel} aria-labelledby="cancel-reason-title">
                <div className={styles.cancelPanelHeading}>
                  <h2 id="cancel-reason-title">{t.cancelReasonTitle}</h2>
                  <p>{t.cancelReasonOptional}</p>
                </div>
                <label className={styles.cancelField}>
                  <span>{t.cancelReasonTitle}</span>
                  <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)}>
                    <option value="NOT_PROVIDED">{t.cancelReasonSkip}</option>
                    {CANCELLATION_REASONS.map(([code, key]) => (
                      <option key={code} value={code}>{t[key]}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.cancelField}>
                  <span>{t.cancelComment}</span>
                  <textarea value={comment} maxLength={500} rows={2} placeholder={t.cancelCommentPlaceholder} onChange={(event) => setComment(event.target.value)} />
                </label>
                <div className={styles.cancelPanelActions}>
                  <button className={styles.dangerButton} type="button" disabled={cancelling} onClick={() => void cancelReservation()}>{cancelling ? t.cancelSubmitting : t.cancelConfirmAction}</button>
                  <button className={styles.secondaryButton} type="button" disabled={cancelling} onClick={() => setConfirmCancel(false)}>{t.keepReservation}</button>
                </div>
              </section>
            )}
          </div>
        )}
        <a className={styles.secondaryButton} href={directions} target="_blank" rel="noreferrer">{t.directions}</a>
        <Link className={styles.primaryButton} href={localePath(locale, "/reservations")}>{t.backToReservations}</Link>
      </div>
    </div>
  );
}
