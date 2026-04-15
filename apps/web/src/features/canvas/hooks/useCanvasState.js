import { useCallback, useEffect, useRef, useState } from 'react'
import { createEmptyCanvasState } from '../data/canvasTemplates.js'

export function useCanvasState({
  activePlanId,
  activeCanvasState,
  updatePlanCanvas,
  isBackendDriven = false,
  savePlanCanvas,
}) {
  const [canvasState, setCanvasState] = useState(activeCanvasState ?? createEmptyCanvasState())
  const saveTimerRef = useRef(null)

  useEffect(() => {
    setCanvasState(activeCanvasState ?? createEmptyCanvasState())
  }, [activeCanvasState, activePlanId])

  useEffect(() => () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
  }, [])

  const scheduleSave = useCallback((nextCanvasState) => {
    if (!activePlanId) return

    if (!isBackendDriven) {
      updatePlanCanvas(activePlanId, nextCanvasState)
      return
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      savePlanCanvas(activePlanId, nextCanvasState).catch((error) => {
        console.error(error)
      })
    }, 450)
  }, [activePlanId, isBackendDriven, savePlanCanvas, updatePlanCanvas])

  const updateCanvasState = useCallback((updater) => {
    setCanvasState((current) => {
      const nextCanvasState = typeof updater === 'function' ? updater(current) : updater
      scheduleSave(nextCanvasState)
      return nextCanvasState
    })
  }, [scheduleSave])

  const setCards = useCallback((updater) => {
    updateCanvasState((current) => ({
      ...current,
      cards: typeof updater === 'function' ? updater(current.cards) : updater,
    }))
  }, [updateCanvasState])

  const setConnections = useCallback((updater) => {
    updateCanvasState((current) => ({
      ...current,
      connections: typeof updater === 'function' ? updater(current.connections) : updater,
    }))
  }, [updateCanvasState])

  const setPan = useCallback((updater) => {
    updateCanvasState((current) => ({
      ...current,
      pan: typeof updater === 'function' ? updater(current.pan) : updater,
    }))
  }, [updateCanvasState])

  const setZoom = useCallback((updater) => {
    updateCanvasState((current) => ({
      ...current,
      zoom: typeof updater === 'function' ? updater(current.zoom) : updater,
    }))
  }, [updateCanvasState])

  return {
    cards: canvasState.cards,
    connections: canvasState.connections,
    pan: canvasState.pan,
    zoom: canvasState.zoom,
    updateCanvasState,
    setCards,
    setConnections,
    setPan,
    setZoom,
  }
}
