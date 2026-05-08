import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getActiveWorkspaceNav, WORKSPACE_NAV_PATHS } from '../config/workspaceNavigation.js'

export function useWorkspaceNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeActiveNav = getActiveWorkspaceNav(location.pathname)
  const [activeNav, setActiveNav] = useState(routeActiveNav)

  useEffect(() => {
    setActiveNav(routeActiveNav)
  }, [routeActiveNav])

  const handleNavItemClick = useCallback((id) => {
    const nextPath = WORKSPACE_NAV_PATHS[id]

    if (nextPath) {
      navigate(nextPath)
      return
    }

    setActiveNav(id)
  }, [navigate])

  return {
    activeNav,
    handleNavItemClick,
  }
}
