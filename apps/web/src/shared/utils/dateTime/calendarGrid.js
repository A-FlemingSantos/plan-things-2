import { addDays, startOfMonth } from './dateArithmetic.js'
import {
  monthOf,
  utcCalendarDateKey,
  weekdayOf,
} from './calendarDate.js'

export function buildMonthCells(monthDate) {
  const first = startOfMonth(monthDate)
  const gridStart = addDays(first, -weekdayOf(first))

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index)
    return {
      date,
      key: utcCalendarDateKey(date),
      muted: monthOf(date) !== monthOf(monthDate),
    }
  })
}

export function buildRangeDays(startDate, length) {
  return Array.from({ length }, (_, index) => {
    const date = addDays(startDate, index)
    return {
      date,
      key: utcCalendarDateKey(date),
    }
  })
}
