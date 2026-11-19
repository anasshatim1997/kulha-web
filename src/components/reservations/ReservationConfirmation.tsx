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

export function ReservationConfirmation({ reference, locale }: { reference: string; locale: SiteLocale }) {
  const t = reservationCopy(locale);
  const { state } = useSession();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [credential, setCredential] = useState<PickupCredential | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState(false);
  const [error, setError] = useState(false);

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

  useEffect(() => {
    let active = true;
    api.get<Reservation>("/reservations/" + encodeURIComponent(reference))
      .then(async (value) => {
        if (!active) return;
        setReservation(value);
        if (value.status === "CONFIRMED") {
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
        } else {
          setQrLoading(false);
        }
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reference]);

  if (state.status === "loading" || loading) {
    return <div className={styles.page} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><div className={styles.stateCard} aria-live="polite">{t.loadingReservation}</div></div>;
  }
  if (state.status !== "authenticated" || !state.user.roles.includes("CUSTOMER")) {
    return <div className={styles.page} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><div className={styles.stateCard} role="alert">{t.forbidden}</div></div>;
  }
  if (error || !reservation) {
    return <div className={styles.page} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><div className={styles.stateCard} role="alert">{t.errorTitle}<p>{t.unavailable}</p><Link className={styles.secondaryButton} href={localePath(locale, "/reservations")}>{t.backToReservations}</Link></div></div>;
  }

  const address = [reservation.merchantAddress, reservation.merchantCity].filter(Boolean).join(", ");
  const directions = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);
  const detailHref = localePath(locale, "/reservations/" + encodeURIComponent(reservation.reference));
  const expiresLabel = credential ? new Intl.DateTimeFormat(reservationLocaleTag(locale), {
    timeZone: "Africa/Casablanca", dateStyle: "short", timeStyle: "short",
  }).format(new Date(credential.expiresAt)) : "";

  return (
    <div className={styles.page + " " + styles.confirmationPage} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className={styles.successHeader}>
        <span className={styles.successIcon} aria-hidden="true">✓</span>
        <h1>{t.confirmed}</h1>
        <p>{t.saved}</p>
      </header>

      <div className={styles.confirmationGrid}>
        <section className={styles.confirmationSummary}>
          <div className={styles.confirmationProduct}>
            <div className={styles.smallBag} aria-hidden="true">▱</div>
            <div><span>{reservation.merchantName}</span><h2>{reservation.offerTitle}</h2></div>
            <span className={styles.statusPill}>{reservation.statusLabel}</span>
          </div>
          <dl className={styles.definitionList}>
            <div><dt>{t.reference}</dt><dd>{reservation.reference}</dd></div>
            <div><dt>{t.basketLabel}</dt><dd>{reservation.offerTitle} × {reservation.quantity}</dd></div>
            <div><dt>{t.pickup}</dt><dd>{formatPickupWindow(reservation.pickupStart, reservation.pickupEnd, locale)}</dd></div>
            <div><dt>{t.address}</dt><dd>{address}</dd></div>
            <div><dt>{t.total}</dt><dd>{money(reservation.totalPriceMinor, locale)}</dd></div>
          </dl>
        </section>

        <section className={styles.codeCard} aria-label={t.pickupCode}>
          <span className={styles.codeCaption}>{t.pickupCode}</span>
          {credential && <Image src={credential.qrImageDataUrl} alt={t.qrAlt} width={220} height={220} unoptimized className={styles.qrImage} />}
          {qrLoading && <span className={styles.qrLoading} role="status">{t.loadingReservation}</span>}
          {qrError && !qrLoading && <div className={styles.qrError} role="status"><span>{t.qrUnavailable}</span><button type="button" className={styles.secondaryButton} onClick={() => void issueCredential()}>{t.refreshQr}</button></div>}
          <strong className={styles.pickupCode}>{reservation.pickupCode}</strong>
          {credential && <small className={styles.qrExpiry}>{t.qrExpires} {expiresLabel}</small>}
          <p>{reservation.pickupInstructions}</p>
        </section>
      </div>

      <div className={styles.actionRow}>
        <Link className={styles.primaryButton} href={detailHref}>{t.viewReservation}</Link>
        <a className={styles.secondaryButton} href={directions} target="_blank" rel="noreferrer">{t.directions}</a>
      </div>
    </div>
  );
}
