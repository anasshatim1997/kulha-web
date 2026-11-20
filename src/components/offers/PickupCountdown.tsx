"use client";

import { useSyncExternalStore } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { publicOfferCopy } from "@/lib/offers/public-copy";
import { offerDesignCopy } from "@/lib/offers/design-copy";

const UNITS: Record<SiteLocale, { d: string; h: string; m: string; s: string }> = {
    fr: { d: "j", h: "h", m: "min", s: "s" },
    en: { d: "d", h: "h", m: "min", s: "s" },
    ar: { d: "ي", h: "س", m: "د", s: "ث" },
};

const listeners = new Set<() => void>();
let timer: number | undefined;

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    if (timer === undefined) {
        timer = window.setInterval(() => {
            listeners.forEach((notify) => notify());
        }, 1000);
    }
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && timer !== undefined) {
            window.clearInterval(timer);
            timer = undefined;
        }
    };
}

function getNowSecond(): number {
    return Math.floor(Date.now() / 1000);
}

function getServerNowSecond(): number | null {
    return null;
}

function pad(value: number): string {
    return String(value).padStart(2, "0");
}

export function getPickupCountdownDuration(minutes: number, locale: SiteLocale): string {
    const t = publicOfferCopy(locale);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0
        ? `${hours} ${t.hoursShort} ${remainingMinutes} ${t.minutesShort}`
        : `${remainingMinutes} ${t.minutesShort}`;
}

export function formatPickupCountdown(totalSeconds: number, locale: SiteLocale): string {
    const units = UNITS[locale] ?? UNITS.en;
    const days = Math.floor(totalSeconds / 86_400);
    const hours = Math.floor((totalSeconds % 86_400) / 3_600);
    const minutes = Math.floor((totalSeconds % 3_600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [
        `${pad(hours)} ${units.h}`,
        `${pad(minutes)} ${units.m}`,
        `${pad(seconds)} ${units.s}`,
    ];
    if (days > 0) parts.unshift(`${pad(days)} ${units.d}`);
    return parts.join(" ");
}

export function PickupCountdown({ pickupEnd, locale }: { pickupEnd: string; locale: SiteLocale }) {
    const nowSecond = useSyncExternalStore<number | null>(subscribe, getNowSecond, getServerNowSecond);
    const t = publicOfferCopy(locale);

    const endMs = new Date(pickupEnd).getTime();
    if (nowSecond === null || !Number.isFinite(endMs)) return null;

    const remaining = Math.floor(endMs / 1000) - nowSecond;
    if (remaining <= 0) return null;

    const duration = formatPickupCountdown(remaining, locale);

    return (
        <span className="kulha-offer-countdown" title={`${t.pickupEndsIn} ${duration}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
      <span>{offerDesignCopy(locale).endsIn} <bdi dir="ltr" style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{duration}</bdi></span>
    </span>
    );
}