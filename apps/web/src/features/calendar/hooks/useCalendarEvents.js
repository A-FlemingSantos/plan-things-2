import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { usePreferences } from '../../preferences/context/PreferencesContext.jsx'
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

function rawEventsFromSnapshot(snapshot) {
  return snapshot.events.map((event) => event.raw).filter(Boolean)
}

function mergeRawEvent(rawEvents, nextEvent) {
  const byId = new Map(rawEvents.map((event) => [event.id, event]))
  byId.set(nextEvent.id, nextEvent)
  return Array.from(byId.values())
}

function assertValidEventPayload(payload) {
  const startsAt = payload?.startsAt ? Date.parse(payload.startsAt) : Number.NaN
  const endsAt = payload?.endsAt ? Date.parse(payload.endsAt) : Number.NaN

  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) {
    throw new Error('Informe uma data e horários válidos para o evento.')
  }

  if (endsAt <= startsAt) {
    throw new Error('O horário de fim precisa ser depois do início.')
  }
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

export function useCalendarEvents({
  search = '',
  enabled = true,
  includeGeneratedFromCard = true,
  enrichGeneratedCardKinds: shouldEnrichGeneratedCardKinds = true,
} = {}) {
  const { accessToken, isAuthenticated, isDemoSession } = useAuth()
  const { generalPreferences } = usePreferences()
  const backendEnabled = isAuthenticated && !isDemoSession
  const timeZone = generalPreferences.timezone
  const [snapshot, setSnapshot] = useState(() => {
    if (!backendEnabled) return createInitialCalendarSnapshot()
    return EMPTY_CALENDAR_SNAPSHOT
  })
  const [isLoading, setIsLoading] = useState(() => backendEnabled && enabled)
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

      if (!enabled) {
        if (active) {
          setSnapshot(EMPTY_CALENDAR_SNAPSHOT)
          setLoadError(null)
          setIsLoading(false)
        }
        return
      }

      if (active) {
        setIsLoading(true)
        setSnapshot(EMPTY_CALENDAR_SNAPSHOT)
      }

      try {
        const events = await apiRequest('/api/calendar/events', {
          token: accessToken,
        })
        const filteredFetchedEvents = includeGeneratedFromCard
          ? events
          : events.filter((event) => !event.generatedFromCard)
        const enrichedEvents = shouldEnrichGeneratedCardKinds
          ? await enrichGeneratedCardKinds(filteredFetchedEvents, accessToken)
          : filteredFetchedEvents

        if (!active) return
        setSnapshot(mapCalendarEventsToSnapshot(enrichedEvents, { timeZone }))
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
  }, [accessToken, backendEnabled, enabled, includeGeneratedFromCard, shouldEnrichGeneratedCardKinds, timeZone])

  useEffect(() => {
    if (!backendEnabled || !enabled) return

    setSnapshot((current) => {
      const rawEvents = current.events.map((event) => event.raw).filter(Boolean)
      if (!rawEvents.length) return current
      return mapCalendarEventsToSnapshot(rawEvents, { timeZone })
    })
  }, [backendEnabled, enabled, timeZone])

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

    const payload = buildCalendarEventPayload(data, { timeZone })
    assertValidEventPayload(payload)

    const createdEvent = await apiRequest('/api/calendar/events', {
      method: 'POST',
      token: accessToken,
      body: payload,
    })

    const createdSnapshot = mapCalendarEventsToSnapshot([createdEvent], { timeZone })
    setSnapshot((current) => mapCalendarEventsToSnapshot(
      mergeRawEvent(rawEventsFromSnapshot(current), createdEvent),
      { timeZone },
    ))
    setLoadError(null)
    return createdSnapshot.events.find((event) => event.id === createdEvent.id)
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

    const payload = buildCalendarEventPayload(data, { timeZone })
    assertValidEventPayload(payload)

    const updatedEvent = await apiRequest(`/api/calendar/events/${eventId}`, {
      method: 'PATCH',
      token: accessToken,
      body: payload,
    })

    const updatedSnapshot = mapCalendarEventsToSnapshot([updatedEvent], { timeZone })
    setSnapshot((current) => mapCalendarEventsToSnapshot(
      mergeRawEvent(rawEventsFromSnapshot(current), updatedEvent),
      { timeZone },
    ))
    setLoadError(null)
    return updatedSnapshot.events.find((event) => event.id === updatedEvent.id)
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
