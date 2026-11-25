/** Date helpers for Search Console ranges. All dates are "YYYY-MM-DD" in UTC (Search Console reports in Pacific time,
 * but a one-day shift at the edges does not matter for ranges of weeks). Pure: safe to unit test. */

export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return isoDay(d)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

/** Search Console keeps 16 months of data. */
export const MAX_HISTORY_DAYS = 486

/** The window to sync: the last `days` days up to today (Google fills the most recent 2-3 days over time). */
export function syncRange(days: number, today: string = isoDay(new Date())): { from: string; to: string } {
  const span = Math.max(1, Math.min(MAX_HISTORY_DAYS, Math.floor(days)))
  return { from: addDays(today, -(span - 1)), to: today }
}

/** Splits [from, to] into windows of at most `size` days, newest first, so a partial sync keeps the freshest data. */
export function windows(from: string, to: string, size: number): { from: string; to: string }[] {
  const out: { from: string; to: string }[] = []
  let end = to
  while (daysBetween(from, end) >= 0) {
    const start = daysBetween(from, end) + 1 > size ? addDays(end, -(size - 1)) : from
    out.push({ from: start, to: end })
    end = addDays(start, -1)
  }
  return out
}

/** A report period ending at the latest synced day: the last `days` days and the same length just before. */
export function comparePeriods(latest: string, days: number) {
  const span = Math.max(1, Math.min(MAX_HISTORY_DAYS, Math.floor(days)))
  const current = { from: addDays(latest, -(span - 1)), to: latest }
  const previous = { from: addDays(current.from, -span), to: addDays(current.from, -1) }
  return { current, previous }
}
