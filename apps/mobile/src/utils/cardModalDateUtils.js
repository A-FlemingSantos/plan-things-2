export const DEFAULT_CARD_SCHEDULE = {
  selectedCalendarDay: 7,
  startEnabled: false,
  startDateValue: '',
  dueEnabled: true,
  dueDateValue: '07/04/26',
  dueTimeValue: '16:21',
  displayLabel: '',
  preserveDisplayLabel: false,
}

const MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function extractDayFromDisplayLabel(value = '') {
  const match = value.match(/(?:^|\s)(\d{1,2})(?:\s|$)/)
  return match ? Number(match[1]) : null
}

export function formatDueDateLabelFromValue(dateValue, fallbackDay) {
  const match = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)

  if (!match) {
    return fallbackDay ? `${fallbackDay} abr` : ''
  }

  const [, dayValue, monthValue] = match
  const day = Number(dayValue)
  const monthIndex = Number(monthValue) - 1
  const monthLabel = MONTH_LABELS[monthIndex] ?? 'abr'

  return `${day} ${monthLabel}`
}

export function buildInitialCardSchedule(card) {
  const schedule = card.schedule ?? {}
  const fallbackDay = extractDayFromDisplayLabel(schedule.displayLabel ?? card.dueDate) ?? DEFAULT_CARD_SCHEDULE.selectedCalendarDay

  return {
    selectedCalendarDay: Number.isFinite(schedule.selectedCalendarDay)
      ? schedule.selectedCalendarDay
      : fallbackDay,
    startEnabled: typeof schedule.startEnabled === 'boolean'
      ? schedule.startEnabled
      : DEFAULT_CARD_SCHEDULE.startEnabled,
    startDateValue: schedule.startDateValue ?? DEFAULT_CARD_SCHEDULE.startDateValue,
    dueEnabled: typeof schedule.dueEnabled === 'boolean'
      ? schedule.dueEnabled
      : DEFAULT_CARD_SCHEDULE.dueEnabled,
    dueDateValue: schedule.dueDateValue ?? DEFAULT_CARD_SCHEDULE.dueDateValue,
    dueTimeValue: schedule.dueTimeValue ?? DEFAULT_CARD_SCHEDULE.dueTimeValue,
    displayLabel: schedule.displayLabel ?? card.dueDate ?? DEFAULT_CARD_SCHEDULE.displayLabel,
    preserveDisplayLabel: typeof schedule.preserveDisplayLabel === 'boolean'
      ? schedule.preserveDisplayLabel
      : DEFAULT_CARD_SCHEDULE.preserveDisplayLabel,
  }
}

export function buildCardSchedulePatch(resolvedSchedule, previousSchedule = {}) {
  const {
    startEnabled,
    startDateValue,
    dueEnabled,
    dueDateValue,
    selectedCalendarDay,
  } = resolvedSchedule

  const shouldPreserveDisplayLabel =
    previousSchedule.dueEnabled
    && previousSchedule.preserveDisplayLabel
    && dueDateValue === previousSchedule.dueDateValue
    && selectedCalendarDay === previousSchedule.selectedCalendarDay

  const nextDueDate = formatDueDateLabelFromValue(dueDateValue, selectedCalendarDay)

  return {
    dueDate: nextDueDate,
    schedule: {
      selectedCalendarDay,
      startEnabled,
      startDateValue,
      dueEnabled,
      dueDateValue,
      dueTimeValue: previousSchedule.dueTimeValue ?? '',
      displayLabel: nextDueDate,
      preserveDisplayLabel: shouldPreserveDisplayLabel,
    },
  }
}
