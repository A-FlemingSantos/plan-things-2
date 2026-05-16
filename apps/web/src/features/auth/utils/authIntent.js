const AUTH_INTENT_STORAGE_KEY = 'plan-things.auth.intent'

export function persistAuthIntent(intent) {
  if (!intent) {
    window.sessionStorage.removeItem(AUTH_INTENT_STORAGE_KEY)
    return
  }

  window.sessionStorage.setItem(AUTH_INTENT_STORAGE_KEY, JSON.stringify(intent))
}

export function readAuthIntent() {
  try {
    const rawValue = window.sessionStorage.getItem(AUTH_INTENT_STORAGE_KEY)
    return rawValue ? JSON.parse(rawValue) : null
  } catch {
    return null
  }
}

export function clearAuthIntent() {
  window.sessionStorage.removeItem(AUTH_INTENT_STORAGE_KEY)
}
