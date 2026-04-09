import {
  normalizeCalendarEvent,
  normalizeCalendarSnapshot,
} from '../../../shared/contracts/calendarContracts.js'

const CALENDAR_SOURCES = [
  { id: 'arthur', name: 'arthurfleming.santos@o...', color: '#0f6cbd' },
  { id: 'student', name: 'rm95433@estudante.fi...', color: '#0f703a' },
  { id: 'gmail', name: 'flemingsantosa@gmail...', color: '#b146c2' },
]

const CALENDAR_EVENTS = [
  { id: 'evt-1', title: 'Daily product sync', date: '2026-04-09', start: '09:00', end: '09:30', sourceId: 'arthur', calendar: 'Arthur Fleming', location: 'Teams' },
  { id: 'evt-2', title: 'Sprint planning', date: '2026-04-13', start: '10:00', end: '11:30', sourceId: 'student', calendar: 'rm95433', location: 'Workspace' },
  { id: 'evt-3', title: 'Design review', date: '2026-04-15', start: '14:00', end: '15:00', sourceId: 'gmail', calendar: 'Gmail', location: 'Studio' },
  { id: 'evt-4', title: 'Print agenda notes', date: '2026-04-17', start: '16:00', end: '16:20', sourceId: 'arthur', calendar: 'Arthur Fleming', location: 'Desk' },
  { id: 'evt-5', title: 'Release checkpoint', date: '2026-04-23', start: '11:00', end: '11:45', sourceId: 'arthur', calendar: 'Arthur Fleming' },
]

function getSourceById(sources, sourceId) {
  return sources.find((source) => source.id === sourceId) ?? sources[0]
}

export function createInitialCalendarSnapshot() {
  return normalizeCalendarSnapshot({
    sources: CALENDAR_SOURCES,
    events: CALENDAR_EVENTS,
  })
}

export function createCalendarEventDraft(data, sources) {
  const source = getSourceById(sources, data.sourceId ?? 'arthur')

  return normalizeCalendarEvent({
    ...data,
    sourceId: source?.id,
    calendar: data.calendar ?? source?.name,
    color: data.color ?? source?.color,
  }, new Map(sources.map((item) => [item.id, item])))
}

export function insertCalendarEvent(events, event) {
  return [...events, event].sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`))
}
