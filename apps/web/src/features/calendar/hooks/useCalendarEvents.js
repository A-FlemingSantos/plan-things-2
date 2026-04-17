import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { apiRequest } from '../../../shared/api/apiClient.js'
import { buildCalendarEventPayload, mapCalendarEventsToSnapshot } from '../../../shared/contracts/backendAdapters.js'
import {
  createCalendarEventDraft,
  createInitialCalendarSnapshot,
  insertCalendarEvent,
} from '../data/calendarRepository.js'

const EMPTY_CALENDAR_SNAPSHOT = {
  sources: [],
  events: [],
}

async function enrichGeneratedCardKinds(events, accessToken) {
  const pendingPlanIds = [
    ...new Set(
      events
        .filter((event) => event.generatedFromCard && event.planId && event.linkedCardId && !event.cardKind)
        .map((event) => event.planId),
    ),
  ]

  if (!pendingPlanIds.length) {
    return events
  }

  const boardViews = await Promise.all(
    pendingPlanIds.map((planId) => apiRequest(`/api/plans/${planId}/board`, { token: accessToken })),
  )

  const cardKindsById = new Map(
    boardViews
      .flatMap((board) => board.columns ?? [])
      .flatMap((column) => column.cards ?? [])
      .map((card) => [card.id, card.kind]),
  )

  return events.map((event) => (
    event.generatedFromCard && event.linkedCardId && !event.cardKind
      ? {
          ...event,
          cardKind: cardKindsById.get(event.linkedCardId) ?? null,
        }
      : event
  ))
}

function matchesSearch(event, term) {
  if (!term) return true

  return [event.title, event.location, event.calendar]
    .some((value) => value.toLowerCase().includes(term))
}

export function useCalendarEvents({ search = '' } = {}) {
  const { accessToken, isAuthenticated, isDemoSession } = useAuth()
  const backendEnabled = isAuthenticated && !isDemoSession
  const [snapshot, setSnapshot] = useState(() => (backendEnabled ? EMPTY_CALENDAR_SNAPSHOT : createInitialCalendarSnapshot()))
  const [isLoading, setIsLoading] = useState(() => backendEnabled)
  const [loadError, setLoadError] = useState(null)
  const searchTerm = search.trim().toLowerCase()

  useEffect(() => {
    let active = true

    async function loadEvents() {
      if (!backendEnabled) {
        if (active) {
          setSnapshot(createInitialCalendarSnapshot())
          setLoadError(null)
          setIsLoading(false)
        }
        return
      }

      if (active) {
        setIsLoading(true)
      }

      try {
        const events = await apiRequest('/api/calendar/events', {
          token: accessToken,
        })
        const enrichedEvents = await enrichGeneratedCardKinds(events, accessToken)

        if (!active) return
        setSnapshot(mapCalendarEventsToSnapshot(enrichedEvents))
        setLoadError(null)
      } catch (error) {
        if (!active) return
        setLoadError(error?.message ?? 'Não foi possível carregar os eventos do calendário.')
      } finally {
        if (active) {
          setIsLoading(false)
        }
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
    setLoadError(null)
    return nextSnapshot.events.find((event) => event.id === createdEvent.id)
  }

  const updateEvent = async (eventId, data) => {
    if (!backendEnabled) {
      let updatedEvent = null

      setSnapshot((current) => {
        const nextEvents = current.events.map((event) => {
          if (event.id !== eventId) return event
          updatedEvent = {
            ...event,
            ...data,
          }
          return updatedEvent
        })

        return {
          ...current,
          events: nextEvents,
        }
      })

      return updatedEvent
    }

    const updatedEvent = await apiRequest(`/api/calendar/events/${eventId}`, {
      method: 'PATCH',
      token: accessToken,
      body: buildCalendarEventPayload(data),
    })

    const nextSnapshot = mapCalendarEventsToSnapshot(
      snapshot.events
        .map((event) => event.raw)
        .filter(Boolean)
        .map((event) => (event.id === eventId ? updatedEvent : event)),
    )
    setSnapshot(nextSnapshot)
    setLoadError(null)
    return nextSnapshot.events.find((event) => event.id === updatedEvent.id)
  }

  const deleteEvent = async (eventId) => {
    if (!backendEnabled) {
      setSnapshot((current) => ({
        ...current,
        events: current.events.filter((event) => event.id !== eventId),
      }))
      return true
    }

    await apiRequest(`/api/calendar/events/${eventId}`, {
      method: 'DELETE',
      token: accessToken,
    })

    setSnapshot((current) => ({
      ...current,
      events: current.events.filter((event) => event.id !== eventId),
    }))
    setLoadError(null)
    return true
  }

  return {
    events: snapshot.events,
    calendarSources: snapshot.sources,
    filteredEvents,
    isLoading,
    loadError,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}
