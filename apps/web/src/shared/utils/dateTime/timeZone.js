import { createCalendarDate, dateFromKey } from './calendarDate.js'
import { dateKeyFromTimeZoneInstant } from './dateKeys.js'

export function currentDateInTimeZone(timeZone) {
  const key = dateKeyFromTimeZoneInstant(new Date(), timeZone)
  if (key) {
    const parsed = dateFromKey(key)
    if (parsed) return parsed
  }

  const fallback = new Date()
  return createCalendarDate(
    fallback.getUTCFullYear(),
    fallback.getUTCMonth(),
    fallback.getUTCDate(),
  )
}
