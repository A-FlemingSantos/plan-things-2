import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { readSessionModeFromAuthState } from '../../auth/utils/sessionMode.js'
import { usePreferences } from '../../preferences/context/PreferencesContext.jsx'
import { apiRequest } from '../../../shared/api/apiClient.js'
import {
  mapBoardViewToColumns,
  mapPlanSummaryToRecord,
  mergeBoardIntoPlan,
  mergePlanDetails,
} from '../../../shared/contracts/backendAdapters.js'
import { normalizePlanRecord } from '../../../shared/contracts/planContracts.js'
import { createInitialPlansSnapshot } from '../data/plansRepository.js'

const PlansContext = createContext(null)
const INITIAL_PLANS = createInitialPlansSnapshot()
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function setPlanById(plans, planId, updater) {
  return plans.map((plan) => {
    if (plan.id !== planId) return plan
    const nextPlan = typeof updater === 'function' ? updater(plan) : updater
    return normalizePlanRecord(nextPlan)
  })
}

function isBackendPlanId(planId) {
  return typeof planId === 'string' && UUID_PATTERN.test(planId)
}

export function PlansProvider({ children }) {
  const auth = useAuth()
  const { accessToken, currentUser, workspace } = auth
  const { generalPreferences } = usePreferences()
  const sessionMode = readSessionModeFromAuthState(auth)
  const backendEnabled = sessionMode === 'authenticated'
  const demoEnabled = sessionMode === 'demo'
  const [plans, setPlans] = useState([])
  const [activePlanId, setActivePlanId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [aiChips, setAiChips] = useState([])
  const boardMappingOptions = useMemo(() => ({
    locale: generalPreferences.language,
    timeZone: generalPreferences.timezone,
    dateFormat: generalPreferences.dateFormat,
  }), [
    generalPreferences.dateFormat,
    generalPreferences.language,
    generalPreferences.timezone,
  ])
  const plansById = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans])
  const plansByIdRef = useRef(plansById)
  plansByIdRef.current = plansById
  const activePlan = plansById.get(activePlanId) ?? plans[0] ?? null
  const sessionKey = backendEnabled ? `${currentUser?.id ?? 'anonymous'}:${accessToken ?? ''}` : sessionMode

  const ensureInteractiveSession = useCallback(() => {
    if (demoEnabled) {
      return 'demo'
    }

    if (backendEnabled) {
      return 'authenticated'
    }

    throw new Error('Faça login para acessar os planos.')
  }, [backendEnabled, demoEnabled])

  useLayoutEffect(() => {
    setAiChips([])

    if (sessionMode === 'boot') {
      setPlans([])
      setActivePlanId(null)
      setIsLoading(true)
      return
    }

    if (demoEnabled) {
      setPlans(INITIAL_PLANS)
      setActivePlanId((current) => (
        current && INITIAL_PLANS.some((plan) => plan.id === current)
          ? current
          : INITIAL_PLANS[0]?.id ?? null
      ))
      setIsLoading(false)
      return
    }

    if (sessionMode === 'anonymous') {
      setPlans([])
      setActivePlanId(null)
      setIsLoading(false)
      return
    }

    setPlans([])
    setActivePlanId(null)
    setIsLoading(true)
  }, [demoEnabled, sessionKey, sessionMode])

  useEffect(() => {
    let active = true

    async function hydrateBackendPlans() {
      if (!backendEnabled) {
        return
      }

      const requestSessionKey = sessionKey

      try {
        const summaries = await apiRequest('/api/plans', {
          token: accessToken,
        })

        if (!active || requestSessionKey !== sessionKey) return

        const mappedPlans = summaries.map((summary, index) => mapPlanSummaryToRecord(summary, index))
        setPlans(mappedPlans)
        setActivePlanId((current) => {
          if (current && mappedPlans.some((plan) => plan.id === current)) {
            return current
          }
          return mappedPlans[0]?.id ?? null
        })
      } catch {
        if (!active || requestSessionKey !== sessionKey) return
        setPlans([])
        setActivePlanId(null)
      } finally {
        if (active && requestSessionKey === sessionKey) {
          setIsLoading(false)
        }
      }
    }

    hydrateBackendPlans()

    return () => {
      active = false
    }
  }, [accessToken, backendEnabled, sessionKey])

  const createPlan = useCallback(async (data) => {
    if (ensureInteractiveSession() === 'demo') {
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
        coverThemeId: data.coverThemeId ?? null,
        cover: data.cover ?? null,
        coverImageId: data.coverImageId ?? null,
      },
    })

    const basePlan = mapPlanSummaryToRecord(created.plan, plans.length)
    const hydratedPlan = mergePlanDetails(basePlan, created)
    const nextPlan = hydratedPlan

    setPlans((prev) => [nextPlan, ...prev])
    setActivePlanId(nextPlan.id)
    return nextPlan
  }, [accessToken, ensureInteractiveSession, plans.length])

  const deletePlan = useCallback(async (planId) => {
    if (!planId) return

    ensureInteractiveSession()

    if (backendEnabled) {
      await apiRequest(`/api/plans/${planId}`, {
        method: 'DELETE',
        token: accessToken,
      })
    }

    let nextPlansSnapshot = []
    setPlans((prev) => {
      const nextPlans = prev.filter((plan) => plan.id !== planId)
      nextPlansSnapshot = nextPlans
      setActivePlanId((current) => (current === planId ? (nextPlans[0]?.id ?? null) : current))
      return nextPlans
    })

    return nextPlansSnapshot
  }, [accessToken, backendEnabled, ensureInteractiveSession])

  const renamePlan = useCallback(async (planId, name) => {
    const trimmedName = name?.trim()
    if (!planId || !trimmedName) {
      throw new Error('Informe um nome para o plano.')
    }

    const currentPlan = plansById.get(planId)
    if (!currentPlan) {
      throw new Error('Plano nao encontrado.')
    }

    if (ensureInteractiveSession() === 'demo') {
      const renamedPlan = normalizePlanRecord({ ...currentPlan, name: trimmedName })
      setPlans((prev) => setPlanById(prev, planId, renamedPlan))
      return renamedPlan
    }

    const response = await apiRequest(`/api/plans/${planId}`, {
      method: 'PATCH',
      token: accessToken,
      body: {
        name: trimmedName,
        description: currentPlan.description ?? '',
        coverThemeId: currentPlan.coverThemeId ?? null,
        cover: currentPlan.cover ?? null,
        coverImageId: currentPlan.coverImageId ?? null,
      },
    })

    const responseName = typeof response?.plan?.name === 'string'
      ? response.plan.name.trim()
      : ''
    const renamedPlan = normalizePlanRecord({
      ...mergePlanDetails(currentPlan, response),
      name: responseName || trimmedName,
    })
    setPlans((prev) => setPlanById(prev, planId, renamedPlan))
    return renamedPlan
  }, [accessToken, ensureInteractiveSession, plansById])

  const updatePlanCover = useCallback(async (planId, coverData = {}) => {
    if (!planId) {
      throw new Error('Plano nao encontrado.')
    }

    const currentPlan = plansById.get(planId)
    if (!currentPlan) {
      throw new Error('Plano nao encontrado.')
    }

    const nextCover = coverData.cover ?? currentPlan.cover ?? null
    const nextCoverThemeId = coverData.coverThemeId ?? null
    const nextCoverImageId = coverData.coverImageId ?? null
    const nextPlanPatch = {
      cover: nextCover,
      coverThemeId: nextCoverThemeId,
      coverImageId: nextCoverImageId,
      coverImage: coverData.coverImage ?? null,
      coverImageThumb: coverData.coverImageThumb ?? coverData.coverImage ?? null,
    }

    if (ensureInteractiveSession() === 'demo') {
      const updatedPlan = normalizePlanRecord({
        ...currentPlan,
        ...nextPlanPatch,
      })
      setPlans((prev) => setPlanById(prev, planId, updatedPlan))
      return updatedPlan
    }

    const response = await apiRequest(`/api/plans/${planId}`, {
      method: 'PATCH',
      token: accessToken,
      body: {
        name: currentPlan.name,
        description: currentPlan.description ?? '',
        coverThemeId: nextCoverThemeId,
        cover: nextCover,
        coverImageId: nextCoverImageId,
      },
    })

    const updatedPlan = normalizePlanRecord({
      ...mergePlanDetails(currentPlan, response),
      ...nextPlanPatch,
    })
    setPlans((prev) => setPlanById(prev, planId, updatedPlan))
    return updatedPlan
  }, [accessToken, ensureInteractiveSession, plansById])

  const selectPlan = useCallback((planId) => {
    setActivePlanId(planId)
  }, [])

  const getPlanById = useCallback((planId) => {
    if (!planId) return null
    return plansByIdRef.current.get(planId) ?? null
  }, [])

  const updatePlan = useCallback((planId, updater) => {
    setPlans((prev) => setPlanById(prev, planId, updater))
  }, [])

  const updatePlanBoard = useCallback((planId, updater) => {
    setPlans((prev) => prev.map((plan) => {
      if (plan.id !== planId) return plan
      const nextColumns = typeof updater === 'function' ? updater(plan.boardColumns) : updater
      return { ...plan, boardColumns: nextColumns }
    }))
  }, [])

  const ensurePlanDetails = useCallback(async (planId) => {
    if (!backendEnabled) {
      return plansByIdRef.current.get(planId) ?? null
    }

    if (!isBackendPlanId(planId)) {
      return null
    }

    const currentPlan = plansByIdRef.current.get(planId)
    if (!currentPlan) return null
    if (currentPlan.detailsLoaded) {
      return currentPlan
    }

    const details = await apiRequest(`/api/plans/${planId}`, {
      token: accessToken,
    })

    const latestPlan = plansByIdRef.current.get(planId) ?? currentPlan
    const mergedPlan = mergePlanDetails(latestPlan, details)
    setPlans((prev) => prev.map((plan) => {
      if (plan.id !== planId) return plan
      return mergePlanDetails(plan, details)
    }))
    return mergedPlan
  }, [accessToken, backendEnabled])

  const refreshPlanDetails = useCallback(async (planId) => {
    if (!backendEnabled) {
      return plansByIdRef.current.get(planId) ?? null
    }

    if (!isBackendPlanId(planId)) {
      return null
    }

    const currentPlan = plansByIdRef.current.get(planId)
    if (!currentPlan) return null

    const details = await apiRequest(`/api/plans/${planId}`, {
      token: accessToken,
    })

    const latestPlan = plansByIdRef.current.get(planId) ?? currentPlan
    const mergedPlan = mergePlanDetails(latestPlan, details)
    setPlans((prev) => prev.map((plan) => {
      if (plan.id !== planId) return plan
      return mergePlanDetails(plan, details)
    }))
    return mergedPlan
  }, [accessToken, backendEnabled])

  const refreshPlans = useCallback(async ({ selectPlanId } = {}) => {
    if (!backendEnabled) {
      return plans
    }

    const summaries = await apiRequest('/api/plans', {
      token: accessToken,
    })

    const mappedPlans = summaries.map((summary, index) => mapPlanSummaryToRecord(summary, index))
    setPlans(mappedPlans)

    setActivePlanId((current) => {
      if (selectPlanId && mappedPlans.some((plan) => plan.id === selectPlanId)) {
        return selectPlanId
      }
      if (current && mappedPlans.some((plan) => plan.id === current)) {
        return current
      }
      return mappedPlans[0]?.id ?? null
    })

    return mappedPlans
  }, [accessToken, backendEnabled, plans])

  const loadPlanBoard = useCallback(async (planId) => {
    if (!backendEnabled || !planId) {
      return plansByIdRef.current.get(planId)?.boardColumns ?? []
    }

    if (!isBackendPlanId(planId)) {
      return []
    }

    await ensurePlanDetails(planId)
    const boardView = await apiRequest(`/api/plans/${planId}/board`, {
      token: accessToken,
    })

    setPlans((prev) => prev.map((plan) => (
      plan.id === planId ? mergeBoardIntoPlan(plan, boardView, boardMappingOptions) : plan
    )))

    return mapBoardViewToColumns(boardView, boardMappingOptions)
  }, [accessToken, backendEnabled, boardMappingOptions, ensurePlanDetails])

  const applyBoardView = useCallback((planId, boardView) => {
    setPlans((prev) => prev.map((plan) => (
      plan.id === planId ? mergeBoardIntoPlan(plan, boardView, boardMappingOptions) : plan
    )))
  }, [boardMappingOptions])

  const value = useMemo(() => ({
    plans,
    activePlan,
    activePlanId,
    currentUser,
    workspace,
    isLoading,
    isBackendDriven: backendEnabled,
    aiChips,
    setAiChips,
    createPlan,
    deletePlan,
    renamePlan,
    updatePlanCover,
    getPlanById,
    selectPlan,
    updatePlan,
    updatePlanBoard,
    ensurePlanDetails,
    refreshPlanDetails,
    refreshPlans,
    loadPlanBoard,
    applyBoardView,
  }), [
    activePlan,
    activePlanId,
    aiChips,
    applyBoardView,
    backendEnabled,
    createPlan,
    deletePlan,
    currentUser,
    ensurePlanDetails,
    refreshPlanDetails,
    refreshPlans,
    renamePlan,
    updatePlanCover,
    getPlanById,
    isLoading,
    loadPlanBoard,
    plans,
    selectPlan,
    updatePlan,
    updatePlanBoard,
    updatePlanCover,
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
