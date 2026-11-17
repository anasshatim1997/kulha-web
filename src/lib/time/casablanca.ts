const zone = "Africa/Casablanca";

function parts(date: Date) {
  const values = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(values.map(part => [part.type, part.value]));
}

export function utcToCasablancaLocal(value: string) {
  const p = parts(new Date(value));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function casablancaLocalToUtc(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Invalid Casablanca pickup date/time.");
  const [, year, month, day, hour, minute] = match;
  const target = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  let timestamp = target;
  for (let i = 0; i < 3; i++) {
    const p = parts(new Date(timestamp));
    const represented = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
    timestamp += target - represented;
  }
  return new Date(timestamp).toISOString();
}

function shiftLocalMinutes(value: string, minutes: number): string {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day, hour, minute + minutes));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}T${String(shifted.getUTCHours()).padStart(2, "0")}:${String(shifted.getUTCMinutes()).padStart(2, "0")}`;
}

export function getCasablancaQuickPickupRanges(now = new Date()) {
  const localNow = utcToCasablancaLocal(now.toISOString());
  const today = localNow.slice(0, 10);
  const tomorrowDate = shiftLocalMinutes(`${today}T00:00`, 24 * 60).slice(0, 10);
  const tonightStart = localNow.slice(11) >= "18:00" ? localNow : `${today}T18:00`;
  const ranges = {
    now: { from: localNow, to: shiftLocalMinutes(localNow, 120) },
    tonight: { from: tonightStart, to: `${today}T23:59` },
    tomorrow: { from: `${tomorrowDate}T00:00`, to: `${tomorrowDate}T23:59` },
  };
  return Object.fromEntries(Object.entries(ranges).map(([key, range]) => [key, {
    from: casablancaLocalToUtc(range.from),
    to: casablancaLocalToUtc(range.to),
  }])) as Record<keyof typeof ranges, { from: string; to: string }>;
}
