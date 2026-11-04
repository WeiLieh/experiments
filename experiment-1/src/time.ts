// =============================================================================
// experiment-1/src/time.ts: Singapore time helpers
//
// Why: computers count time in UTC (London winter time), but every day, Nudge
// time and midnight in this experiment is Singapore time (UTC+8, all year, no
// daylight saving). These helpers do the conversion in one place.
// =============================================================================

const SINGAPORE_OFFSET_MS = 8 * 60 * 60 * 1000; // 8 hours ahead of UTC
const MINUTE_MS = 60 * 1000;

// The Singapore date of a moment, as "YYYY-MM-DD".
export function sgtDay(moment: Date): string {
  return new Date(moment.getTime() + SINGAPORE_OFFSET_MS).toISOString().slice(0, 10);
}

// A date some days later (or earlier, if negative), as "YYYY-MM-DD".
export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// The moment it is "HH:MM" on a Singapore date, e.g. atSgt("2026-11-09", "07:00").
export function atSgt(day: string, time: string): Date {
  return new Date(`${day}T${time}:00+08:00`);
}

// Minutes between two moments (can include fractions of a minute).
export function minutesBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / MINUTE_MS;
}

// "07:00" -> "7:00 am", "21:00" -> "9:00 pm", for messages.
export function formatTime(time: string): string {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}
