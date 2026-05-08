import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Linking, Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { mobileApiRequest } from '../services/api'

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
  const sessionRef = useRef(null)

  const saveSession = useCallback(async (nextSession) => {
    const normalized = normalizeSession(nextSession)
    sessionRef.current = normalized
    setSession(normalized)
    await persistSession(normalized)
    return normalized
  }, [])

  const logout = useCallback(async () => {
    sessionRef.current = null
    setSession(null)
    await persistSession(null)
  }, [])

  const bootstrap = useCallback(async () => {
    const storedSession = await readStoredSession()

    if (!storedSession?.accessToken) {
      setIsReady(true)
      return
    }

    try {
      const currentUser = await mobileApiRequest('/api/me', {
        token: storedSession.accessToken,
      })

      await saveSession({
        ...storedSession,
        user: currentUser.user,
        workspace: currentUser.workspace,
      })
    } catch {
      await logout()
    } finally {
      setIsReady(true)
    }
  }, [logout, saveSession])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

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
      await completeOAuthLogin(payload.code)
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/')
      }
    }
  }, [completeOAuthLogin])

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleIncomingUrl(url)
      if (!url && Platform.OS === 'web' && typeof window !== 'undefined') {
        handleIncomingUrl(window.location.href)
      }
    })
    const subscription = Linking.addEventListener('url', ({ url }) => handleIncomingUrl(url))
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

  const value = useMemo(() => ({
    accessToken: session?.accessToken ?? null,
    currentUser: session?.user ?? null,
    workspace: session?.workspace ?? null,
    session,
    isAuthenticated: Boolean(session?.accessToken),
    isReady,
    oauthRedirectTo,
    oauthError,
    clearOAuthError,
    login,
    register,
    startOAuthLogin,
    completeOAuthLogin,
    patchSession,
    logout,
  }), [clearOAuthError, completeOAuthLogin, isReady, login, logout, oauthError, oauthRedirectTo, patchSession, register, session, startOAuthLogin])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
