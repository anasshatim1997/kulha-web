"use client";

import { useState } from "react";
import { TimeField } from "@/components/merchant/TimeField";
import type { ShopSetupCopy } from "@/lib/i18n/shop-setup-copy";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { DAYS, DEFAULT_CLOSING, DEFAULT_OPENING, type DayKey, type WeekSchedule } from "@/lib/merchant/opening-hours";
import styles from "./ShopSetup.module.css";

type Props = {
  id: string;
  labelId: string;
  locale: SiteLocale;
  value: WeekSchedule;
  onChange: (next: WeekSchedule) => void;
  copy: ShopSetupCopy;
  daysShort: Record<DayKey, string>;
  daysLong: Record<DayKey, string>;
  closedLabel: string;
  /** The day whose hours were refused on submit. */
  errorDay?: DayKey;
  describedBy?: string;
};

type Usual = { from: string; to: string };

const MON_SAT: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat"];
const WEEKDAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri"];
const QUICK_PICKS = [
  { key: "monSat", days: MON_SAT },
  { key: "everyDay", days: [...DAYS] as DayKey[] },
  { key: "weekdays", days: WEEKDAYS },
] as const;

/** The timeline covers 06:00 to 24:00, like the design. */
const TIMELINE_START = 6 * 60;
const TIMELINE_END = 24 * 60;
const AXIS = [6, 12, 18, 24];

function minutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

/** The hours most open days share, so "custom" only flags the days that differ. */
function mostCommonHours(week: WeekSchedule): Usual {
  const counts = new Map<string, { usual: Usual; count: number }>();
  for (const day of DAYS) {
    const { open, from, to } = week[day];
    if (!open) continue;
    const key = `${from}|${to}`;
    const entry = counts.get(key);
    if (entry) entry.count += 1;
    else counts.set(key, { usual: { from, to }, count: 1 });
  }
  let best: { usual: Usual; count: number } | undefined;
  for (const entry of counts.values()) if (!best || entry.count > best.count) best = entry;
  return best?.usual ?? { from: DEFAULT_OPENING, to: DEFAULT_CLOSING };
}

function sameDays(week: WeekSchedule, days: readonly DayKey[]): boolean {
  return DAYS.every((day) => week[day].open === days.includes(day));
}

function barGeometry(from: string, to: string) {
  const start = Math.min(Math.max(minutes(from), TIMELINE_START), TIMELINE_END);
  const end = Math.min(Math.max(minutes(to), TIMELINE_START), TIMELINE_END);
  const span = TIMELINE_END - TIMELINE_START;
  return { left: ((start - TIMELINE_START) / span) * 100, width: Math.max(((end - start) / span) * 100, 2) };
}

export function WeekHoursEditor({ id, labelId, locale, value, onChange, copy, daysShort, daysLong, closedLabel, errorDay, describedBy }: Props) {
  const [usual, setUsual] = useState<Usual>(() => mostCommonHours(value));
  const [editing, setEditing] = useState<DayKey | null>(null);
  const usualInvalid = usual.to <= usual.from;

  const isCustom = (day: DayKey) => value[day].open && (value[day].from !== usual.from || value[day].to !== usual.to);

  function update(day: DayKey, patch: Partial<WeekSchedule[DayKey]>) {
    onChange({ ...value, [day]: { ...value[day], ...patch } });
  }

  function toggleDay(day: DayKey) {
    if (value[day].open) update(day, { open: false });
    else update(day, { open: true, from: usual.from, to: usual.to });
  }

  function applyQuickPick(days: readonly DayKey[]) {
    const next = { ...value } as WeekSchedule;
    for (const day of DAYS) {
      if (days.includes(day)) next[day] = value[day].open ? value[day] : { open: true, from: usual.from, to: usual.to };
      else next[day] = { ...value[day], open: false };
    }
    onChange(next);
  }

  function changeUsual(field: "from" | "to", time: string) {
    const previous = usual[field];
    setUsual({ ...usual, [field]: time });
    const next = { ...value } as WeekSchedule;
    for (const day of DAYS) if (value[day].open && value[day][field] === previous) next[day] = { ...value[day], [field]: time };
    onChange(next);
  }

  const quickLabels = { monSat: copy.quickMonSat, everyDay: copy.quickEveryDay, weekdays: copy.quickWeekdays };

  return (
    <div id={id} tabIndex={-1} role="group" aria-labelledby={labelId} aria-describedby={describedBy} className={styles.hours}>
      <div className={styles.block}>
        <span className={styles.eyebrow}>{copy.quickPick}</span>
        <div className={styles.chips}>
          {QUICK_PICKS.map((pick) => (
            <button key={pick.key} type="button" className={styles.chip} aria-pressed={sameDays(value, pick.days)} onClick={() => applyQuickPick(pick.days)}>
              {quickLabels[pick.key]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.block}>
        <span className={styles.eyebrow}>{copy.openDays}</span>
        <div className={styles.dayGrid}>
          {DAYS.map((day) => {
            const custom = isCustom(day);
            return (
              <button
                key={day}
                type="button"
                className={styles.dayButton}
                aria-pressed={value[day].open}
                aria-label={`${daysLong[day]}${custom ? `, ${copy.custom}` : ""}`}
                onClick={() => toggleDay(day)}
              >
                {daysShort[day]}
                {custom && <i className={styles.customDot} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.timesRow}>
        <div className={`${styles.block} ${styles.timeBlock}`}>
          <span className={styles.eyebrow}>{copy.opens}</span>
          <div className={styles.timeWrap}>
            <TimeField value={usual.from} onChange={(time) => changeUsual("from", time)} label={copy.opens} locale={locale} invalid={usualInvalid} />
          </div>
        </div>
        <div className={`${styles.block} ${styles.timeBlock}`}>
          <span className={styles.eyebrow}>{copy.closes}</span>
          <div className={styles.timeWrap}>
            <TimeField value={usual.to} onChange={(time) => changeUsual("to", time)} label={copy.closes} locale={locale} invalid={usualInvalid} />
          </div>
        </div>
      </div>

      <section className={styles.glance} aria-label={copy.glanceTitle}>
        <div className={styles.glanceHead}>
          <h3>{copy.glanceTitle}</h3>
          <p>{copy.glanceHint}</p>
        </div>

        <div className={styles.axis} aria-hidden="true">
          {AXIS.map((hour, index) => (
            <span key={hour} style={{ insetInlineStart: `${(index / (AXIS.length - 1)) * 100}%` }}>{String(hour).padStart(2, "0")}:00</span>
          ))}
        </div>

        <ul className={styles.weekList}>
          {DAYS.map((day) => {
            const row = value[day];
            const custom = isCustom(day);
            const invalid = errorDay === day;
            const bar = row.open ? barGeometry(row.from, row.to) : null;
            const panelId = `${id}-${day}-panel`;
            const isEditing = editing === day;
            return (
              <li key={day} className={`${styles.weekItem}${invalid ? ` ${styles.weekInvalid}` : ""}`}>
                <div className={styles.weekRow}>
                  <span className={styles.weekDay}>{daysShort[day]}</span>
                  <div className={styles.track} aria-hidden="true">
                    {bar && <span className={`${styles.bar}${custom ? ` ${styles.barCustom}` : ""}`} style={{ left: `${bar.left}%`, width: `${bar.width}%` }} />}
                  </div>
                  <div className={styles.weekTime}>
                    {row.open ? <bdi dir="ltr">{row.from}–{row.to}</bdi> : <span className={styles.weekClosed}>{closedLabel}</span>}
                    {custom && <span className={styles.customBadge}>{copy.custom}</span>}
                  </div>
                  <button type="button" className={styles.editLink} aria-expanded={isEditing} aria-controls={panelId} aria-label={`${copy.edit} — ${daysLong[day]}`} onClick={() => setEditing(isEditing ? null : day)}>
                    {isEditing ? copy.done : copy.edit}
                  </button>
                </div>

                {isEditing && (
                  <div className={styles.dayEditor} id={panelId}>
                    <label className={styles.switchLabel}>
                      <input type="checkbox" role="switch" className={styles.switchInput} checked={row.open} onChange={(event) => (event.target.checked ? update(day, { open: true, from: row.from || usual.from, to: row.to || usual.to }) : update(day, { open: false }))} />
                      <span className={styles.switchTrack} aria-hidden="true"><span className={styles.switchThumb} /></span>
                      <span>{copy.openThisDay}</span>
                    </label>
                    {row.open && (
                      <div className={styles.dayTimes}>
                        <div className={styles.timeWrap}>
                          <TimeField value={row.from} onChange={(time) => update(day, { from: time })} label={`${daysLong[day]} — ${copy.opens}`} locale={locale} invalid={invalid} />
                        </div>
                        <span className={styles.dayDash} aria-hidden="true">–</span>
                        <div className={styles.timeWrap}>
                          <TimeField value={row.to} onChange={(time) => update(day, { to: time })} label={`${daysLong[day]} — ${copy.closes}`} locale={locale} invalid={invalid} />
                        </div>
                        {custom && <button type="button" className={styles.resetDay} onClick={() => update(day, { from: usual.from, to: usual.to })}>{copy.resetDay}</button>}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
