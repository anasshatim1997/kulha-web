import { describe, expect, it } from "vitest";
import { defaultWeek, describeStoredHours, groupWeek, parseWeek, serializeWeek, summarizeWeek, validateWeek, type WeekSchedule } from "./opening-hours";

const short = { mon: "Lun", tue: "Mar", wed: "Mer", thu: "Jeu", fri: "Ven", sat: "Sam", sun: "Dim" };

function week(overrides: Partial<WeekSchedule> = {}): WeekSchedule {
  return { ...defaultWeek(), ...overrides };
}

describe("opening hours", () => {
  it("starts with Monday to Saturday open and Sunday closed", () => {
    expect(serializeWeek(defaultWeek())).toBe("Mon-Sat 08:00-19:00; Sun closed");
  });

  it("groups only consecutive days with identical hours", () => {
    const custom = week({ wed: { open: true, from: "09:00", to: "13:00" } });
    expect(groupWeek(custom).map((group) => `${group.from}-${group.to}`)).toEqual(["mon-tue", "wed-wed", "thu-sat", "sun-sun"]);
    expect(serializeWeek(custom)).toBe("Mon-Tue 08:00-19:00; Wed 09:00-13:00; Thu-Sat 08:00-19:00; Sun closed");
  });

  it("round-trips through the stored text", () => {
    const custom = week({ fri: { open: true, from: "08:00", to: "12:30" }, sun: { open: true, from: "09:00", to: "13:00" } });
    const parsed = parseWeek(serializeWeek(custom));
    expect(parsed).not.toBeNull();
    expect(serializeWeek(parsed as WeekSchedule)).toBe(serializeWeek(custom));
    expect(parsed?.fri).toEqual({ open: true, from: "08:00", to: "12:30" });
    expect(parsed?.sun.open).toBe(true);
  });

  it("treats days that are not mentioned as closed", () => {
    const parsed = parseWeek("Mon-Fri 07:00-15:00");
    expect(parsed?.sat.open).toBe(false);
    expect(parsed?.mon).toEqual({ open: true, from: "07:00", to: "15:00" });
  });

  it("refuses free text, overlaps, backwards ranges and impossible times", () => {
    for (const text of ["", "Lun–Sam : 7h–20h\nDim : 8h–13h", "Mon-Fri 08:00-19:00; Wed 09:00-10:00", "Fri-Mon 08:00-19:00", "Mon 25:00-26:00", "Mon 8:00-19:00"]) {
      expect(parseWeek(text)).toBeNull();
    }
  });

  it("stays well inside the 500 character API limit", () => {
    const worst: WeekSchedule = week({
      mon: { open: true, from: "08:00", to: "12:00" },
      tue: { open: false, from: "08:00", to: "19:00" },
      wed: { open: true, from: "09:00", to: "13:00" },
      thu: { open: false, from: "08:00", to: "19:00" },
      fri: { open: true, from: "10:00", to: "14:00" },
      sat: { open: false, from: "08:00", to: "19:00" },
      sun: { open: true, from: "11:00", to: "15:00" },
    });
    expect(serializeWeek(worst).length).toBeLessThan(150);
  });

  it("validates before saving", () => {
    expect(validateWeek(defaultWeek())).toBeNull();
    const allClosed = Object.fromEntries(Object.entries(defaultWeek()).map(([day, value]) => [day, { ...value, open: false }])) as WeekSchedule;
    expect(validateWeek(allClosed)).toEqual({ code: "none" });
    expect(validateWeek(week({ tue: { open: true, from: "18:00", to: "09:00" } }))).toEqual({ code: "order", day: "tue" });
    expect(validateWeek(week({ tue: { open: true, from: "09:00", to: "09:00" } }))).toEqual({ code: "order", day: "tue" });
    expect(validateWeek(week({ thu: { open: true, from: "", to: "17:00" } }))).toEqual({ code: "time", day: "thu" });
    expect(validateWeek(week({ sun: { open: false, from: "", to: "" } }))).toBeNull();
  });

  it("describes hours in the reader's language and keeps old free text intact", () => {
    expect(summarizeWeek(defaultWeek(), short, "Fermé")).toEqual(["Lun–Sam  08:00 – 19:00", "Dim  Fermé"]);
    expect(describeStoredHours("Mon-Sat 08:00-19:00; Sun closed", short, "Fermé")).toBe("Lun–Sam  08:00 – 19:00\nDim  Fermé");
    expect(describeStoredHours("Lun–Sam : 7h–20h", short, "Fermé")).toBe("Lun–Sam : 7h–20h");
  });
});
