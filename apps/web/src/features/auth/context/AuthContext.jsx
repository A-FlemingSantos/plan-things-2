import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ApiClientError, apiRequest } from '../../../shared/api/apiClient.js'
import { normalizePathname } from '../../../shared/config/routes.js'
import { resolveSessionMode } from '../utils/sessionMode.js'

const SESSION_STORAGE_KEY = 'plan-things.session'
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000
const TOKEN_REFRESH_RETRY_MS = 30 * 1000
const MIN_TOKEN_REFRESH_DELAY_MS = 5 * 1000
const AuthContext = createContext(null)

function isTestEnvironment() {
  return import.meta.env.MODE === 'test'
}

function createDemoSession(mode, values = {}) {
  const fallbackName = values.fullName?.trim() || 'Arthur Santos'
  const fallbackEmail = values.email?.trim() || 'arthur@example.com'
  const storageQuotaBytes = 2 * 1024 * 1024 * 1024

  return {
    accessToken: `demo-${mode}-token`,
    user: {
      id: 'demo-user',
      fullName: fallbackName,
      email: fallbackEmail,
      locale: 'pt-BR',
      timeZone: 'America/Sao_Paulo',
      createdAt: {
        iso: new Date().toISOString(),
        text: new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date()),
      },
    },
    workspace: {
      id: 'demo-workspace',
      name: `Workspace de ${fallbackName}`,
      subscriptionPlan: 'BASIC',
      storageUsedBytes: 0,
      storageQuotaBytes,
      createdAt: {
        iso: new Date().toISOString(),
        text: new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date()),
      },
    },
    demo: true,
  }
}

function readStoredSession() {
  try {
    const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY)
    return rawValue ? JSON.parse(rawValue) : null
  } catch {
    return null
  }
}

function persistSession(session) {
  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

function normalizeLogoutRedirect(value) {
  if (!value) return null

  const text = String(value).trim()
  if (!text.startsWith('/') || text.startsWith('//') || text.includes('://')) {
    return null
  }

  try {
    const url = new URL(text, 'https://planthings.local')
    return `${normalizePathname(url.pathname)}${url.search}${url.hash}`
  } catch {
    return null
  }
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padSize = normalized.length % 4
  const padded = padSize === 0 ? normalized : normalized.padEnd(normalized.length + (4 - padSize), '=')
  return window.atob(padded)
}

function readAccessTokenExpiresAt(accessToken) {
  if (!accessToken) return null

  try {
    const [, payload] = accessToken.split('.')
    if (!payload) return null

    const parsed = JSON.parse(decodeBase64Url(payload))
    return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null
  } catch {
    return null
  }
}

function isAuthFailure(error) {
  return error instanceof ApiClientError && (error.status === 401 || error.status === 403)
}

function shouldClearSessionAfterRefreshFailure(error, accessToken) {
  if (isAuthFailure(error)) {
    return true
  }

  const expiresAt = readAccessTokenExpiresAt(accessToken)
  return expiresAt !== null && expiresAt <= Date.now()
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession())
  const [isReady, setIsReady] = useState(false)
  const [pendingLogoutRedirect, setPendingLogoutRedirect] = useState(null)
  const saveSession = useCallback((nextSession) => {
    setSession(nextSession)
    persistSession(nextSession)
    if (nextSession?.accessToken) {
      setPendingLogoutRedirect(null)
    }
    return nextSession
  }, [])
  const clearPendingLogoutRedirect = useCallback(() => {
    setPendingLogoutRedirect(null)
  }, [])

  useEffect(() => {
    let active = true

    async function bootstrap() {
      const storedSession = readStoredSession()

      if (!storedSession?.accessToken || storedSession.demo) {
        if (active) {
          setSession(storedSession)
          setIsReady(true)
        }
        return
      }

      try {
        const refreshedSession = await apiRequest('/api/auth/refresh', {
          method: 'POST',
          token: storedSession.accessToken,
        })

        if (!active) return

        saveSession({
          ...refreshedSession,
          demo: false,
        })
      } catch (error) {
        if (!active) return

        if (shouldClearSessionAfterRefreshFailure(error, storedSession.accessToken)) {
          saveSession(null)
        }
      } finally {
        if (active) {
          setIsReady(true)
        }
      }
    }

    bootstrap()

    return () => {
      active = false
    }
  }, [saveSession])

  useEffect(() => {
    if (!session?.accessToken || session.demo) {
      return undefined
    }

    const accessToken = session.accessToken
    let active = true
    let timeoutId = null

    const clearRefreshTimer = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }

    const scheduleRefresh = (delayMs) => {
      clearRefreshTimer()
      if (!active) return
      timeoutId = window.setTimeout(refreshSession, Math.max(MIN_TOKEN_REFRESH_DELAY_MS, delayMs))
    }

    async function refreshSession() {
      try {
        const refreshedSession = await apiRequest('/api/auth/refresh', {
          method: 'POST',
          token: accessToken,
        })

        if (!active) return

        saveSession({
          ...refreshedSession,
          demo: false,
        })
      } catch (error) {
        if (!active) return

        if (shouldClearSessionAfterRefreshFailure(error, accessToken)) {
          saveSession(null)
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

  const patchSession = ({ user, workspace } = {}) => {
    if (!session) return null

    const nextSession = {
      ...session,
      user: user ? { ...session.user, ...user } : session.user,
      workspace: workspace ? { ...session.workspace, ...workspace } : session.workspace,
    }

    return saveSession(nextSession)
  }

  const login = async (credentials) => {
    if (isTestEnvironment()) {
      return saveSession(createDemoSession('login', credentials))
    }

    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: {
        ...credentials,
        client: 'web',
      },
    })

    return saveSession({
      ...response,
      demo: false,
    })
  }

  const register = async (payload) => {
    if (isTestEnvironment()) {
      return saveSession(createDemoSession('register', payload))
    }

    const response = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: {
        ...payload,
        client: 'web',
      },
    })

    return saveSession({
      ...response,
      demo: false,
    })
  }

  const forgotPassword = async (email) => {
    if (isTestEnvironment()) {
      return {
        message: 'Enviamos as instrucoes de recuperacao em modo de teste.',
        resetToken: 'demo-reset-token',
      }
    }

    return apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    })
  }

  const resetPassword = async (token, newPassword) => {
    if (isTestEnvironment()) {
      return {
        message: 'Senha atualizada em modo de teste.',
      }
    }

    return apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword },
    })
  }

  const startOAuthLogin = async (provider, options = {}) => {
    if (isTestEnvironment()) {
      return {
        authorizationUrl: `${window.location.origin}/oauth/callback?code=demo-${provider}-oauth-code`,
      }
    }

    return apiRequest(`/api/auth/oauth/${provider}/start`, {
      method: 'POST',
      body: {
        redirectTo: options.redirectTo,
        client: 'web',
      },
    })
  }

  const completeOAuthLogin = async (code) => {
    if (isTestEnvironment() && String(code).startsWith('demo-')) {
      return saveSession(createDemoSession('oauth', {
        fullName: 'Arthur Santos',
        email: 'arthur@example.com',
      }))
    }

    const response = await apiRequest('/api/auth/oauth/exchange', {
      method: 'POST',
      body: { code },
    })

    return saveSession({
      ...response,
      demo: false,
    })
  }

  const logout = (options = {}) => {
    const redirectTo = normalizeLogoutRedirect(options.redirectTo)
    saveSession(null)
    if (redirectTo) {
      setPendingLogoutRedirect({
        to: redirectTo,
        replace: options.replace !== false,
      })
    } else {
      clearPendingLogoutRedirect()
    }
  }

  const sessionMode = resolveSessionMode({
    session,
    isReady,
  })

  const value = useMemo(() => ({
    accessToken: session?.accessToken ?? null,
    currentUser: session?.user ?? null,
    workspace: session?.workspace ?? null,
    isAuthenticated: Boolean(session?.accessToken),
    isDemoSession: Boolean(session?.demo),
    sessionMode,
    isReady,
    login,
    register,
    forgotPassword,
    resetPassword,
    startOAuthLogin,
    completeOAuthLogin,
    patchSession,
    logout,
    pendingLogoutRedirect,
    clearPendingLogoutRedirect,
  }), [
    clearPendingLogoutRedirect,
    completeOAuthLogin,
    forgotPassword,
    isReady,
    login,
    logout,
    patchSession,
    pendingLogoutRedirect,
    register,
    resetPassword,
    session,
    sessionMode,
    startOAuthLogin,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
