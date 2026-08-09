import { normalizePathname, ROUTES } from '../config/routes.js'

export function buildSettingsPath(section = null) {
  const params = new URLSearchParams()
  if (section) {
    params.set('section', section)
  }

  return `${ROUTES.settings}${params.toString() ? `?${params.toString()}` : ''}`
}

export function navigateToSettingsSection(navigate, location, section = null) {
  const target = buildSettingsPath(section)
  const isOnSettings = normalizePathname(location.pathname) === ROUTES.settings

  if (isOnSettings) {
    navigate(target, {
      replace: true,
      state: location.state,
    })
    return
  }

  navigate(target, {
    state: {
      backgroundLocation: location,
    },
  })
}
