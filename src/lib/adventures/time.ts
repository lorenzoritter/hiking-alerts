import { formatInTimeZone, getTimezoneOffset } from "date-fns-tz";

export function isValidTimeZone(timezone: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

export function parseLocalDateTime(value: string, timezone: string) {
  if (!isValidTimeZone(timezone)) return null;
  const wallClock = new Date(`${value}:00.000Z`);
  if (Number.isNaN(wallClock.getTime())) return null;

  // Check offsets around the requested wall time. One matching instant is
  // valid; zero means a DST gap, and two means an ambiguous fall-back time.
  const offsets = new Set([
    getTimezoneOffset(timezone, new Date(wallClock.getTime() - 2 * 86400000)),
    getTimezoneOffset(timezone, wallClock),
    getTimezoneOffset(timezone, new Date(wallClock.getTime() + 2 * 86400000)),
  ]);
  const candidates = [...offsets]
    .map((offset) => new Date(wallClock.getTime() - offset))
    .filter((date) => formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm") === value);

  return candidates.length === 1 ? candidates[0] : null;
}
