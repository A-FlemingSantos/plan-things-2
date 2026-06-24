export function dateKeyFromTimeZoneInstant(value, timeZone) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const partByType = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).map((part) => [part.type, part.value]))

  const year = partByType.year
  const month = partByType.month
  const day = partByType.day
  if (!year || !month || !day) return null
  return `${year}-${month}-${day}`
}

export function localWallDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function addDaysToDateKey(dateKeyValue, days) {
  if (!dateKeyValue) return null
  const [year, month, day] = dateKeyValue.split('-').map(Number)
  if (![year, month, day].every(Number.isFinite)) return null
  const utc = Date.UTC(year, month - 1, day + days, 12, 0, 0, 0)
  const date = new Date(utc)
  return localWallDateKey(date)
}
