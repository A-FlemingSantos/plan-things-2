import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createInitialPlansSnapshot, createPlanDraftRecord } from '../data/plansRepository.js'
import { normalizePlanRecord } from '../../../shared/contracts/planContracts.js'

const PlansContext = createContext(null)

const INITIAL_PLANS = createInitialPlansSnapshot()

export function PlansProvider({ children }) {
  const [plans, setPlans] = useState(INITIAL_PLANS)
  const [activePlanId, setActivePlanId] = useState(INITIAL_PLANS[0]?.id ?? null)
  const plansById = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans])
  const activePlan = plansById.get(activePlanId) ?? plans[0] ?? null

  const createPlan = useCallback((data) => {
    const newPlan = createPlanDraftRecord(data)
    setPlans((prev) => [newPlan, ...prev])
    setActivePlanId(newPlan.id)
    return newPlan
  }, [])

  const selectPlan = useCallback((planId) => {
    setActivePlanId(planId)
  }, [])

  const getPlanById = useCallback((planId) => {
    if (!planId) return null
    return plansById.get(planId) ?? null
  }, [plansById])

  const updatePlan = useCallback((planId, updater) => {
    setPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan
        const nextPlan = typeof updater === 'function' ? updater(plan) : updater
        return normalizePlanRecord(nextPlan)
      }),
    )
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

  const value = useMemo(() => ({
    plans,
    activePlan,
    activePlanId,
    createPlan,
    getPlanById,
    selectPlan,
    updatePlan,
    updatePlanBoard,
    updatePlanCanvas,
  }), [activePlan, activePlanId, createPlan, getPlanById, plans, selectPlan, updatePlan, updatePlanBoard, updatePlanCanvas])

  return <PlansContext.Provider value={value}>{children}</PlansContext.Provider>
}

export function usePlans() {
  const context = useContext(PlansContext)

  if (!context) {
    throw new Error('usePlans must be used within a PlansProvider')
  }

  return context
}
