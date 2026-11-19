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
function icsDate(value: string): string {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}
function icsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function ReservationConfirmation({ reference, locale }: { reference: string; locale: SiteLocale }) {
  const t = reservationCopy(locale);
  const { state } = useSession();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    api.get<Reservation>("/reservations/" + encodeURIComponent(reference))
      .then((value) => { if (active) setReservation(value); })
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
  const calendarContent = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//KULHA//Reservation//EN", "BEGIN:VEVENT",
    "UID:" + encodeURIComponent(reservation.reference) + "@kulha",
    "DTSTAMP:" + icsDate(reservation.createdAt),
    "DTSTART:" + icsDate(reservation.pickupStart),
    "DTEND:" + icsDate(reservation.pickupEnd),
    "SUMMARY:" + icsText("KULHA! · " + reservation.offerTitle),
    "LOCATION:" + icsText(address),
    "DESCRIPTION:" + icsText(t.pickupCode + ": " + reservation.pickupCode),
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const calendarHref = "data:text/calendar;charset=utf-8," + encodeURIComponent(calendarContent);
  const detailHref = localePath(locale, "/reservations/" + encodeURIComponent(reservation.reference));

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
          {reservation.status === "CONFIRMED" ? <>
            {reservation.pickupQrPayload && <ReservationQrCode payload={reservation.pickupQrPayload} label={t.pickupCode} />}
            <strong className={styles.pickupCodeFallback}>{reservation.pickupCode}</strong>
          </> : <strong className={styles.statusPill}>{reservation.statusLabel}</strong>}
          <p>{reservation.pickupInstructions}</p>
        </section>
      </div>

      <div className={styles.actionRow}>
        <Link className={styles.primaryButton} href={detailHref}>{t.viewReservation}</Link>
        <a className={styles.secondaryButton} href={calendarHref} download={"kulha-" + reservation.reference + ".ics"}>{t.addCalendar}</a>
        <a className={styles.secondaryButton} href={directions} target="_blank" rel="noreferrer">{t.directions}</a>
      </div>
    </div>
  );
}
