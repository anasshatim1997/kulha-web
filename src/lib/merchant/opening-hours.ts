/**
 * Weekly opening hours.
 *
 * The API stores opening hours as one string (max 500 characters). The form edits a structured week and
 * saves it in a compact, language-neutral text such as `Mon-Sat 08:00-19:00; Sun closed`, which this
 * module can read back into the picker and show in the shop owner's language.
 */

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAYS)[number];

export type DaySchedule = { open: boolean; from: string; to: string };
export type WeekSchedule = Record<DayKey, DaySchedule>;

export type HoursProblem = { code: "none" } | { code: "time" | "order"; day: DayKey };

const DAY_CODES: Record<DayKey, string> = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };
const CODE_TO_DAY = Object.fromEntries(DAYS.map((day) => [DAY_CODES[day], day])) as Record<string, DayKey>;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const SEGMENT = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:-(Mon|Tue|Wed|Thu|Fri|Sat|Sun))? (?:(closed)|([0-2]\d:[0-5]\d)-([0-2]\d:[0-5]\d))$/;

export const DEFAULT_OPENING = "08:00";
export const DEFAULT_CLOSING = "19:00";

/** Monday to Saturday open, Sunday closed: a sensible starting point for most shops. */
export function defaultWeek(): WeekSchedule {
  const week = {} as WeekSchedule;
  for (const day of DAYS) week[day] = { open: day !== "sun", from: DEFAULT_OPENING, to: DEFAULT_CLOSING };
  return week;
}

/** Why the week cannot be saved, or null when it is fine. */
export function validateWeek(week: WeekSchedule): HoursProblem | null {
  if (!DAYS.some((day) => week[day].open)) return { code: "none" };
  for (const day of DAYS) {
    const { open, from, to } = week[day];
    if (!open) continue;
    if (!TIME.test(from) || !TIME.test(to)) return { code: "time", day };
    if (to <= from) return { code: "order", day };
  }
  return null;
}

export type HoursGroup = { from: DayKey; to: DayKey; open: boolean; opens: string; closes: string };

/** Runs of consecutive days that share the same hours (or are all closed). */
export function groupWeek(week: WeekSchedule): HoursGroup[] {
  const groups: HoursGroup[] = [];
  for (const day of DAYS) {
    const { open, from, to } = week[day];
    const opens = open ? from : "";
    const closes = open ? to : "";
    const last = groups[groups.length - 1];
    if (last && last.open === open && last.opens === opens && last.closes === closes) last.to = day;
    else groups.push({ from: day, to: day, open, opens, closes });
  }
  return groups;
}

/** The string sent to the API. */
export function serializeWeek(week: WeekSchedule): string {
  return groupWeek(week)
    .map((group) => {
      const days = group.from === group.to ? DAY_CODES[group.from] : `${DAY_CODES[group.from]}-${DAY_CODES[group.to]}`;
      return group.open ? `${days} ${group.opens}-${group.closes}` : `${days} closed`;
    })
    .join("; ");
}

/** Reads a saved string back into a week. Returns null for anything that is not in the format above. */
export function parseWeek(text: string): WeekSchedule | null {
  const segments = text.split(";").map((part) => part.trim()).filter(Boolean);
  if (segments.length === 0) return null;
  const week = {} as WeekSchedule;
  for (const day of DAYS) week[day] = { open: false, from: DEFAULT_OPENING, to: DEFAULT_CLOSING };
  const seen = new Set<DayKey>();
  for (const segment of segments) {
    const match = SEGMENT.exec(segment);
    if (!match) return null;
    const first = DAYS.indexOf(CODE_TO_DAY[match[1]]);
    const last = match[2] ? DAYS.indexOf(CODE_TO_DAY[match[2]]) : first;
    if (last < first) return null;
    const closed = match[3] === "closed";
    if (!closed && (!TIME.test(match[4]) || !TIME.test(match[5]))) return null;
    for (let index = first; index <= last; index += 1) {
      const day = DAYS[index];
      if (seen.has(day)) return null;
      seen.add(day);
      week[day] = closed ? { open: false, from: DEFAULT_OPENING, to: DEFAULT_CLOSING } : { open: true, from: match[4], to: match[5] };
    }
  }
  return week;
}

/** Human-readable lines in the shop owner's language, e.g. `Lun–Sam  08:00 – 19:00`. */
export function summarizeWeek(week: WeekSchedule, shortDays: Record<DayKey, string>, closedLabel: string): string[] {
  return groupWeek(week).map((group) => {
    const days = group.from === group.to ? shortDays[group.from] : `${shortDays[group.from]}–${shortDays[group.to]}`;
    return group.open ? `${days}  ${group.opens} – ${group.closes}` : `${days}  ${closedLabel}`;
  });
}

/** Shows a stored value in the current language; text that predates the picker is shown as it was written. */
export function describeStoredHours(stored: string, shortDays: Record<DayKey, string>, closedLabel: string): string {
  const week = parseWeek(stored);
  return week ? summarizeWeek(week, shortDays, closedLabel).join("\n") : stored;
}
