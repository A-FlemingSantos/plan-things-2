import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { apiRequest } from '../../../shared/api/apiClient.js'
import { buildCalendarEventPayload, mapCalendarEventsToSnapshot } from '../../../shared/contracts/backendAdapters.js'
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
  const { accessToken, isAuthenticated, isDemoSession } = useAuth()
  const backendEnabled = isAuthenticated && !isDemoSession
  const [snapshot, setSnapshot] = useState(() => createInitialCalendarSnapshot())
  const searchTerm = search.trim().toLowerCase()

  useEffect(() => {
    let active = true

    async function loadEvents() {
      if (!backendEnabled) {
        if (active) {
          setSnapshot(createInitialCalendarSnapshot())
        }
        return
      }

      try {
        const events = await apiRequest('/api/calendar/events', {
          token: accessToken,
        })

        if (!active) return
        setSnapshot(mapCalendarEventsToSnapshot(events))
      } catch (error) {
        console.error(error)
      }
    }

    loadEvents()

    return () => {
      active = false
    }
  }, [accessToken, backendEnabled])

  const filteredEvents = useMemo(() => {
    return snapshot.events.filter((event) => matchesSearch(event, searchTerm))
  }, [searchTerm, snapshot.events])

  const createEvent = async (data) => {
    if (!backendEnabled) {
      const event = createCalendarEventDraft(data, snapshot.sources)
      setSnapshot((current) => ({
        ...current,
        events: insertCalendarEvent(current.events, event),
      }))
      return event
    }

    const createdEvent = await apiRequest('/api/calendar/events', {
      method: 'POST',
      token: accessToken,
      body: buildCalendarEventPayload(data),
    })

    const nextSnapshot = mapCalendarEventsToSnapshot([...(snapshot.events.map((event) => event.raw).filter(Boolean)), createdEvent])
    setSnapshot(nextSnapshot)
    return nextSnapshot.events.find((event) => event.id === createdEvent.id)
  }

  return {
    events: snapshot.events,
    calendarSources: snapshot.sources,
    filteredEvents,
    createEvent,
  }
}
