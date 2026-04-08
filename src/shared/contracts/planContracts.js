import { createClientId } from '../utils/createClientId.js'

const LEGACY_MONTH_INDEX = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
}

function normalizeComment(comment = {}) {
  return {
    id: comment.id ?? createClientId('comment'),
    author: comment.author ?? '',
    text: comment.text ?? '',
    time: comment.time ?? '',
  }
}

function extractDayFromDueDate(value = '') {
  const match = value.match(/(\d{1,2})$/)
  return match ? Number(match[1]) : null
}

function formatScheduleDateValue(day, month, year = 26) {
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${String(year).padStart(2, '0')}`
}

function deriveLegacyScheduleFromDueDate(fallbackDueDate = '') {
  const normalizedDueDate = fallbackDueDate.trim()

  if (!normalizedDueDate) {
    return {
      selectedCalendarDay: 7,
      dueDateValue: '07/04/26',
      displayLabel: '',
      preserveDisplayLabel: false,
    }
  }

  if (normalizedDueDate.toLowerCase() === 'today') {
    const today = new Date()

    return {
      selectedCalendarDay: today.getDate(),
      dueDateValue: formatScheduleDateValue(today.getDate(), today.getMonth() + 1, today.getFullYear() % 100),
      displayLabel: normalizedDueDate,
      preserveDisplayLabel: true,
    }
  }

  const monthDayMatch = normalizedDueDate.match(/^([A-Za-z]{3})\s+(\d{1,2})$/)

  if (monthDayMatch) {
    const [, monthLabel, dayValue] = monthDayMatch
    const month = LEGACY_MONTH_INDEX[monthLabel.toLowerCase()]
    const day = Number(dayValue)

    if (month && Number.isFinite(day)) {
      return {
        selectedCalendarDay: day,
        dueDateValue: formatScheduleDateValue(day, month),
        displayLabel: normalizedDueDate,
        preserveDisplayLabel: false,
      }
    }
  }

  const fallbackDay = extractDayFromDueDate(normalizedDueDate)

  return {
    selectedCalendarDay: fallbackDay ?? 7,
    dueDateValue: '07/04/26',
    displayLabel: normalizedDueDate,
    preserveDisplayLabel: false,
  }
}

function normalizeBoardCardSchedule(schedule = {}, fallbackDueDate = '') {
  const legacySchedule = deriveLegacyScheduleFromDueDate(fallbackDueDate)

  return {
    selectedCalendarDay: Number.isFinite(schedule.selectedCalendarDay)
      ? schedule.selectedCalendarDay
      : legacySchedule.selectedCalendarDay,
    startEnabled: Boolean(schedule.startEnabled),
    startDateValue: schedule.startDateValue ?? '',
    dueEnabled: typeof schedule.dueEnabled === 'boolean' ? schedule.dueEnabled : true,
    dueDateValue: schedule.dueDateValue ?? legacySchedule.dueDateValue,
    dueTimeValue: schedule.dueTimeValue ?? '16:21',
    recurringValue: schedule.recurringValue ?? 'Nunca',
    reminderValue: schedule.reminderValue ?? '1 dia antes',
    displayLabel: schedule.displayLabel ?? legacySchedule.displayLabel,
    preserveDisplayLabel: typeof schedule.preserveDisplayLabel === 'boolean'
      ? schedule.preserveDisplayLabel
      : legacySchedule.preserveDisplayLabel,
  }
}

function normalizeBoardCard(card = {}) {
  return {
    id: card.id ?? createClientId('card'),
    title: card.title ?? 'Untitled card',
    description: card.description ?? '',
    labelId: card.labelId ?? '',
    memberIds: Array.isArray(card.memberIds) ? card.memberIds.filter(Boolean) : [],
    dueDate: card.dueDate ?? '',
    schedule: normalizeBoardCardSchedule(card.schedule, card.dueDate),
    comments: Array.isArray(card.comments) ? card.comments.map(normalizeComment) : [],
  }
}

function normalizeBoardColumn(column = {}) {
  return {
    id: column.id ?? createClientId('col'),
    title: column.title ?? 'Untitled list',
    color: column.color ?? '#a0a0a0',
    cards: Array.isArray(column.cards) ? column.cards.map(normalizeBoardCard) : [],
  }
}

function normalizeCanvasCard(card = {}) {
  return {
    id: card.id ?? createClientId('canvas-card'),
    x: Number.isFinite(card.x) ? card.x : 0,
    y: Number.isFinite(card.y) ? card.y : 0,
    h: Number.isFinite(card.h) ? card.h : 130,
    title: card.title ?? 'Untitled card',
    content: card.content ?? '',
    colorId: card.colorId ?? 'stone',
  }
}

function normalizeCanvasConnection(connection = {}) {
  return {
    id: connection.id ?? createClientId('canvas-conn'),
    from: connection.from ?? '',
    to: connection.to ?? '',
  }
}

export function normalizeCanvasState(canvasState = {}) {
  return {
    cards: Array.isArray(canvasState.cards) ? canvasState.cards.map(normalizeCanvasCard) : [],
    connections: Array.isArray(canvasState.connections) ? canvasState.connections.map(normalizeCanvasConnection) : [],
    pan: {
      x: Number.isFinite(canvasState.pan?.x) ? canvasState.pan.x : 0,
      y: Number.isFinite(canvasState.pan?.y) ? canvasState.pan.y : 0,
    },
    zoom: Number.isFinite(canvasState.zoom) ? canvasState.zoom : 1,
  }
}

export function normalizePlanRecord(plan = {}) {
  return {
    id: plan.id ?? createClientId('plan'),
    name: plan.name ?? 'Untitled plan',
    description: plan.description ?? '',
    tag: plan.tag ?? 'General',
    tagColor: plan.tagColor ?? '#a0a0a0',
    members: Array.isArray(plan.members) ? plan.members.filter(Boolean) : [],
    date: plan.date ?? '',
    tasks: Number.isFinite(plan.tasks) ? plan.tasks : 0,
    cover: plan.cover ?? '#f5f5f5',
    boardColumns: Array.isArray(plan.boardColumns) ? plan.boardColumns.map(normalizeBoardColumn) : [],
    canvasState: normalizeCanvasState(plan.canvasState),
  }
}
