import {
  addDays,
  startOfWeek,
  startOfWorkWeek,
} from './dateArithmetic.js'
import {
  createCalendarDate,
  dayOfMonth,
  monthOf,
  yearOf,
} from './calendarDate.js'

export function capitalizeFirst(value) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function normalizeShortMonthLabel(value) {
  return value.replace('.', '').trim().toLowerCase()
}

export function buildWeekdayLabels(locale, _timeZone, width = 'long') {
  const firstSunday = createCalendarDate(2026, 0, 4)
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(firstSunday, index)
    return capitalizeFirst(new Intl.DateTimeFormat(locale, {
      weekday: width,
      timeZone: 'UTC',
    }).format(date))
  })
}

export function formatCellLabel(date, muted, locale, timeZone) {
  if (dayOfMonth(date) === 1) {
    const shortMonth = normalizeShortMonthLabel(new Intl.DateTimeFormat(locale, {
      month: 'short',
      timeZone: 'UTC',
    }).format(date))
    return muted ? `${shortMonth} ${dayOfMonth(date)}` : `${dayOfMonth(date)}`
  }

  return String(dayOfMonth(date)).padStart(2, '0')
}

export function formatLongDate(date, locale, timeZone) {
  return capitalizeFirst(new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(date))
}

export function formatShortDate(date, locale, timeZone) {
  const day = new Intl.DateTimeFormat(locale, { day: 'numeric', timeZone }).format(date)
  const shortMonth = normalizeShortMonthLabel(new Intl.DateTimeFormat(locale, {
    month: 'short',
    timeZone,
  }).format(date))

  return `${day} ${shortMonth}`
}

export function formatRangeLabel(view, selectedDate, visibleMonth, locale, timeZone) {
  if (view === 'month') {
    return capitalizeFirst(new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
      timeZone,
    }).format(visibleMonth))
  }

  if (view === 'day') {
    return formatLongDate(selectedDate, locale, timeZone)
  }

  const start = view === 'work' ? startOfWorkWeek(selectedDate) : startOfWeek(selectedDate)
  const end = addDays(start, view === 'work' ? 4 : 6)

  if (monthOf(start) === monthOf(end) && yearOf(start) === yearOf(end)) {
    const monthLabel = normalizeShortMonthLabel(new Intl.DateTimeFormat(locale, {
      month: 'short',
      timeZone: 'UTC',
    }).format(start))
    return `${dayOfMonth(start)}-${dayOfMonth(end)} ${monthLabel} ${yearOf(start)}`
  }

  return `${formatShortDate(start, locale, timeZone)} - ${formatShortDate(end, locale, timeZone)} ${yearOf(end)}`
}
