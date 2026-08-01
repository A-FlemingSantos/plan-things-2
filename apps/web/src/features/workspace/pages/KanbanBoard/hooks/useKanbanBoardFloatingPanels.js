import { useEffect, useRef, useState } from 'react'

const PANEL_CLOSE_DELAY_MS = 260

export function useKanbanBoardFloatingPanels() {
  const [isInboxOpen, setIsInboxOpen] = useState(false)
  const [isInboxPanelMounted, setIsInboxPanelMounted] = useState(false)
  const [isPlannerOpen, setIsPlannerOpen] = useState(false)
  const [isPlannerPanelMounted, setIsPlannerPanelMounted] = useState(false)

  const inboxCloseTimerRef = useRef(null)
  const plannerCloseTimerRef = useRef(null)

  const clearPanelTimers = () => {
    if (inboxCloseTimerRef.current) {
      clearTimeout(inboxCloseTimerRef.current)
      inboxCloseTimerRef.current = null
    }
    if (plannerCloseTimerRef.current) {
      clearTimeout(plannerCloseTimerRef.current)
      plannerCloseTimerRef.current = null
    }
  }

  const closeInbox = () => {
    setIsInboxOpen(false)
    if (inboxCloseTimerRef.current) {
      clearTimeout(inboxCloseTimerRef.current)
    }
    inboxCloseTimerRef.current = setTimeout(() => {
      setIsInboxPanelMounted(false)
      inboxCloseTimerRef.current = null
    }, PANEL_CLOSE_DELAY_MS)
  }

  const closePlanner = () => {
    setIsPlannerOpen(false)
    if (plannerCloseTimerRef.current) {
      clearTimeout(plannerCloseTimerRef.current)
    }
    plannerCloseTimerRef.current = setTimeout(() => {
      setIsPlannerPanelMounted(false)
      plannerCloseTimerRef.current = null
    }, PANEL_CLOSE_DELAY_MS)
  }

  const closeFloatingPanel = () => {
    closeInbox()
    closePlanner()
  }

  const openPlanner = (onOpen) => {
    clearPanelTimers()
    setIsInboxOpen(false)
    setIsInboxPanelMounted(false)
    setIsPlannerPanelMounted(true)
    window.requestAnimationFrame(() => setIsPlannerOpen(true))
    onOpen?.()
  }

  const openInbox = () => {
    clearPanelTimers()
    setIsPlannerOpen(false)
    setIsPlannerPanelMounted(false)
    setIsInboxPanelMounted(true)
    window.requestAnimationFrame(() => setIsInboxOpen(true))
  }

  useEffect(() => () => {
    clearPanelTimers()
  }, [])

  return {
    isInboxOpen,
    setIsInboxOpen,
    isInboxPanelMounted,
    setIsInboxPanelMounted,
    isPlannerOpen,
    setIsPlannerOpen,
    isPlannerPanelMounted,
    setIsPlannerPanelMounted,
    openInbox,
    closeInbox,
    openPlanner,
    closePlanner,
    closeFloatingPanel,
  }
}
