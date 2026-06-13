import { CalendarDate } from '@internationalized/date'

export function parseBrazilDateToCalendarDate(value = '') {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)

  if (!match) {
    return null
  }

  const [, dayValue, monthValue, yearValue] = match
  const year = yearValue.length === 2 ? 2000 + Number(yearValue) : Number(yearValue)

  return new CalendarDate(year, Number(monthValue), Number(dayValue))
}

export function formatCalendarDateToBrazil(date) {
  if (!date) return ''

  const day = String(date.day).padStart(2, '0')
  const month = String(date.month).padStart(2, '0')

  return `${day}/${month}/${date.year}`
}

export function buildBrazilDateRange(startValue = '', endValue = '') {
  const start = parseBrazilDateToCalendarDate(startValue)
  const end = parseBrazilDateToCalendarDate(endValue)

  if (start && end) {
    return { start, end }
  }

  if (end) {
    return { start: end, end }
  }

  if (start) {
    return { start, end: start }
  }

  return null
}
