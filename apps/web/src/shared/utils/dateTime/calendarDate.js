export function createCalendarDate(year, month, day) {
  return new Date(Date.UTC(year, month, day, 12, 0, 0, 0))
}

export function yearOf(date) {
  return date.getUTCFullYear()
}

export function monthOf(date) {
  return date.getUTCMonth()
}

export function dayOfMonth(date) {
  return date.getUTCDate()
}

export function weekdayOf(date) {
  return date.getUTCDay()
}

export function utcCalendarDateKey(date) {
  return `${yearOf(date)}-${String(monthOf(date) + 1).padStart(2, '0')}-${String(dayOfMonth(date)).padStart(2, '0')}`
}

export function dateFromKey(value) {
  if (!value || typeof value !== 'string') return null
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const [, yearValue, monthValue, dayValue] = match
  return createCalendarDate(Number(yearValue), Number(monthValue) - 1, Number(dayValue))
}

export function isSameDate(a, b) {
  return utcCalendarDateKey(a) === utcCalendarDateKey(b)
}

export function daysInMonth(date) {
  return new Date(Date.UTC(yearOf(date), monthOf(date) + 1, 0, 12, 0, 0, 0)).getUTCDate()
}
