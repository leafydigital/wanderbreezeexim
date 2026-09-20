/** Formats a date as DD.MM.YYYY (matches the client's requested style). */
export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

/** Formats a date+time as DD.MM.YYYY hh:mm AM/PM (matches "19.09.2026 01:00 PM"). */
export function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  let hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  const hh = String(hours).padStart(2, '0')
  return `${dd}.${mm}.${yyyy} ${hh}:${minutes} ${ampm}`
}

/** Converts a Date to the value string a <input type="datetime-local"> expects, in local time. */
export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * WBE Fresh "valid till" rule: prices are valid until the next 12:00 PM
 * cutoff. If a price is updated before noon, it's valid till noon THE SAME
 * day. If updated at/after noon, it's valid till noon the NEXT day. This
 * way, a same-day-morning re-update never pushes the deadline out further.
 */
export function nextNoonCutoff(from: Date = new Date()): Date {
  const cutoff = new Date(from)
  cutoff.setHours(12, 0, 0, 0)
  if (from.getTime() >= cutoff.getTime()) {
    cutoff.setDate(cutoff.getDate() + 1)
  }
  return cutoff
}