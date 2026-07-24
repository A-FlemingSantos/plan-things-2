import { parseBrazilDateToCalendarDate } from '../../../../../shared/components/Calendar/calendarDateUtils.js'

export const CARD_SCHEDULE_TIME_SLOT_STEP_MINUTES = 15

export function buildCardScheduleTimeSlots(stepMinutes = CARD_SCHEDULE_TIME_SLOT_STEP_MINUTES) {
  const slots = []
  const safeStep = Number.isFinite(stepMinutes) && stepMinutes > 0 ? stepMinutes : 15

  for (let minutes = 0; minutes < 24 * 60; minutes += safeStep) {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
  }

  return slots
}

export function normalizeCardScheduleTimeValue(value = '', fallback = '09:00') {
  const match = String(value).trim().match(/^(\d{1,2}):(\d{1,2})$/)

  if (!match) {
    return fallback
  }

  const hour = Number(match[1])
  const minute = Number(match[2])

  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return fallback
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function snapCardScheduleTimeToSlot(
  value = '',
  {
    stepMinutes = CARD_SCHEDULE_TIME_SLOT_STEP_MINUTES,
    fallback = '09:00',
  } = {},
) {
  const normalized = normalizeCardScheduleTimeValue(value, fallback)
  const [hourValue, minuteValue] = normalized.split(':').map(Number)
  const totalMinutes = hourValue * 60 + minuteValue
  const safeStep = Number.isFinite(stepMinutes) && stepMinutes > 0 ? stepMinutes : 15
  const snappedMinutes = Math.round(totalMinutes / safeStep) * safeStep
  const clampedMinutes = Math.min(Math.max(snappedMinutes, 0), 24 * 60 - safeStep)
  const hour = Math.floor(clampedMinutes / 60)
  const minute = clampedMinutes % 60

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function formatScheduleDatePart(calendarDate) {
  if (!calendarDate) return ''

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const label = formatter.format(new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatScheduleShortDate(calendarDate) {
  if (!calendarDate) return ''

  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
  }).format(new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day))
}

export function formatCardScheduleSummary({
  startDateValue = '',
  dueDateValue = '',
  dueTimeValue = '',
  startEnabled = false,
} = {}) {
  const dueDate = parseBrazilDateToCalendarDate(dueDateValue)
  const startDate = parseBrazilDateToCalendarDate(startDateValue)
  const time = normalizeCardScheduleTimeValue(dueTimeValue, '')

  if (!dueDate || !time) {
    return 'Selecione uma data e um horário para confirmar.'
  }

  if (startEnabled && startDate && startDate.compare(dueDate) !== 0) {
    return `Agendado de ${formatScheduleShortDate(startDate)} a ${formatScheduleShortDate(dueDate)} às ${time}.`
  }

  return `Agendado para ${formatScheduleDatePart(dueDate)} às ${time}.`
}
