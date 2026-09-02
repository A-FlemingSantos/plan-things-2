import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { buildAuthRedirectState } from '../../auth/utils/authRedirect.js'
import { ApiClientError } from '../../../shared/api/apiClient.js'
import { ROUTES } from '../../../shared/config/routes.js'
import { usePlans } from '../context/PlansContext.jsx'

export function useResolvedPlanRoute({ planId, buildPath }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { plans, activePlanId, getPlanById, selectPlan, loadPlanByKey, isLoading } = usePlans()
  const fallbackPlan = plans[0] ?? null
  const routePlan = planId ? getPlanById(planId) : null
  const selectedPlan = getPlanById(activePlanId) ?? null
  const activePlan = routePlan ?? selectedPlan ?? (!planId ? fallbackPlan : null)
  const loadErrorRef = useRef(false)

  useEffect(() => {
    loadErrorRef.current = false
  }, [planId])

  useEffect(() => {
    if (isLoading) return

    if (!planId) {
      if (!activePlan) return
      navigate(buildPath(activePlan), { replace: true, state: location.state })
      return
    }

    if (routePlan) {
      const canonical = buildPath(routePlan)
      const current = buildPath(planId)
      if (canonical !== current) {
        navigate(canonical, { replace: true, state: location.state })
      }
      if (activePlanId !== routePlan.id) {
        selectPlan(routePlan.id)
      }
      return
    }

    if (!loadPlanByKey || loadErrorRef.current) return

    let cancelled = false
    loadPlanByKey(planId).catch((error) => {
      if (cancelled) return
      loadErrorRef.current = true

      if (error instanceof ApiClientError && error.status === 401) {
        navigate(ROUTES.login, {
          replace: true,
          state: buildAuthRedirectState(location, {
            notice: 'Faça login para abrir este quadro.',
          }),
        })
        return
      }

      if (error instanceof ApiClientError && error.status === 403) {
        navigate(ROUTES.workspace, { replace: true })
      }
    })

    return () => {
      cancelled = true
    }
  }, [
    activePlan,
    activePlanId,
    buildPath,
    isLoading,
    loadPlanByKey,
    location,
    navigate,
    planId,
    routePlan,
    selectPlan,
  ])

  const openPlan = useCallback((nextPlan) => {
    const nextId = typeof nextPlan === 'object' ? nextPlan?.id : nextPlan
    selectPlan(nextId)
    navigate(buildPath(typeof nextPlan === 'object' ? nextPlan : nextId))
  }, [buildPath, navigate, selectPlan])

  return {
    plans,
    activePlan,
    openPlan,
  }
}
