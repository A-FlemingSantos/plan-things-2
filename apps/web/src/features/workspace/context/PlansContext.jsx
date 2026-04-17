import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { apiRequest } from '../../../shared/api/apiClient.js'
import {
  buildCanvasSavePayload,
  mapBoardViewToColumns,
  mapCanvasDocumentToState,
  mapPlanSummaryToRecord,
  mergeBoardIntoPlan,
  mergePlanDetails,
} from '../../../shared/contracts/backendAdapters.js'
import { normalizePlanRecord } from '../../../shared/contracts/planContracts.js'
import { createInitialPlansSnapshot } from '../data/plansRepository.js'

const PlansContext = createContext(null)
const INITIAL_PLANS = createInitialPlansSnapshot()

function setPlanById(plans, planId, updater) {
  return plans.map((plan) => {
    if (plan.id !== planId) return plan
    const nextPlan = typeof updater === 'function' ? updater(plan) : updater
    return normalizePlanRecord(nextPlan)
  })
}

export function PlansProvider({ children }) {
  const { accessToken, isAuthenticated, isDemoSession, currentUser, workspace, isReady } = useAuth()
  const backendEnabled = isAuthenticated && !isDemoSession
  const [plans, setPlans] = useState([])
  const [activePlanId, setActivePlanId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const plansById = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans])
  const activePlan = plansById.get(activePlanId) ?? plans[0] ?? null
  const mode = !isReady ? 'boot' : backendEnabled ? 'backend' : 'demo'

  useLayoutEffect(() => {
    if (mode === 'boot') {
      setPlans([])
      setActivePlanId(null)
      setIsLoading(true)
      return
    }

    if (mode === 'demo') {
      setPlans(INITIAL_PLANS)
      setActivePlanId((current) => (
        current && INITIAL_PLANS.some((plan) => plan.id === current)
          ? current
          : INITIAL_PLANS[0]?.id ?? null
      ))
      setIsLoading(false)
      return
    }

    setPlans([])
    setActivePlanId(null)
    setIsLoading(true)
  }, [mode])

  useEffect(() => {
    let active = true

    async function hydrateBackendPlans() {
      if (mode !== 'backend') {
        return
      }

      try {
        const summaries = await apiRequest('/api/plans', {
          token: accessToken,
        })

        if (!active) return

        const mappedPlans = summaries.map((summary, index) => mapPlanSummaryToRecord(summary, index))
        setPlans(mappedPlans)
        setActivePlanId((current) => {
          if (current && mappedPlans.some((plan) => plan.id === current)) {
            return current
          }
          return mappedPlans[0]?.id ?? null
        })
      } catch {
        if (!active) return
        setPlans([])
        setActivePlanId(null)
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    hydrateBackendPlans()

    return () => {
      active = false
    }
  }, [accessToken, mode])

  const createPlan = useCallback(async (data) => {
    if (!backendEnabled) {
      const newPlan = normalizePlanRecord({
        ...data,
        id: crypto.randomUUID?.() ?? `plan-${Math.random().toString(36).slice(2, 10)}`,
      })
      setPlans((prev) => [newPlan, ...prev])
      setActivePlanId(newPlan.id)
      return newPlan
    }

    const created = await apiRequest('/api/plans', {
      method: 'POST',
      token: accessToken,
      body: {
        name: data.name,
        description: data.description ?? '',
      },
    })

    const basePlan = mapPlanSummaryToRecord(created.plan, plans.length)
    const hydratedPlan = mergePlanDetails(basePlan, created)
    const nextPlan = data.coverThemeId
      ? {
          ...hydratedPlan,
          cover: data.cover ?? hydratedPlan.cover,
          coverThemeId: data.coverThemeId,
        }
      : hydratedPlan

    setPlans((prev) => [nextPlan, ...prev])
    setActivePlanId(nextPlan.id)
    return nextPlan
  }, [accessToken, backendEnabled, plans.length])

  const selectPlan = useCallback((planId) => {
    setActivePlanId(planId)
  }, [])

  const getPlanById = useCallback((planId) => {
    if (!planId) return null
    return plansById.get(planId) ?? null
  }, [plansById])

  const updatePlan = useCallback((planId, updater) => {
    setPlans((prev) => setPlanById(prev, planId, updater))
  }, [])

  const updatePlanBoard = useCallback((planId, updater) => {
    updatePlan(planId, (plan) => {
      const nextColumns = typeof updater === 'function' ? updater(plan.boardColumns) : updater
      return { ...plan, boardColumns: nextColumns }
    })
  }, [updatePlan])

  const updatePlanCanvas = useCallback((planId, updater) => {
    updatePlan(planId, (plan) => {
      const nextCanvasState = typeof updater === 'function' ? updater(plan.canvasState) : updater
      return { ...plan, canvasState: nextCanvasState }
    })
  }, [updatePlan])

  const ensurePlanDetails = useCallback(async (planId) => {
    if (!backendEnabled) {
      return getPlanById(planId)
    }

    const currentPlan = plansById.get(planId)
    if (!currentPlan) return null
    if (currentPlan.membersMeta?.length || currentPlan.labelsMeta?.length) {
      return currentPlan
    }

    const details = await apiRequest(`/api/plans/${planId}`, {
      token: accessToken,
    })

    let mergedPlan = null
    setPlans((prev) => prev.map((plan) => {
      if (plan.id !== planId) return plan
      mergedPlan = mergePlanDetails(plan, details)
      return mergedPlan
    }))
    return mergedPlan
  }, [accessToken, backendEnabled, getPlanById, plansById])

  const loadPlanBoard = useCallback(async (planId) => {
    if (!backendEnabled || !planId) {
      return getPlanById(planId)?.boardColumns ?? []
    }

    await ensurePlanDetails(planId)
    const boardView = await apiRequest(`/api/plans/${planId}/board`, {
      token: accessToken,
    })

    setPlans((prev) => prev.map((plan) => (
      plan.id === planId ? mergeBoardIntoPlan(plan, boardView) : plan
    )))

    return mapBoardViewToColumns(boardView)
  }, [accessToken, backendEnabled, ensurePlanDetails, getPlanById])

  const applyBoardView = useCallback((planId, boardView) => {
    setPlans((prev) => prev.map((plan) => (
      plan.id === planId ? mergeBoardIntoPlan(plan, boardView) : plan
    )))
  }, [])

  const loadPlanCanvas = useCallback(async (planId) => {
    if (!backendEnabled || !planId) {
      return getPlanById(planId)?.canvasState ?? null
    }

    const canvasDocument = await apiRequest(`/api/plans/${planId}/canvas`, {
      token: accessToken,
    })

    const canvasState = mapCanvasDocumentToState(canvasDocument)
    setPlans((prev) => prev.map((plan) => (
      plan.id === planId
        ? {
            ...plan,
            canvasState,
            canvasVersion: canvasDocument.version,
            canvasLoaded: true,
          }
        : plan
    )))

    return canvasState
  }, [accessToken, backendEnabled, getPlanById])

  const savePlanCanvas = useCallback(async (planId, canvasState) => {
    if (!backendEnabled || !planId) {
      updatePlanCanvas(planId, canvasState)
      return canvasState
    }

    const currentPlan = plansById.get(planId)
    const canvasDocument = await apiRequest(`/api/plans/${planId}/canvas`, {
      method: 'PUT',
      token: accessToken,
      body: buildCanvasSavePayload(canvasState, currentPlan?.canvasVersion ?? 0),
    })

    const nextCanvasState = mapCanvasDocumentToState(canvasDocument)
    setPlans((prev) => prev.map((plan) => (
      plan.id === planId
        ? {
            ...plan,
            canvasState: nextCanvasState,
            canvasVersion: canvasDocument.version,
            canvasLoaded: true,
          }
        : plan
    )))

    return nextCanvasState
  }, [accessToken, backendEnabled, plansById, updatePlanCanvas])

  const value = useMemo(() => ({
    plans,
    activePlan,
    activePlanId,
    currentUser,
    workspace,
    isLoading,
    isBackendDriven: backendEnabled,
    createPlan,
    getPlanById,
    selectPlan,
    updatePlan,
    updatePlanBoard,
    updatePlanCanvas,
    ensurePlanDetails,
    loadPlanBoard,
    applyBoardView,
    loadPlanCanvas,
    savePlanCanvas,
  }), [
    activePlan,
    activePlanId,
    applyBoardView,
    backendEnabled,
    createPlan,
    currentUser,
    ensurePlanDetails,
    getPlanById,
    isLoading,
    loadPlanBoard,
    loadPlanCanvas,
    plans,
    savePlanCanvas,
    selectPlan,
    updatePlan,
    updatePlanBoard,
    updatePlanCanvas,
    workspace,
  ])

  return <PlansContext.Provider value={value}>{children}</PlansContext.Provider>
}

export function usePlans() {
  const context = useContext(PlansContext)

  if (!context) {
    throw new Error('usePlans must be used within a PlansProvider')
  }

  return context
}
