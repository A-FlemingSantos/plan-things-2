import { sanitizeInternalAppRedirect, toRouteString } from '../../../shared/config/routes.js'

export function sanitizeAuthRedirectTarget(value) {
  return sanitizeInternalAppRedirect(value)
}

export function resolveAuthRedirectTarget(value, fallback) {
  return sanitizeAuthRedirectTarget(value) ?? fallback
}

export function buildAuthRedirectState(location, extraState = {}) {
  const redirectTo = sanitizeAuthRedirectTarget(toRouteString(location))

  return {
    ...extraState,
    ...(redirectTo ? { redirectTo } : {}),
  }
}
