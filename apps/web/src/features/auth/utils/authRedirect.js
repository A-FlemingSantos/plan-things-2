import {
  DEFAULT_LOCAL_PREFERENCES,
  readStoredLocalPreferences,
  resolveInitialRouteForState,
} from '../../preferences/context/PreferencesContext.jsx'
import { ROUTES, sanitizeInternalAppRedirect, toRouteString } from '../../../shared/config/routes.js'

export function resolveAccountHomeRoute(accountId) {
  if (!accountId) {
    return ROUTES.workspace
  }

  return resolveInitialRouteForState({
    localPreferences: readStoredLocalPreferences(accountId) ?? DEFAULT_LOCAL_PREFERENCES,
    lastContext: null,
  })
}

export function sanitizeAuthRedirectTarget(value) {
  return sanitizeInternalAppRedirect(value)
}

export function resolveAuthRedirectTarget(value, fallback) {
  return sanitizeAuthRedirectTarget(value) ?? fallback
}

export function resolvePostAuthRoute({
  authMode = 'default',
  redirectTo = null,
  userId = null,
  resolveInitialRoute,
}) {
  if (authMode === 'add-account') {
    return resolveAccountHomeRoute(userId)
  }

  return resolveAuthRedirectTarget(
    redirectTo,
    typeof resolveInitialRoute === 'function' ? resolveInitialRoute(userId) : ROUTES.workspace,
  )
}

export function buildAuthRedirectState(location, extraState = {}, options = {}) {
  const redirectTo = options.includeRedirectTo === false
    ? null
    : sanitizeAuthRedirectTarget(toRouteString(location))

  return {
    ...extraState,
    ...(redirectTo ? { redirectTo } : {}),
  }
}
