export function resolveSessionMode({ session, isReady }) {
  if (!isReady) {
    return 'boot'
  }

  if (!session?.accessToken) {
    return 'anonymous'
  }

  return session.demo ? 'demo' : 'authenticated'
}

export function readSessionModeFromAuthState(authState = {}) {
  if (authState.sessionMode) {
    return authState.sessionMode
  }

  if (authState.isReady === false) {
    return 'boot'
  }

  if (!authState.isAuthenticated) {
    return 'anonymous'
  }

  return authState.isDemoSession ? 'demo' : 'authenticated'
}
