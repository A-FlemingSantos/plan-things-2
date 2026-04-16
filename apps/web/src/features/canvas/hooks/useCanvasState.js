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
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' })
  const saveTimerRef = useRef(null)
  const saveAttemptRef = useRef(0)

  useEffect(() => {
    setCanvasState(activeCanvasState ?? createEmptyCanvasState())
    setSaveState({ status: 'idle', message: '' })
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
      setSaveState({ status: 'saved', message: 'Salvo localmente' })
      return
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    const attemptId = saveAttemptRef.current + 1
    saveAttemptRef.current = attemptId
    setSaveState({ status: 'saving', message: 'Salvando...' })

    saveTimerRef.current = setTimeout(() => {
      savePlanCanvas(activePlanId, nextCanvasState)
        .then(() => {
          if (saveAttemptRef.current !== attemptId) return
          setSaveState({ status: 'saved', message: 'Salvo agora' })
        })
        .catch((error) => {
          if (saveAttemptRef.current !== attemptId) return

          if (error?.code === 'VERSAO_DESATUALIZADA') {
            setSaveState({
              status: 'conflict',
              message: 'Conflito de versão. Recarregue o canvas.',
            })
            return
          }

          setSaveState({
            status: 'error',
            message: error?.message ?? 'Erro ao salvar o canvas.',
          })
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
    saveStatus: saveState.status,
    saveMessage: saveState.message,
    updateCanvasState,
    setCards,
    setConnections,
    setPan,
    setZoom,
  }
}
