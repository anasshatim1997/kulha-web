"use client";

import { useEffect, useState } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { publicOfferCopy } from "@/lib/offers/public-copy";
import { offerDesignCopy } from "@/lib/offers/design-copy";

function minutesUntil(instant: string): number | null {
  const timestamp = new Date(instant).getTime();
  if (!Number.isFinite(timestamp)) return null;
  const remaining = Math.ceil((timestamp - Date.now()) / 60_000);
  return remaining > 0 ? remaining : null;
}

export function getPickupCountdownDuration(minutes: number, locale: SiteLocale): string {
  const t = publicOfferCopy(locale);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0
    ? `${hours} ${t.hoursShort} ${remainingMinutes} ${t.minutesShort}`
    : `${remainingMinutes} ${t.minutesShort}`;
}

/** Compact "1h 20m" form used on the card pill; `getPickupCountdownDuration` stays the long, spoken form. */
function compactDuration(minutes: number, locale: SiteLocale): string {
  if (locale !== "en") return getPickupCountdownDuration(minutes, locale);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`;
}

export function PickupCountdown({ pickupEnd, locale }: { pickupEnd: string; locale: SiteLocale }) {
  const [minutes, setMinutes] = useState<number | null>(null);
  const t = publicOfferCopy(locale);

  useEffect(() => {
    let intervalId: number | undefined;
    const update = () => {
      const nextMinutes = minutesUntil(pickupEnd);
      setMinutes(nextMinutes);
      if (nextMinutes === null && intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      } else if (nextMinutes !== null && intervalId === undefined) {
        intervalId = window.setInterval(update, 60_000);
      }
    };

    update();
    return () => {
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [pickupEnd]);

  if (minutes === null) return null;
  const duration = compactDuration(minutes, locale);

  return (
    <span className="kulha-offer-countdown" title={`${t.pickupEndsIn} ${getPickupCountdownDuration(minutes, locale)}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
      <span>{offerDesignCopy(locale).endsIn} <bdi>{duration}</bdi></span>
    </span>
  );
}
