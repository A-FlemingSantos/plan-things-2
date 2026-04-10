import { createClientId } from '../utils/createClientId.js'

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const DEFAULT_SOURCE = {
  id: 'primary',
  name: 'Calendário',
  color: '#0f6cbd',
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function normalizeText(value, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function normalizeDateKey(value) {
  return typeof value === 'string' && DATE_KEY_PATTERN.test(value) ? value : dateKey(new Date())
}

function normalizeColor(value, fallback = DEFAULT_SOURCE.color) {
  return typeof value === 'string' && value.trim() ? value : fallback
}

export function normalizeCalendarSource(source = {}) {
  return {
    id: source.id ?? createClientId('calendar-source'),
    name: normalizeText(source.name, DEFAULT_SOURCE.name),
    color: normalizeColor(source.color),
  }
}

export function normalizeCalendarEvent(event = {}, sourcesById = new Map()) {
  const sourceId = event.sourceId ?? event.source ?? DEFAULT_SOURCE.id
  const source = sourcesById.get(sourceId) ?? sourcesById.values().next().value ?? DEFAULT_SOURCE

  return {
    id: event.id ?? createClientId('calendar-event'),
    title: normalizeText(event.title, 'Evento sem título').trim() || 'Evento sem título',
    date: normalizeDateKey(event.date),
    start: normalizeText(event.start, '09:00'),
    end: normalizeText(event.end, '10:00'),
    calendar: normalizeText(event.calendar, source.name),
    sourceId,
    color: normalizeColor(event.color, source.color),
    location: normalizeText(event.location),
  }
}

export function normalizeCalendarSnapshot(snapshot = {}) {
  const sources = Array.isArray(snapshot.sources)
    ? snapshot.sources.map(normalizeCalendarSource)
    : [DEFAULT_SOURCE]
  const safeSources = sources.length ? sources : [DEFAULT_SOURCE]
  const sourcesById = new Map(safeSources.map((source) => [source.id, source]))

  return {
    sources: safeSources,
    events: Array.isArray(snapshot.events)
      ? snapshot.events.map((event) => normalizeCalendarEvent(event, sourcesById))
      : [],
  }
}
