export const DEFAULT_TIME_ZONE = 'America/Sao_Paulo'
export const DEFAULT_LOCALE = 'pt-BR'

export function toDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function normalizeTimeZone(value) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) return DEFAULT_TIME_ZONE

  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: normalized }).resolvedOptions().timeZone
  } catch {
    return DEFAULT_TIME_ZONE
  }
}

export function shortMonthLabel(date, locale = DEFAULT_LOCALE) {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  })
    .format(date)
    .replace('.', '')
    .toLowerCase()
}

function normalizeShortMonthLabel(value) {
  return String(value ?? '').replace('.', '').trim().toLowerCase()
}

function parseTimeValue(value, fallback = '09:00') {
  const [hoursRaw = '09', minutesRaw = '00'] = String(value || fallback).split(':')
  const hours = Number.parseInt(hoursRaw, 10)
  const minutes = Number.parseInt(minutesRaw, 10)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return parseTimeValue(fallback, '09:00')
  }

  return {
    hours: Math.max(0, Math.min(23, hours)),
    minutes: Math.max(0, Math.min(59, minutes)),
  }
}

function parseDateValue(value, preferredFormat = 'dd/MM/yyyy') {
  if (!value || typeof value !== 'string') return null
  const normalized = value.trim()
  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return { year: Number(year), month: Number(month), day: Number(day) }
  }

  const slashMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!slashMatch) return null

  const first = Number(slashMatch[1])
  const second = Number(slashMatch[2])
  const rawYear = slashMatch[3]
  let year = Number(rawYear)
  if (rawYear.length === 2) year += 2000

  let day = first
  let month = second

  if (preferredFormat === 'MM/dd/yyyy') {
    day = second
    month = first
  } else if (first <= 12 && second > 12) {
    day = second
    month = first
  }

  const valid = (candidateDay, candidateMonth) => (
    candidateMonth >= 1 && candidateMonth <= 12 && candidateDay >= 1 && candidateDay <= 31
  )

  if (!valid(day, month)) {
    const swappedDay = month
    const swappedMonth = day
    if (!valid(swappedDay, swappedMonth)) return null
    day = swappedDay
    month = swappedMonth
  }

  return { year, month, day }
}

function zonedPartsFromDate(date, timeZone, locale = 'en-CA') {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const partByType = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return {
    year: Number(partByType.year),
    month: Number(partByType.month),
    day: Number(partByType.day),
    hour: Number(partByType.hour),
    minute: Number(partByType.minute),
    second: Number(partByType.second),
  }
}

function zoneOffsetMinutesAt(instantMs, timeZone) {
  const parts = zonedPartsFromDate(new Date(instantMs), timeZone)
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  return Math.round((asUtc - instantMs) / 60000)
}

function resolveInstantMsForZonedDateTime(dateParts, timeParts, timeZone) {
  const desiredUtc = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, timeParts.hours, timeParts.minutes, 0, 0)
  let instant = desiredUtc

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const zoned = zonedPartsFromDate(new Date(instant), timeZone)
    const currentUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second, 0)
    const delta = desiredUtc - currentUtc
    instant += delta
    if (delta === 0) break
  }

  return instant
}

function formatOffset(offsetMinutes) {
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absolute = Math.abs(offsetMinutes)
  const hours = Math.floor(absolute / 60)
  const minutes = absolute % 60
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function toDateKeyByTimeZone(value, timeZone = DEFAULT_TIME_ZONE) {
  const date = toDate(value)
  if (!date) return null
  const parts = zonedPartsFromDate(date, normalizeTimeZone(timeZone))
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

export function createOffsetDateTime(dateValue, timeValue = '09:00', options = {}) {
  const preferredDateFormat = options.dateFormat ?? 'dd/MM/yyyy'
  const parsedDate = parseDateValue(dateValue, preferredDateFormat)
  if (!parsedDate) return null
  const parsedTime = parseTimeValue(timeValue)
  const timeZone = normalizeTimeZone(options.timeZone)
  const instantMs = resolveInstantMsForZonedDateTime(parsedDate, parsedTime, timeZone)
  const offsetMinutes = zoneOffsetMinutesAt(instantMs, timeZone)

  return `${String(parsedDate.year).padStart(4, '0')}-${String(parsedDate.month).padStart(2, '0')}-${String(parsedDate.day).padStart(2, '0')}T${String(parsedTime.hours).padStart(2, '0')}:${String(parsedTime.minutes).padStart(2, '0')}:00${formatOffset(offsetMinutes)}`
}

export function formatDateInputFromIso(value, options = {}) {
  const dateKey = toDateKeyByTimeZone(value, options.timeZone)
  if (!dateKey) return ''
  const [year, month, day] = dateKey.split('-')
  const dateFormat = options.dateFormat ?? 'dd/MM/yyyy'

  if (dateFormat === 'MM/dd/yyyy') return `${month}/${day}/${year}`
  if (dateFormat === 'yyyy-MM-dd') return `${year}-${month}-${day}`
  return `${day}/${month}/${year}`
}

export function formatTimeInputFromIso(value, options = {}) {
  const date = toDate(value)
  if (!date) return '09:00'
  const timeZone = normalizeTimeZone(options.timeZone)
  const { hour, minute } = zonedPartsFromDate(date, timeZone)
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function formatCompactDayMonthFromIso(value, options = {}) {
  const date = toDate(value)
  if (!date) return ''
  const locale = options.locale ?? DEFAULT_LOCALE
  const timeZone = normalizeTimeZone(options.timeZone)
  const parts = new Intl.DateTimeFormat(locale, { timeZone, day: 'numeric', month: 'short' }).formatToParts(date)
  const partByType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const day = partByType.day ?? ''
  const month = normalizeShortMonthLabel(partByType.month ?? '')
  return `${day} ${month}`.trim()
}

function dayOfMonthFromDateKey(dateKey) {
  if (!dateKey || typeof dateKey !== 'string') return null
  const [, , day] = dateKey.split('-')
  const numeric = Number(day)
  return Number.isFinite(numeric) ? numeric : null
}

export function selectedDayFromSchedule(startAt, dueAt, options = {}) {
  const timeZone = normalizeTimeZone(options.timeZone)
  const dueDateKey = toDateKeyByTimeZone(dueAt?.iso, timeZone)
  const startDateKey = toDateKeyByTimeZone(startAt?.iso, timeZone)
  return dayOfMonthFromDateKey(dueDateKey ?? startDateKey) ?? 7
}

export function formatCardDueLabel(dueAt, options = {}) {
  const timeZone = normalizeTimeZone(options.timeZone)
  const dueDateKey = toDateKeyByTimeZone(dueAt?.iso, timeZone)
  if (!dueDateKey) return ''

  const todayDateKey = toDateKeyByTimeZone(new Date(), timeZone)
  if (todayDateKey && todayDateKey === dueDateKey) return 'Hoje'

  return formatCompactDayMonthFromIso(dueAt?.iso, options)
}
