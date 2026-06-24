import { useEffect, useRef, useState } from 'react'

const PANEL_CLOSE_DELAY_MS = 260

export function useKanbanBoardFloatingPanels() {
  const [isInboxOpen, setIsInboxOpen] = useState(false)
  const [isInboxPanelMounted, setIsInboxPanelMounted] = useState(false)
  const [isPlannerOpen, setIsPlannerOpen] = useState(false)
  const [isPlannerPanelMounted, setIsPlannerPanelMounted] = useState(false)
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false)
  const [isIntelligencePanelMounted, setIsIntelligencePanelMounted] = useState(false)

  const inboxCloseTimerRef = useRef(null)
  const plannerCloseTimerRef = useRef(null)
  const intelligenceCloseTimerRef = useRef(null)

  const clearPanelTimers = () => {
    if (inboxCloseTimerRef.current) {
      clearTimeout(inboxCloseTimerRef.current)
      inboxCloseTimerRef.current = null
    }
    if (plannerCloseTimerRef.current) {
      clearTimeout(plannerCloseTimerRef.current)
      plannerCloseTimerRef.current = null
    }
    if (intelligenceCloseTimerRef.current) {
      clearTimeout(intelligenceCloseTimerRef.current)
      intelligenceCloseTimerRef.current = null
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

  const closeIntelligence = () => {
    setIsIntelligenceOpen(false)
    if (intelligenceCloseTimerRef.current) {
      clearTimeout(intelligenceCloseTimerRef.current)
    }
    intelligenceCloseTimerRef.current = setTimeout(() => {
      setIsIntelligencePanelMounted(false)
      intelligenceCloseTimerRef.current = null
    }, PANEL_CLOSE_DELAY_MS)
  }

  const closeFloatingPanel = () => {
    closeInbox()
    closePlanner()
    closeIntelligence()
  }

  const openPlanner = (onOpen) => {
    clearPanelTimers()
    setIsInboxOpen(false)
    setIsInboxPanelMounted(false)
    setIsIntelligenceOpen(false)
    setIsIntelligencePanelMounted(false)
    setIsPlannerPanelMounted(true)
    window.requestAnimationFrame(() => setIsPlannerOpen(true))
    onOpen?.()
  }

  const openInbox = () => {
    clearPanelTimers()
    setIsPlannerOpen(false)
    setIsPlannerPanelMounted(false)
    setIsIntelligenceOpen(false)
    setIsIntelligencePanelMounted(false)
    setIsInboxPanelMounted(true)
    window.requestAnimationFrame(() => setIsInboxOpen(true))
  }

  const openIntelligence = (onOpen) => {
    clearPanelTimers()
    setIsPlannerOpen(false)
    setIsPlannerPanelMounted(false)
    setIsInboxOpen(false)
    setIsInboxPanelMounted(false)
    setIsIntelligencePanelMounted(true)
    setIsIntelligenceOpen(true)
    onOpen?.()
  }

  const toggleIntelligence = (onOpen) => {
    if (isIntelligenceOpen) {
      closeIntelligence()
      return
    }
    openIntelligence(onOpen)
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
    isIntelligenceOpen,
    setIsIntelligenceOpen,
    isIntelligencePanelMounted,
    setIsIntelligencePanelMounted,
    openInbox,
    closeInbox,
    openPlanner,
    closePlanner,
    openIntelligence,
    closeIntelligence,
    toggleIntelligence,
    closeFloatingPanel,
  }
}
