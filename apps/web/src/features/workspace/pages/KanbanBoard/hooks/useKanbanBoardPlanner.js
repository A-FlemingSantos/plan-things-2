import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCalendarEvents } from '../../../../calendar/hooks/useCalendarEvents.js'
import { buildPlannerView, filterPlannerItems } from '../plannerFilters.js'
import {
  addDaysToDateKey,
  dateKeyFromTimeZoneInstant,
  timeValueFromIsoInTimeZone,
  timeValueMinutes,
} from '../utils/plannerDateUtils.js'

export function useKanbanBoardPlanner({
  activePlan,
  columns,
  currentUser,
  timeZone,
  formatClockTime,
  today,
  isPlannerPanelMounted,
  saveCardOptimistically,
  updateCard,
  showNotification,
}) {
  const [isPlannerFilterOpen, setIsPlannerFilterOpen] = useState(false)
  const [plannerFilter, setPlannerFilter] = useState('my-day')
  const [plannerPinnedById, setPlannerPinnedById] = useState({})
  const [plannerSectionOpenById, setPlannerSectionOpenById] = useState({})
  const plannerFilterWrapRef = useRef(null)

  const { filteredEvents: plannerCalendarEvents } = useCalendarEvents({
    enabled: isPlannerPanelMounted,
    includeGeneratedFromCard: false,
    enrichGeneratedCardKinds: false,
  })

  const todayKey = useMemo(
    () => dateKeyFromTimeZoneInstant(today, timeZone) ?? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
    [timeZone, today],
  )
  const tomorrowKey = useMemo(() => addDaysToDateKey(todayKey, 1), [todayKey])
  const plannerPinnedStorageKey = useMemo(
    () => `plan-things:plannerPinned:${activePlan?.id ?? 'none'}`,
    [activePlan?.id],
  )
  const plannerCollapseStorageKey = useMemo(
    () => `plan-things:plannerCollapse:${activePlan?.id ?? 'none'}`,
    [activePlan?.id],
  )

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(plannerPinnedStorageKey)
      const parsed = stored ? JSON.parse(stored) : []
      if (Array.isArray(parsed)) {
        setPlannerPinnedById(Object.fromEntries(parsed.map((id) => [id, true])))
        return
      }
    } catch {}
    setPlannerPinnedById({})
  }, [plannerPinnedStorageKey])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(plannerCollapseStorageKey)
      const parsed = stored ? JSON.parse(stored) : null
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        setPlannerSectionOpenById(parsed)
        return
      }
    } catch {}
    setPlannerSectionOpenById({})
  }, [plannerCollapseStorageKey])

  useEffect(() => {
    if (!isPlannerFilterOpen) return undefined

    const handlePointerDown = (event) => {
      if (plannerFilterWrapRef.current?.contains(event.target)) return
      setIsPlannerFilterOpen(false)
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsPlannerFilterOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPlannerFilterOpen])

  const defaultPlannerSectionOpen = (sectionId) => {
    if (sectionId === 'my-day:completed') return false
    if (sectionId.startsWith('planned:')) return true
    return true
  }

  const persistPlannerPinnedState = (next) => {
    try {
      window.localStorage.setItem(plannerPinnedStorageKey, JSON.stringify(Object.keys(next)))
    } catch {}
  }

  const isPlannerSectionOpen = (sectionId) => {
    const stored = plannerSectionOpenById?.[sectionId]
    if (typeof stored === 'boolean') return stored
    return defaultPlannerSectionOpen(sectionId)
  }

  const togglePlannerSection = (sectionId) => {
    setPlannerSectionOpenById((current) => {
      const currentValue = typeof current?.[sectionId] === 'boolean'
        ? current[sectionId]
        : defaultPlannerSectionOpen(sectionId)
      const nextValue = !currentValue
      const next = { ...(current ?? {}) }
      next[sectionId] = nextValue
      try {
        window.localStorage.setItem(plannerCollapseStorageKey, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const togglePlannerPinned = async (item) => {
    if (item?.type === 'card') {
      const nextStarred = !Boolean(item.pinned)
      const previousPinnedById = plannerPinnedById
      if (previousPinnedById[item.id]) {
        setPlannerPinnedById((current) => {
          if (!current[item.id]) return current
          const next = { ...current }
          delete next[item.id]
          persistPlannerPinnedState(next)
          return next
        })
      }

      try {
        await saveCardOptimistically({
          ...item.card,
          starred: nextStarred,
        })
      } catch (error) {
        if (previousPinnedById[item.id]) {
          setPlannerPinnedById(previousPinnedById)
        }
        showNotification(error?.message ?? 'Não foi possível atualizar o destaque da tarefa.')
      }
      return
    }

    const itemId = item?.id
    if (!itemId) return

    setPlannerPinnedById((current) => {
      const next = { ...current }
      if (next[itemId]) {
        delete next[itemId]
      } else {
        next[itemId] = true
      }
      persistPlannerPinnedState(next)
      return next
    })
  }

  useEffect(() => {
    const legacyPinnedCardIds = Object.keys(plannerPinnedById).filter((itemId) => itemId.startsWith('card:'))
    if (!legacyPinnedCardIds.length) return

    const cardByPlannerItemId = new Map(
      columns.flatMap((column) => column.cards.map((card) => [`card:${card.id}`, card])),
    )
    const pendingCards = legacyPinnedCardIds
      .map((itemId) => ({ itemId, card: cardByPlannerItemId.get(itemId) }))
      .filter(({ card }) => card && !card.starred)

    if (!pendingCards.length) return

    let active = true

    void (async () => {
      for (const { itemId, card } of pendingCards) {
        if (!active) return
        try {
          await updateCard({
            ...card,
            starred: true,
          })
          if (!active) return
          setPlannerPinnedById((current) => {
            if (!current[itemId]) return current
            const next = { ...current }
            delete next[itemId]
            persistPlannerPinnedState(next)
            return next
          })
        } catch {}
      }
    })()

    return () => {
      active = false
    }
  }, [columns, plannerPinnedById, plannerPinnedStorageKey, updateCard])

  const plannerDateFormatter = useMemo(() => new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }), [timeZone])

  const plannerBaseItems = useMemo(() => {
    const planName = activePlan?.name ?? 'Plano'

    const formatDateLabel = (key) => {
      if (!key) return 'Sem data'
      if (key === todayKey) return 'Hoje'
      if (tomorrowKey && key === tomorrowKey) return 'Amanhã'
      const date = new Date(`${key}T12:00:00Z`)
      return plannerDateFormatter.format(date).replace(/\./g, '')
    }

    const cardItems = columns
      .flatMap((column) => column.cards.map((card) => ({
        column,
        card,
      })))
      .map(({ column, card }) => {
        const startKey = dateKeyFromTimeZoneInstant(card.startAt?.iso, timeZone)
        const dueKey = dateKeyFromTimeZoneInstant(card.dueAt?.iso, timeZone)
        const scheduleKey = dueKey ?? startKey
        const scheduleIso = card.dueAt?.iso ?? card.startAt?.iso ?? null
        const timeValue = timeValueFromIsoInTimeZone(scheduleIso, timeZone)
        const itemId = `card:${card.id}`
        const dateLabel = formatDateLabel(scheduleKey)

        return {
          id: itemId,
          type: 'card',
          title: card.title,
          meta: `${planName} · ${column.title} · ${dateLabel}`,
          pinned: Boolean(card.starred) || Boolean(plannerPinnedById[itemId]),
          startKey,
          dueKey,
          scheduleKey,
          timeMinutes: timeValueMinutes(timeValue),
          isCompleted: Boolean(card.isCompleted),
          isAssignedToMe: Boolean(
            currentUser?.id &&
            Array.isArray(card.memberIds) &&
            card.memberIds.includes(currentUser.id),
          ),
          card,
          colTitle: column.title,
        }
      })

    const eventItems = plannerCalendarEvents
      .map((event) => {
        const rangeLabel = `${formatClockTime(event.start)}–${formatClockTime(event.end)}`
        const itemId = `event:${event.id}`
        const dateLabel = formatDateLabel(event.date)
        return {
          id: itemId,
          type: 'event',
          title: event.title,
          meta: `Calendário · ${rangeLabel} · ${dateLabel}`,
          pinned: Boolean(plannerPinnedById[itemId]),
          startKey: null,
          dueKey: null,
          scheduleKey: event.date,
          timeMinutes: timeValueMinutes(event.start),
          isCompleted: false,
          isAssignedToMe: false,
          event,
        }
      })

    return [...cardItems, ...eventItems]
  }, [
    activePlan?.name,
    columns,
    currentUser?.id,
    formatClockTime,
    plannerDateFormatter,
    plannerCalendarEvents,
    plannerPinnedById,
    timeZone,
    todayKey,
    tomorrowKey,
  ])

  const plannerFilterCounts = useMemo(() => {
    const myDayCount = filterPlannerItems(plannerBaseItems, 'my-day', todayKey).length
    const importantCount = filterPlannerItems(plannerBaseItems, 'important', todayKey).length
    const plannedCount = filterPlannerItems(plannerBaseItems, 'planned', todayKey).length
    const completedCount = filterPlannerItems(plannerBaseItems, 'completed', todayKey).length
    const assignedToMeCount = filterPlannerItems(plannerBaseItems, 'assigned-to-me', todayKey).length

    return {
      myDay: myDayCount,
      important: importantCount,
      planned: plannedCount,
      completed: completedCount,
      assignedToMe: assignedToMeCount,
    }
  }, [plannerBaseItems, todayKey])

  const plannerView = useMemo(() => buildPlannerView({
    baseItems: plannerBaseItems,
    filterId: plannerFilter,
    todayKey,
  }), [plannerBaseItems, plannerFilter, todayKey])

  const closePlannerFilter = useCallback(() => {
    setIsPlannerFilterOpen(false)
  }, [])

  return {
    isPlannerFilterOpen,
    setIsPlannerFilterOpen,
    plannerFilter,
    setPlannerFilter,
    plannerFilterWrapRef,
    plannerFilterCounts,
    plannerView,
    togglePlannerPinned,
    togglePlannerSection,
    isPlannerSectionOpen,
    closePlannerFilter,
  }
}
