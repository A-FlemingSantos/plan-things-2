import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePlans } from '../../features/workspace/context/PlansContext.jsx'
import { buildCanvasPath } from '../config/routes.js'
import { getActiveWorkspaceNav, WORKSPACE_NAV_PATHS } from '../config/workspaceNavigation.js'

export function useWorkspaceNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { activePlanId, plans } = usePlans()
  const routeActiveNav = getActiveWorkspaceNav(location.pathname)
  const [activeNav, setActiveNav] = useState(routeActiveNav)

  useEffect(() => {
    setActiveNav(routeActiveNav)
  }, [routeActiveNav])

  const handleNavItemClick = useCallback((id) => {
    if (id === 'canvas') {
      navigate(buildCanvasPath(activePlanId ?? plans[0]?.id))
      return
    }

    const nextPath = WORKSPACE_NAV_PATHS[id]

    if (nextPath) {
      navigate(nextPath)
      return
    }

    setActiveNav(id)
  }, [activePlanId, navigate, plans])

  return {
    activeNav,
    handleNavItemClick,
  }
}
