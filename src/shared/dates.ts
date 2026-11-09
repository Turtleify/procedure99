/** Local-time calendar helpers. Dates are "YYYY-MM-DD" strings. */

export function dateStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return dateStr(d)
}

/** Whole calendar days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number)
  const [y2, m2, d2] = b.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000)
}

export function minutesOf(hhmm: string): number {
  const [h, m] = (hhmm || '19:00').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
