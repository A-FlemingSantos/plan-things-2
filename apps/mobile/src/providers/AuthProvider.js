import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Linking, Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { mobileApiRequest } from '../services/api.js'
import {
  MIN_TOKEN_REFRESH_DELAY_MS,
  TOKEN_REFRESH_BUFFER_MS,
  TOKEN_REFRESH_RETRY_MS,
  normalizeLogoutRedirect,
  readAccessTokenExpiresAt,
  resolveSessionMode,
  shouldClearSessionAfterRefreshFailure,
} from './authSessionPolicy.js'

const SESSION_STORAGE_KEY = 'plan-things.session'
const AuthContext = createContext(null)

function withInitials(user = {}) {
  const fullName = user.fullName ?? ''
  const derivedInitials = fullName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'PT'
  return {
    ...user,
    initials: user.initials ?? derivedInitials,
  }
}

function normalizeSession(session) {
  if (!session) return null
  return {
    ...session,
    user: withInitials(session.user),
    workspace: {
      ...session.workspace,
      initial: session.workspace?.initial ?? session.workspace?.name?.[0] ?? 'W',
    },
    demo: false,
  }
}

async function readStoredSession() {
  try {
    if (Platform.OS === 'web') {
      const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY)
      return rawValue ? JSON.parse(rawValue) : null
    }

    const rawValue = await SecureStore.getItemAsync(SESSION_STORAGE_KEY)
    return rawValue ? JSON.parse(rawValue) : null
  } catch {
    return null
  }
}

async function persistSession(session) {
  if (Platform.OS === 'web') {
    if (!session) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    return
  }

  if (!session) {
    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY)
    return
  }

  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(session))
}

function parseOAuthUrl(url) {
  try {
    const parsed = new URL(url)
    const isNativeOAuthCallback = parsed.protocol === 'planthings:' && parsed.hostname === 'oauth' && parsed.pathname === '/callback'
    const isWebOAuthCallback = (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.pathname === '/oauth/callback'
    const isOAuthCallback = isNativeOAuthCallback || isWebOAuthCallback
    if (!isOAuthCallback) return null

    return {
      code: parsed.searchParams.get('code'),
      error: parsed.searchParams.get('error'),
      redirectTo: parsed.searchParams.get('redirectTo'),
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [oauthRedirectTo, setOauthRedirectTo] = useState(null)
  const [oauthError, setOauthError] = useState(null)
  const [pendingLogoutRedirect, setPendingLogoutRedirect] = useState(null)
  const sessionRef = useRef(null)

  const saveSession = useCallback(async (nextSession) => {
    const normalized = normalizeSession(nextSession)
    sessionRef.current = normalized
    setSession(normalized)
    await persistSession(normalized)
    if (normalized?.accessToken) {
      setPendingLogoutRedirect(null)
    }
    return normalized
  }, [])

  const clearPendingLogoutRedirect = useCallback(() => {
    setPendingLogoutRedirect(null)
  }, [])

  const clearSession = useCallback(async () => {
    sessionRef.current = null
    setSession(null)
    await persistSession(null)
  }, [])

  const logout = useCallback(async (options = {}) => {
    const redirectTo = normalizeLogoutRedirect(options.redirectTo)
    await clearSession()
    if (redirectTo) {
      setPendingLogoutRedirect({
        to: redirectTo,
        replace: options.replace !== false,
      })
    } else {
      clearPendingLogoutRedirect()
    }
  }, [clearPendingLogoutRedirect, clearSession])

  const bootstrap = useCallback(async () => {
    const storedSession = normalizeSession(await readStoredSession())

    sessionRef.current = storedSession
    setSession(storedSession)

    if (!storedSession?.accessToken || storedSession.demo) {
      setIsReady(true)
      return
    }

    try {
      const refreshedSession = await mobileApiRequest('/api/auth/refresh', {
        method: 'POST',
        token: storedSession.accessToken,
      })

      await saveSession({
        ...refreshedSession,
        demo: false,
      })
    } catch (error) {
      if (shouldClearSessionAfterRefreshFailure(error, storedSession.accessToken)) {
        await saveSession(null)
      }
    } finally {
      setIsReady(true)
    }
  }, [saveSession])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  useEffect(() => {
    if (!session?.accessToken || session.demo) {
      return undefined
    }

    const accessToken = session.accessToken
    let active = true
    let timeoutId = null

    const clearRefreshTimer = () => {
      if (timeoutId !== null) {
        globalThis.clearTimeout(timeoutId)
      }
    }

    const scheduleRefresh = (delayMs) => {
      clearRefreshTimer()
      if (!active) return
      timeoutId = globalThis.setTimeout(() => {
        void refreshSession()
      }, Math.max(MIN_TOKEN_REFRESH_DELAY_MS, delayMs))
    }

    async function refreshSession() {
      try {
        const refreshedSession = await mobileApiRequest('/api/auth/refresh', {
          method: 'POST',
          token: accessToken,
        })

        if (!active) return

        await saveSession({
          ...refreshedSession,
          demo: false,
        })
      } catch (error) {
        if (!active) return

        if (shouldClearSessionAfterRefreshFailure(error, accessToken)) {
          await saveSession(null)
          return
        }

        scheduleRefresh(TOKEN_REFRESH_RETRY_MS)
      }
    }

    const expiresAt = readAccessTokenExpiresAt(accessToken)
    if (expiresAt === null) {
      scheduleRefresh(TOKEN_REFRESH_RETRY_MS)
    } else {
      scheduleRefresh(expiresAt - Date.now() - TOKEN_REFRESH_BUFFER_MS)
    }

    return () => {
      active = false
      clearRefreshTimer()
    }
  }, [saveSession, session?.accessToken, session?.demo])

  const completeOAuthLogin = useCallback(async (code) => {
    const response = await mobileApiRequest('/api/auth/oauth/exchange', {
      method: 'POST',
      body: { code },
    })

    return saveSession(response)
  }, [saveSession])

  const handleIncomingUrl = useCallback(async (url) => {
    const payload = parseOAuthUrl(url)
    if (!payload) return

    if (payload.redirectTo) {
      setOauthRedirectTo(payload.redirectTo)
    }

    if (payload.error) {
      setOauthError(payload.error)
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/')
      }
      return
    }

    if (payload.code) {
      try {
        await completeOAuthLogin(payload.code)
        setOauthError(null)
      } catch (error) {
        setOauthError(error?.code ?? 'OAUTH_PROVIDER_ERROR')
      } finally {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/')
        }
      }
    }
  }, [completeOAuthLogin])

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        void handleIncomingUrl(url)
        return
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        void handleIncomingUrl(window.location.href)
      }
    })

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleIncomingUrl(url)
    })
    return () => subscription.remove()
  }, [handleIncomingUrl])

  const login = useCallback(async ({ email, password }) => {
    const response = await mobileApiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password, client: 'mobile' },
    })

    return saveSession(response)
  }, [saveSession])

  const register = useCallback(async ({ fullName, email, password }) => {
    const response = await mobileApiRequest('/api/auth/register', {
      method: 'POST',
      body: { fullName, email, password, client: 'mobile' },
    })

    return saveSession(response)
  }, [saveSession])

  const startOAuthLogin = useCallback(async (provider, options = {}) => {
    setOauthError(null)
    const response = await mobileApiRequest(`/api/auth/oauth/${provider}/start`, {
      method: 'POST',
      body: {
        redirectTo: options.redirectTo,
        client: 'mobile',
      },
    })

    if (response?.authorizationUrl) {
      await Linking.openURL(response.authorizationUrl)
    }

    return response
  }, [])

  const clearOAuthError = useCallback(() => {
    setOauthError(null)
  }, [])

  const patchSession = useCallback(async ({ user, workspace } = {}) => {
    const currentSession = sessionRef.current
    if (!currentSession) return null

    return saveSession({
      ...currentSession,
      user: user ? { ...currentSession.user, ...user } : currentSession.user,
      workspace: workspace ? { ...currentSession.workspace, ...workspace } : currentSession.workspace,
    })
  }, [saveSession])

  const sessionMode = resolveSessionMode({
    session,
    isReady,
  })

  const value = useMemo(() => ({
    accessToken: session?.accessToken ?? null,
    currentUser: session?.user ?? null,
    workspace: session?.workspace ?? null,
    session,
    isAuthenticated: Boolean(session?.accessToken),
    isDemoSession: Boolean(session?.demo),
    sessionMode,
    isReady,
    oauthRedirectTo,
    oauthError,
    pendingLogoutRedirect,
    clearOAuthError,
    clearPendingLogoutRedirect,
    login,
    register,
    startOAuthLogin,
    completeOAuthLogin,
    patchSession,
    logout,
  }), [
    clearOAuthError,
    clearPendingLogoutRedirect,
    completeOAuthLogin,
    isReady,
    login,
    logout,
    oauthError,
    oauthRedirectTo,
    patchSession,
    pendingLogoutRedirect,
    register,
    session,
    sessionMode,
    startOAuthLogin,
  ])

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
