export function parseBrazilDateToCalendarDate(value = '') {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)

  if (!match) {
    return null
  }

  const [, dayValue, monthValue, yearValue] = match
  const year = yearValue.length === 2 ? 2000 + Number(yearValue) : Number(yearValue)

  return {
    year,
    month: Number(monthValue),
    day: Number(dayValue),
  }
}

export function formatCalendarDateToBrazil(date) {
  if (!date) return ''

  const day = String(date.day).padStart(2, '0')
  const month = String(date.month).padStart(2, '0')

  return `${day}/${month}/${date.year}`
}

export function compareCalendarDates(left, right) {
  if (!left || !right) return 0
  if (left.year !== right.year) return left.year - right.year
  if (left.month !== right.month) return left.month - right.month
  return left.day - right.day
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

export function isSameCalendarDate(left, right) {
  if (!left || !right) return false
  return compareCalendarDates(left, right) === 0
}

export function resolveCardScheduleFromRange(range) {
  if (!range?.start || !range?.end) {
    return null
  }

  const dueDateValue = formatCalendarDateToBrazil(range.end)
  const isSingleDueDate = isSameCalendarDate(range.start, range.end)

  if (isSingleDueDate) {
    return {
      startEnabled: false,
      startDateValue: '',
      dueEnabled: true,
      dueDateValue,
      selectedCalendarDay: range.end.day,
    }
  }

  return {
    startEnabled: true,
    startDateValue: formatCalendarDateToBrazil(range.start),
    dueEnabled: true,
    dueDateValue,
    selectedCalendarDay: range.end.day,
  }
}

export function calendarDateFromDate(date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  }
}

export function calendarDateToDate({ year, month, day }) {
  return new Date(year, month - 1, day)
}

export function isTodayCalendarDate(date) {
  const today = calendarDateFromDate(new Date())
  return isSameCalendarDate(date, today)
}

export function addMonths(baseDate, delta) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth() + delta, 1)
}

export function buildMonthGrid(visibleMonth) {
  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDate = new Date(year, month, 1 - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(startDate)
    current.setDate(startDate.getDate() + index)

    return {
      date: calendarDateFromDate(current),
      outsideMonth: current.getMonth() !== month,
    }
  })
}

export function formatCalendarMonthLabel(baseDate) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(baseDate)
}

const WEEKDAY_ANCHOR = new Date(2024, 0, 7)

export function getWeekdayLabels() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(WEEKDAY_ANCHOR)
    date.setDate(WEEKDAY_ANCHOR.getDate() + index)
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'narrow' }).format(date)
  })
}
