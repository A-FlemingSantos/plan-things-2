import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlans } from '../context/PlansContext.jsx'

export function useResolvedPlanRoute({ planId, buildPath }) {
  const navigate = useNavigate()
  const { plans, activePlanId, getPlanById, selectPlan } = usePlans()
  const fallbackPlan = plans[0] ?? null
  const activePlan = getPlanById(planId ?? activePlanId) ?? fallbackPlan

  useEffect(() => {
    if (!plans.length) return

    if (!planId) {
      navigate(buildPath(activePlan?.id ?? fallbackPlan?.id), { replace: true })
      return
    }

    if (!activePlan) {
      navigate(buildPath(fallbackPlan?.id), { replace: true })
      return
    }

    if (activePlanId !== activePlan.id) {
      selectPlan(activePlan.id)
    }
  }, [activePlan, activePlanId, buildPath, fallbackPlan, navigate, planId, plans.length, selectPlan])

  const openPlan = useCallback((nextPlanId) => {
    selectPlan(nextPlanId)
    navigate(buildPath(nextPlanId))
  }, [buildPath, navigate, selectPlan])

  return {
    plans,
    activePlan,
    openPlan,
  }
}
