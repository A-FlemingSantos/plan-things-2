import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { getActiveWorkspaceNav } from '../config/workspaceNavigation.js'

export function useWorkspaceNavigation() {
  const location = useLocation()
  const activeNav = useMemo(
    () => getActiveWorkspaceNav(location.pathname, location.search),
    [location.pathname, location.search],
  )

  return { activeNav }
}
