import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../../shared/api/apiClient.js'

const SESSION_STORAGE_KEY = 'plan-things.session'
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

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession())
  const [isReady, setIsReady] = useState(false)

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
        const currentUser = await apiRequest('/api/me', {
          token: storedSession.accessToken,
        })

        if (!active) return

        const nextSession = {
          ...storedSession,
          user: currentUser.user,
          workspace: currentUser.workspace,
          demo: false,
        }

        setSession(nextSession)
        persistSession(nextSession)
      } catch {
        if (!active) return
        setSession(null)
        persistSession(null)
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
  }, [])

  const saveSession = (nextSession) => {
    setSession(nextSession)
    persistSession(nextSession)
    return nextSession
  }

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

  const logout = () => {
    saveSession(null)
  }

  const value = useMemo(() => ({
    accessToken: session?.accessToken ?? null,
    currentUser: session?.user ?? null,
    workspace: session?.workspace ?? null,
    isAuthenticated: Boolean(session?.accessToken),
    isDemoSession: Boolean(session?.demo),
    isReady,
    login,
    register,
    forgotPassword,
    resetPassword,
    startOAuthLogin,
    completeOAuthLogin,
    patchSession,
    logout,
  }), [isReady, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
