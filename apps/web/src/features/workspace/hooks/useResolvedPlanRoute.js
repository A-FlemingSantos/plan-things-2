import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlans } from '../context/PlansContext.jsx'

export function useResolvedPlanRoute({ planId, buildPath }) {
  const navigate = useNavigate()
  const { plans, activePlanId, getPlanById, selectPlan } = usePlans()
  const fallbackPlan = plans[0] ?? null
  const routePlan = planId ? getPlanById(planId) : null
  const selectedPlan = getPlanById(activePlanId) ?? null
  const activePlan = routePlan ?? selectedPlan ?? fallbackPlan

  useEffect(() => {
    if (!plans.length) return

    if (!planId) {
      navigate(buildPath(activePlan?.id ?? fallbackPlan?.id), { replace: true })
      return
    }

    if (!routePlan) {
      const replacementPlan = selectedPlan ?? fallbackPlan
      navigate(buildPath(replacementPlan?.id), { replace: true })
      if (replacementPlan && activePlanId !== replacementPlan.id) {
        selectPlan(replacementPlan.id)
      }
      return
    }

    if (activePlanId !== routePlan.id) {
      selectPlan(routePlan.id)
    }
  }, [activePlan, activePlanId, buildPath, fallbackPlan, navigate, planId, plans.length, routePlan, selectPlan, selectedPlan])

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
