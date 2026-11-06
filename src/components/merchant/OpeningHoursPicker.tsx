"use client";

import { DAYS, type DayKey, type DaySchedule, type WeekSchedule } from "@/lib/merchant/opening-hours";
import styles from "./OpeningHoursPicker.module.css";

export type OpeningHoursCopy = {
  days: Record<DayKey, string>;
  hoursClosed: string;
  hoursFrom: string;
  hoursTo: string;
  hoursCopyMonday: string;
};

type Props = {
  id: string;
  labelId: string;
  value: WeekSchedule;
  onChange: (next: WeekSchedule) => void;
  copy: OpeningHoursCopy;
  /** The day whose hours need fixing, highlighted when the form was refused. */
  errorDay?: DayKey;
  describedBy?: string;
};

/** One row per day: an open/closed switch and native time pickers (clock picker on phones and desktop). */
export function OpeningHoursPicker({ id, labelId, value, onChange, copy, errorDay, describedBy }: Props) {
  function update(day: DayKey, patch: Partial<DaySchedule>) {
    onChange({ ...value, [day]: { ...value[day], ...patch } });
  }

  function copyMonday() {
    const monday = value.mon;
    const next = { ...value } as WeekSchedule;
    for (const day of DAYS) if (day !== "mon" && value[day].open) next[day] = { ...value[day], from: monday.from, to: monday.to };
    onChange(next);
  }

  const canCopy = value.mon.open && DAYS.some((day) => day !== "mon" && value[day].open && (value[day].from !== value.mon.from || value[day].to !== value.mon.to));

  return (
    <div id={id} tabIndex={-1} role="group" aria-labelledby={labelId} aria-describedby={describedBy} className={styles.picker}>
      <ul className={styles.list}>
        {DAYS.map((day) => {
          const row = value[day];
          const invalid = errorDay === day;
          return (
            <li key={day} className={`${styles.row}${row.open ? "" : ` ${styles.rowClosed}`}${invalid ? ` ${styles.rowInvalid}` : ""}`}>
              <label className={styles.day}>
                <input type="checkbox" role="switch" className={styles.switchInput} checked={row.open} onChange={(event) => update(day, { open: event.target.checked })} />
                <span className={styles.track} aria-hidden="true"><span className={styles.thumb} /></span>
                <span className={styles.dayName}>{copy.days[day]}</span>
              </label>
              {row.open ? (
                <div className={styles.times}>
                  <input type="time" step={900} className={styles.time} aria-label={`${copy.days[day]} — ${copy.hoursFrom}`} aria-invalid={invalid ? true : undefined} value={row.from} onChange={(event) => update(day, { from: event.target.value })} required />
                  <span className={styles.dash} aria-hidden="true">–</span>
                  <input type="time" step={900} className={styles.time} aria-label={`${copy.days[day]} — ${copy.hoursTo}`} aria-invalid={invalid ? true : undefined} value={row.to} onChange={(event) => update(day, { to: event.target.value })} required />
                </div>
              ) : (
                <span className={styles.closed}>{copy.hoursClosed}</span>
              )}
            </li>
          );
        })}
      </ul>
      <button type="button" className={styles.copy} onClick={copyMonday} disabled={!canCopy}>{copy.hoursCopyMonday}</button>
    </div>
  );
}
