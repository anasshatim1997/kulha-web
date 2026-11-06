"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { SiteLocale } from "@/lib/i18n/site-copy";

/**
 * 24-hour time field for the opening-hours step.
 *
 * Why this exists: <input type="time"> is drawn by the browser, so it ignores the page
 * language. A French or Arabic page showed "08:00 AM / 07:00 PM" plus Chrome's blue
 * selection frame. This control always shows 24-hour time ("08:00 – 19:00"), is styled
 * with the KULHA! tokens, and its popover is portalled to <body> so the scrolling form
 * pane can never clip it.
 *
 * Value format is identical to the native input: "HH:MM" (24h) or "".
 */

type Props = {
    value: string;
    onChange: (value: string) => void;
    /** Accessible name, e.g. "Lundi, ouverture". Also shown as the popover title. */
    label: string;
    locale: SiteLocale;
    id?: string;
    invalid?: boolean;
    disabled?: boolean;
    describedBy?: string;
    /** Minute increments offered in the popover. Defaults to 15, like the old step={900}. */
    minuteStep?: 5 | 10 | 15 | 30;
};

const WORDS: Record<SiteLocale, { hour: string; minutes: string }> = {
    en: { hour: "Hour", minutes: "Minutes" },
    fr: { hour: "Heure", minutes: "Minutes" },
    ar: { hour: "الساعة", minutes: "الدقائق" },
};

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const COLUMNS = 6;
const POP_WIDTH = 296;
const GAP = 8;
const pad = (n: number) => String(n).padStart(2, "0");

function parse(value: string): { h: number; m: number } | null {
    const match = /^(\d{1,2}):(\d{2})/.exec(value);
    if (!match) return null;
    const h = Number(match[1]);
    const m = Number(match[2]);
    return h < 24 && m < 60 ? { h, m } : null;
}

function ClockIcon() {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5V12l3 2" />
        </svg>
    );
}

export function TimeField({ value, onChange, label, locale, id, invalid, disabled, describedBy, minuteStep = 15 }: Props) {
    const words = WORDS[locale] ?? WORDS.fr;
    const reactId = useId();
    const popId = `${reactId}-pop`;
    const parsed = parse(value);
    const [open, setOpen] = useState(false);
    const [place, setPlace] = useState<{ top: number; left: number; up: boolean } | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popRef = useRef<HTMLDivElement>(null);

    const minutes = Array.from({ length: Math.floor(60 / minuteStep) }, (_, i) => i * minuteStep);
    // A saved value that is off the step (e.g. 08:10) stays selectable instead of silently disappearing.
    if (parsed && !minutes.includes(parsed.m)) {
        minutes.push(parsed.m);
        minutes.sort((a, b) => a - b);
    }

    const close = useCallback((returnFocus: boolean) => {
        setOpen(false);
        if (returnFocus) triggerRef.current?.focus();
    }, []);

    const reposition = useCallback(() => {
        const trigger = triggerRef.current;
        const pop = popRef.current;
        if (!trigger || !pop) return;
        const rect = trigger.getBoundingClientRect();
        const height = pop.offsetHeight;
        const rtl = trigger.closest("[dir]")?.getAttribute("dir") === "rtl";
        const below = window.innerHeight - rect.bottom - GAP;
        const above = rect.top - GAP;
        const up = below < height && above > below;
        const wantedTop = up ? rect.top - height - GAP : rect.bottom + GAP;
        // Never let the popover leave the viewport, even on very short windows.
        const top = Math.min(Math.max(GAP, wantedTop), Math.max(GAP, window.innerHeight - height - GAP));
        const wanted = rtl ? rect.right - POP_WIDTH : rect.left;
        const left = Math.min(Math.max(GAP, wanted), window.innerWidth - POP_WIDTH - GAP);
        setPlace({ top, left, up });
    }, []);

    useLayoutEffect(() => {
        if (open) reposition();
    }, [open, reposition]);

    useEffect(() => {
        if (!open) return;
        const onPointer = (event: PointerEvent) => {
            const target = event.target as Node;
            if (popRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
            close(false);
        };
        const onMove = () => reposition();
        document.addEventListener("pointerdown", onPointer);
        window.addEventListener("resize", onMove);
        window.addEventListener("scroll", onMove, true);
        return () => {
            document.removeEventListener("pointerdown", onPointer);
            window.removeEventListener("resize", onMove);
            window.removeEventListener("scroll", onMove, true);
        };
    }, [open, close, reposition]);

    // Move focus into the popover once it is placed: selected hour, or 08 when empty.
    useEffect(() => {
        if (!open || !place) return;
        const target = popRef.current?.querySelector<HTMLButtonElement>('[data-group="h"][tabindex="0"]');
        target?.focus({ preventScroll: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, place === null]);

    function pickHour(h: number) {
        onChange(`${pad(h)}:${pad(parsed?.m ?? 0)}`);
        popRef.current?.querySelector<HTMLButtonElement>('[data-group="m"][tabindex="0"]')?.focus({ preventScroll: true });
    }

    function pickMinute(m: number) {
        onChange(`${pad(parsed?.h ?? 8)}:${pad(m)}`);
        close(true);
    }

    function onGridKey(event: KeyboardEvent<HTMLElement>, group: "h" | "m", count: number, columns: number) {
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(`[data-group="${group}"]`));
        const current = items.indexOf(document.activeElement as HTMLButtonElement);
        if (current < 0) return;
        const rtl = event.currentTarget.closest("[dir]")?.getAttribute("dir") === "rtl";
        const step: Record<string, number> = {
            ArrowRight: rtl ? -1 : 1,
            ArrowLeft: rtl ? 1 : -1,
            ArrowDown: columns,
            ArrowUp: -columns,
        };
        let next = current;
        if (event.key in step) next = Math.min(count - 1, Math.max(0, current + step[event.key]));
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = count - 1;
        else return;
        event.preventDefault();
        items[next]?.focus();
    }

    function onPopKey(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            close(true);
            return;
        }
        if (event.key !== "Tab") return;
        // Small focus trap: the popover lives at the end of <body>, so wrap instead of escaping.
        const stops = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button[tabindex="0"]'));
        const first = stops[0];
        const last = stops[stops.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }

    const hourStop = parsed ? parsed.h : 8;
    const minuteStop = parsed ? parsed.m : minutes[0];
    const rtl = locale === "ar";

    return (
        <>
            <button
                ref={triggerRef}
                id={id}
                type="button"
                className={`mw-time${open ? " mw-time-open" : ""}`}
                aria-label={`${label}${parsed ? `, ${value}` : ""}`}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls={open ? popId : undefined}
                aria-invalid={invalid ? true : undefined}
                aria-describedby={describedBy}
                disabled={disabled}
                onClick={() => setOpen((current) => !current)}
                onKeyDown={(event) => {
                    if (event.key === "ArrowDown" && !open) { event.preventDefault(); setOpen(true); }
                }}
            >
                <bdi dir="ltr" className="mw-time-value">{parsed ? `${pad(parsed.h)}:${pad(parsed.m)}` : "--:--"}</bdi>
                <ClockIcon />
            </button>

            {open && typeof document !== "undefined" && createPortal(
                <div
                    ref={popRef}
                    id={popId}
                    role="dialog"
                    aria-label={label}
                    dir={rtl ? "rtl" : "ltr"}
                    className={`mw-time-pop${place?.up ? " mw-time-pop-up" : ""}`}
                    style={{ top: place?.top ?? 0, left: place?.left ?? 0, width: POP_WIDTH, visibility: place ? "visible" : "hidden" }}
                    onKeyDown={onPopKey}
                >
                    <div className="mw-time-head">
                        <span className="mw-time-title">{label}</span>
                        <bdi dir="ltr" className="mw-time-big">{parsed ? <>{pad(parsed.h)}<i>:</i>{pad(parsed.m)}</> : "--:--"}</bdi>
                    </div>

                    <p className="mw-time-cap" id={`${popId}-h`}>{words.hour}</p>
                    <div className="mw-time-hours" role="group" aria-labelledby={`${popId}-h`} onKeyDown={(event) => onGridKey(event, "h", 24, COLUMNS)}>
                        {HOURS.map((h) => (
                            <button
                                key={h}
                                type="button"
                                data-group="h"
                                className={`mw-time-cell${h < 6 ? " mw-time-night" : ""}`}
                                aria-pressed={parsed?.h === h}
                                tabIndex={h === hourStop ? 0 : -1}
                                onClick={() => pickHour(h)}
                            >
                                {pad(h)}
                            </button>
                        ))}
                    </div>

                    <p className="mw-time-cap" id={`${popId}-m`}>{words.minutes}</p>
                    <div className="mw-time-mins" role="group" aria-labelledby={`${popId}-m`} onKeyDown={(event) => onGridKey(event, "m", minutes.length, minutes.length)}>
                        {minutes.map((m) => (
                            <button
                                key={m}
                                type="button"
                                data-group="m"
                                className="mw-time-min"
                                aria-pressed={parsed?.m === m}
                                tabIndex={m === minuteStop ? 0 : -1}
                                onClick={() => pickMinute(m)}
                            >
                                {pad(m)}
                            </button>
                        ))}
                    </div>
                </div>,
                document.body,
            )}
        </>
    );
}
