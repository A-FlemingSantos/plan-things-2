import {
  normalizeCalendarEvent,
  normalizeCalendarSnapshot,
} from '../../../shared/contracts/calendarContracts.js'

const CALENDAR_SOURCES = [
  { id: 'arthur', name: 'arthurfleming.santos@o...', color: '#0f6cbd' },
  { id: 'student', name: 'rm95433@estudante.fi...', color: '#0f703a' },
  { id: 'gmail', name: 'flemingsantosa@gmail...', color: '#b146c2' },
]

const CALENDAR_EVENT_TEMPLATES = [
  { id: 'evt-1', title: 'Sync diário de produto', day: 3, start: '09:00', end: '09:30', sourceId: 'arthur', calendar: 'Arthur Fleming', location: 'Teams' },
  { id: 'evt-2', title: 'Planejamento do sprint', day: 7, start: '10:00', end: '11:30', sourceId: 'student', calendar: 'rm95433', location: 'Workspace' },
  { id: 'evt-3', title: 'Review de design', day: 11, start: '14:00', end: '15:00', sourceId: 'gmail', calendar: 'Gmail', location: 'Studio' },
  { id: 'evt-4', title: 'Imprimir notas da agenda', day: 15, start: '16:00', end: '16:20', sourceId: 'arthur', calendar: 'Arthur Fleming', location: 'Mesa' },
  { id: 'evt-5', title: 'Checkpoint do release', day: 19, start: '11:00', end: '11:45', sourceId: 'arthur', calendar: 'Arthur Fleming' },
]

function padDateNumber(value) {
  return String(value).padStart(2, '0')
}

function createCurrentMonthEvents(baseDate = new Date()) {
  const year = baseDate.getFullYear()
  const monthIndex = baseDate.getMonth()
  const month = padDateNumber(monthIndex + 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

  return CALENDAR_EVENT_TEMPLATES.map((event) => {
    const day = Math.min(Math.max(event.day, 1), daysInMonth)
    return {
      ...event,
      date: `${year}-${month}-${padDateNumber(day)}`,
    }
  })
}

function getSourceById(sources, sourceId) {
  return sources.find((source) => source.id === sourceId) ?? sources[0]
}

export function createInitialCalendarSnapshot() {
  return normalizeCalendarSnapshot({
    sources: CALENDAR_SOURCES,
    events: createCurrentMonthEvents(),
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
