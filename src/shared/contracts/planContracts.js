import { createClientId } from '../utils/createClientId.js'

const LEGACY_MONTH_INDEX = {
  jan: 1,
  fev: 2,
  feb: 2,
  mar: 3,
  abr: 4,
  apr: 4,
  mai: 5,
  may: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  aug: 8,
  set: 9,
  sep: 9,
  out: 10,
  oct: 10,
  nov: 11,
  dez: 12,
  dec: 12,
}

const MONTH_LABELS_PT_BR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function normalizeComment(comment = {}) {
  return {
    id: comment.id ?? createClientId('comment'),
    author: comment.author ?? '',
    text: comment.text ?? '',
    time: comment.time ?? '',
  }
}

function extractDayFromDueDate(value = '') {
  const match = value.match(/(?:^|\s)(\d{1,2})(?:\s|$)/)
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

  const normalizedLowerDueDate = normalizedDueDate.toLowerCase()

  if (normalizedLowerDueDate === 'today' || normalizedLowerDueDate === 'hoje') {
    const today = new Date()

    return {
      selectedCalendarDay: today.getDate(),
      dueDateValue: formatScheduleDateValue(today.getDate(), today.getMonth() + 1, today.getFullYear() % 100),
      displayLabel: 'Hoje',
      preserveDisplayLabel: true,
    }
  }

  const monthDayMatch = normalizedDueDate.match(/^([A-Za-zÀ-ÿ]{3})\s+(\d{1,2})$/)

  if (monthDayMatch) {
    const [, monthLabel, dayValue] = monthDayMatch
    const month = LEGACY_MONTH_INDEX[monthLabel.toLowerCase()]
    const day = Number(dayValue)

    if (month && Number.isFinite(day)) {
      return {
        selectedCalendarDay: day,
        dueDateValue: formatScheduleDateValue(day, month),
        displayLabel: `${day} ${MONTH_LABELS_PT_BR[month - 1]}`,
        preserveDisplayLabel: false,
      }
    }
  }

  const dayMonthMatch = normalizedDueDate.match(/^(\d{1,2})\s+([A-Za-zÀ-ÿ]{3})$/)

  if (dayMonthMatch) {
    const [, dayValue, monthLabel] = dayMonthMatch
    const month = LEGACY_MONTH_INDEX[monthLabel.toLowerCase()]
    const day = Number(dayValue)

    if (month && Number.isFinite(day)) {
      return {
        selectedCalendarDay: day,
        dueDateValue: formatScheduleDateValue(day, month),
        displayLabel: `${day} ${MONTH_LABELS_PT_BR[month - 1]}`,
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
  const legacySchedule = deriveLegacyScheduleFromDueDate(schedule.displayLabel ?? fallbackDueDate)

  return {
    selectedCalendarDay: Number.isFinite(schedule.selectedCalendarDay)
      ? schedule.selectedCalendarDay
      : legacySchedule.selectedCalendarDay,
    startEnabled: Boolean(schedule.startEnabled),
    startDateValue: schedule.startDateValue ?? '',
    dueEnabled: typeof schedule.dueEnabled === 'boolean' ? schedule.dueEnabled : true,
    dueDateValue: schedule.dueDateValue ?? legacySchedule.dueDateValue,
    dueTimeValue: schedule.dueTimeValue ?? '16:21',
    displayLabel: legacySchedule.displayLabel,
    preserveDisplayLabel: typeof schedule.preserveDisplayLabel === 'boolean'
      ? schedule.preserveDisplayLabel || legacySchedule.preserveDisplayLabel
      : legacySchedule.preserveDisplayLabel,
  }
}

function normalizeBoardCard(card = {}) {
  const schedule = normalizeBoardCardSchedule(card.schedule, card.dueDate)

  return {
    id: card.id ?? createClientId('card'),
    title: card.title ?? 'Cartão sem título',
    description: card.description ?? '',
    labelId: card.labelId ?? '',
    memberIds: Array.isArray(card.memberIds) ? card.memberIds.filter(Boolean) : [],
    dueDate: schedule.displayLabel,
    schedule,
    comments: Array.isArray(card.comments) ? card.comments.map(normalizeComment) : [],
  }
}

function normalizeBoardColumn(column = {}) {
  return {
    id: column.id ?? createClientId('col'),
    title: column.title ?? 'Lista sem título',
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
    title: card.title ?? 'Cartão sem título',
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
    name: plan.name ?? 'Plano sem título',
    description: plan.description ?? '',
    tag: plan.tag ?? 'Geral',
    tagColor: plan.tagColor ?? '#a0a0a0',
    members: Array.isArray(plan.members) ? plan.members.filter(Boolean) : [],
    date: plan.date ?? '',
    tasks: Number.isFinite(plan.tasks) ? plan.tasks : 0,
    cover: plan.cover ?? '#f5f5f5',
    boardColumns: Array.isArray(plan.boardColumns) ? plan.boardColumns.map(normalizeBoardColumn) : [],
    canvasState: normalizeCanvasState(plan.canvasState),
  }
}
