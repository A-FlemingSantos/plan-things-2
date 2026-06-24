import {
  createCalendarDate,
  dayOfMonth,
  daysInMonth,
  monthOf,
  weekdayOf,
  yearOf,
} from './calendarDate.js'

export function startOfMonth(date) {
  return createCalendarDate(yearOf(date), monthOf(date), 1)
}

export function addDays(date, amount) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + amount)
  return next
}

export function addMonths(date, amount) {
  return createCalendarDate(yearOf(date), monthOf(date) + amount, 1)
}

export function startOfWeek(date) {
  return addDays(date, -weekdayOf(date))
}

export function startOfWorkWeek(date) {
  const weekDay = weekdayOf(date)
  return addDays(date, weekDay === 0 ? -6 : 1 - weekDay)
}

export function clampDateToMonth(date, monthDate) {
  return createCalendarDate(
    yearOf(monthDate),
    monthOf(monthDate),
    Math.min(dayOfMonth(date), daysInMonth(monthDate)),
  )
}
