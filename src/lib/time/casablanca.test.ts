import { describe, expect, it } from "vitest";
import { getCasablancaQuickPickupRanges, utcToCasablancaLocal } from "@/lib/time/casablanca";

describe("Casablanca quick pickup ranges", () => {
  it("produces UTC ranges for now, tonight and tomorrow using Casablanca local time", () => {
    const now = new Date("2026-11-07T12:00:00.000Z");
    const ranges = getCasablancaQuickPickupRanges(now);
    const localNow = utcToCasablancaLocal(now.toISOString());
    const tomorrow = new Date(`${localNow.slice(0, 10)}T00:00:00.000Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowDate = `${tomorrow.getUTCFullYear()}-${String(tomorrow.getUTCMonth() + 1).padStart(2, "0")}-${String(tomorrow.getUTCDate()).padStart(2, "0")}`;

    expect(utcToCasablancaLocal(ranges.now.from)).toBe(localNow);
    expect(Date.parse(ranges.now.to) - Date.parse(ranges.now.from)).toBe(120 * 60 * 1000);
    expect(utcToCasablancaLocal(ranges.tonight.from).slice(0, 10)).toBe(localNow.slice(0, 10));
    expect(utcToCasablancaLocal(ranges.tonight.to)).toBe(`${localNow.slice(0, 10)}T23:59`);
    expect(utcToCasablancaLocal(ranges.tomorrow.from)).toBe(`${tomorrowDate}T00:00`);
    expect(utcToCasablancaLocal(ranges.tomorrow.to)).toBe(`${tomorrowDate}T23:59`);
  });
});
