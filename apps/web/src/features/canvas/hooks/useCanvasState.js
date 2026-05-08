import { useCallback, useEffect, useRef, useState } from 'react'
import { createEmptyCanvasState } from '../data/canvasTemplates.js'

function getCanvasStateSignature(canvasState) {
  return JSON.stringify(canvasState ?? createEmptyCanvasState())
}

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
  const activePlanRef = useRef(activePlanId ?? null)
  const canvasStateRef = useRef(canvasState)
  const isDirtyRef = useRef(false)
  const lastExternalSignatureRef = useRef(getCanvasStateSignature(activeCanvasState))

  useEffect(() => {
    canvasStateRef.current = canvasState
  }, [canvasState])

  useEffect(() => {
    const nextCanvasState = activeCanvasState ?? createEmptyCanvasState()
    const nextSignature = getCanvasStateSignature(nextCanvasState)
    const planChanged = activePlanRef.current !== (activePlanId ?? null)

    if (planChanged) {
      activePlanRef.current = activePlanId ?? null
      isDirtyRef.current = false
      saveAttemptRef.current += 1
      lastExternalSignatureRef.current = nextSignature
      canvasStateRef.current = nextCanvasState
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      setCanvasState(nextCanvasState)
      setSaveState({ status: 'idle', message: '' })
      return
    }

    if (lastExternalSignatureRef.current === nextSignature) {
      return
    }

    lastExternalSignatureRef.current = nextSignature

    if (!isDirtyRef.current) {
      canvasStateRef.current = nextCanvasState
      setCanvasState(nextCanvasState)
    }
  }, [activeCanvasState, activePlanId])

  useEffect(() => () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
  }, [])

  const scheduleSave = useCallback((nextCanvasState) => {
    if (!activePlanId) return

    if (!isBackendDriven) {
      const nextSignature = getCanvasStateSignature(nextCanvasState)
      lastExternalSignatureRef.current = nextSignature
      isDirtyRef.current = false
      updatePlanCanvas(activePlanId, nextCanvasState)
      setSaveState({ status: 'saved', message: 'Salvo localmente' })
      return
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    const attemptId = saveAttemptRef.current + 1
    saveAttemptRef.current = attemptId
    setSaveState((current) => (
      current.status === 'saving' && current.message === 'Salvando...'
        ? current
        : { status: 'saving', message: 'Salvando...' }
    ))

    saveTimerRef.current = setTimeout(() => {
      savePlanCanvas(activePlanId, nextCanvasState)
        .then((savedCanvasState) => {
          if (saveAttemptRef.current !== attemptId) return

          const persistedCanvasState = savedCanvasState ?? nextCanvasState
          const persistedSignature = getCanvasStateSignature(persistedCanvasState)
          lastExternalSignatureRef.current = persistedSignature
          isDirtyRef.current = getCanvasStateSignature(canvasStateRef.current) !== persistedSignature
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

  const updateCanvasState = useCallback((updater, options = {}) => {
    const shouldPersist = options.persist !== false
    setCanvasState((current) => {
      const nextCanvasState = typeof updater === 'function' ? updater(current) : updater
      canvasStateRef.current = nextCanvasState

      if (shouldPersist) {
        isDirtyRef.current = true
        scheduleSave(nextCanvasState)
      }

      return nextCanvasState
    })
  }, [scheduleSave])

  const persistCurrentState = useCallback(() => {
    if (!activePlanId) return
    if (getCanvasStateSignature(canvasStateRef.current) === lastExternalSignatureRef.current) return
    isDirtyRef.current = true
    scheduleSave(canvasStateRef.current)
  }, [activePlanId, scheduleSave])

  const setCards = useCallback((updater, options) => {
    const nextUpdater = (current) => ({
      ...current,
      cards: typeof updater === 'function' ? updater(current.cards) : updater,
    })
    updateCanvasState(nextUpdater, options)
  }, [updateCanvasState])

  const setConnections = useCallback((updater, options) => {
    const nextUpdater = (current) => ({
      ...current,
      connections: typeof updater === 'function' ? updater(current.connections) : updater,
    })
    updateCanvasState(nextUpdater, options)
  }, [updateCanvasState])

  const setPan = useCallback((updater, options) => {
    const nextUpdater = (current) => ({
      ...current,
      pan: typeof updater === 'function' ? updater(current.pan) : updater,
    })
    updateCanvasState(nextUpdater, options)
  }, [updateCanvasState])

  const setZoom = useCallback((updater, options) => {
    const nextUpdater = (current) => ({
      ...current,
      zoom: typeof updater === 'function' ? updater(current.zoom) : updater,
    })
    updateCanvasState(nextUpdater, options)
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
    persistCurrentState,
  }
}
