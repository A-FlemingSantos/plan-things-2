import { useCallback } from 'react'
import { createEmptyCanvasState } from '../data/canvasTemplates.js'

export function useCanvasState({ activePlanId, activeCanvasState, updatePlanCanvas }) {
  const resolvedCanvasState = activeCanvasState ?? createEmptyCanvasState()
  const cards = resolvedCanvasState.cards
  const connections = resolvedCanvasState.connections
  const pan = resolvedCanvasState.pan
  const zoom = resolvedCanvasState.zoom

  const updateCanvasState = useCallback((updater) => {
    if (!activePlanId) return
    updatePlanCanvas(activePlanId, updater)
  }, [activePlanId, updatePlanCanvas])

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
    cards,
    connections,
    pan,
    zoom,
    updateCanvasState,
    setCards,
    setConnections,
    setPan,
    setZoom,
  }
}
