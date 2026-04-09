import { useMemo, useState } from 'react'
import {
  createCalendarEventDraft,
  createInitialCalendarSnapshot,
  insertCalendarEvent,
} from '../data/calendarRepository.js'

function matchesSearch(event, term) {
  if (!term) return true

  return [event.title, event.location, event.calendar]
    .some((value) => value.toLowerCase().includes(term))
}

export function useCalendarEvents({ search = '' } = {}) {
  const [snapshot, setSnapshot] = useState(() => createInitialCalendarSnapshot())
  const searchTerm = search.trim().toLowerCase()

  const filteredEvents = useMemo(() => {
    return snapshot.events.filter((event) => matchesSearch(event, searchTerm))
  }, [searchTerm, snapshot.events])

  const createEvent = (data) => {
    const event = createCalendarEventDraft(data, snapshot.sources)
    setSnapshot((current) => ({
      ...current,
      events: insertCalendarEvent(current.events, event),
    }))
    return event
  }

  return {
    events: snapshot.events,
    calendarSources: snapshot.sources,
    filteredEvents,
    createEvent,
  }
}
