import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ApiClientError, apiRequest } from '../../../shared/api/apiClient.js'
import { normalizePathname } from '../../../shared/config/routes.js'
import { resolveSessionMode } from '../utils/sessionMode.js'

const SESSION_STORAGE_KEY = 'plan-things.session'
const ACCOUNT_STORE_VERSION = 2
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000
const TOKEN_REFRESH_RETRY_MS = 30 * 1000
const MIN_TOKEN_REFRESH_DELAY_MS = 5 * 1000
const DEFAULT_AUTH_MODE = 'default'
const ADD_ACCOUNT_AUTH_MODE = 'add-account'
const AuthContext = createContext(null)

function isTestEnvironment() {
  return import.meta.env.MODE === 'test'
}

function buildDemoAccountKey(value = '') {
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'demo'
}

function deriveDemoOAuthIdentity(code) {
  const provider = String(code)
    .trim()
    .toLowerCase()
    .replace(/^demo-/, '')
    .replace(/-oauth-code$/, '')
  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1)

  return {
    fullName: `${providerLabel} Demo`,
    email: `${provider}@example.com`,
  }
}

function createDemoSession(mode, values = {}) {
  const fallbackName = values.fullName?.trim() || 'Arthur Santos'
  const fallbackEmail = values.email?.trim() || 'arthur@example.com'
  const accountKey = buildDemoAccountKey(fallbackEmail)
  const storageQuotaBytes = 2 * 1024 * 1024 * 1024

  return {
    accessToken: `demo-${mode}-${accountKey}-token`,
    user: {
      id: `demo-user-${accountKey}`,
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
      id: `demo-workspace-${accountKey}`,
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

function createEmptyAccountStore() {
  return {
    version: ACCOUNT_STORE_VERSION,
    activeAccountId: null,
    accounts: [],
  }
}

function getAccountId(session) {
  if (!session?.user?.id) return null
  return String(session.user.id)
}

function normalizeSession(session) {
  const accountId = getAccountId(session)
  if (!accountId) return null

  return {
    ...session,
    user: {
      ...session.user,
      id: accountId,
    },
    workspace: session.workspace ? { ...session.workspace } : null,
    demo: Boolean(session.demo),
  }
}

function normalizeAccountStore(store) {
  if (!store || typeof store !== 'object') {
    return createEmptyAccountStore()
  }

  const accounts = Array.isArray(store.accounts)
    ? store.accounts.map((account) => normalizeSession(account)).filter(Boolean)
    : []

  const uniqueAccounts = []
  const seenAccountIds = new Set()

  for (const account of accounts) {
    const accountId = getAccountId(account)
    if (!accountId || seenAccountIds.has(accountId)) continue
    seenAccountIds.add(accountId)
    uniqueAccounts.push(account)
  }

  const requestedActiveId = store.activeAccountId ? String(store.activeAccountId) : null
  const hasRequestedActive = requestedActiveId && uniqueAccounts.some((account) => getAccountId(account) === requestedActiveId)
  const activeAccountId = hasRequestedActive ? requestedActiveId : (getAccountId(uniqueAccounts[0]) ?? null)

  return {
    version: ACCOUNT_STORE_VERSION,
    activeAccountId,
    accounts: uniqueAccounts,
  }
}

function normalizeLegacySession(value) {
  const normalizedSession = normalizeSession(value)
  if (!normalizedSession) {
    return createEmptyAccountStore()
  }

  return {
    version: ACCOUNT_STORE_VERSION,
    activeAccountId: getAccountId(normalizedSession),
    accounts: [normalizedSession],
  }
}

function readAccountStore() {
  try {
    const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!rawValue) {
      return createEmptyAccountStore()
    }

    const parsed = JSON.parse(rawValue)
    if (parsed?.version === ACCOUNT_STORE_VERSION && Array.isArray(parsed?.accounts)) {
      return normalizeAccountStore(parsed)
    }

    return normalizeLegacySession(parsed)
  } catch {
    return createEmptyAccountStore()
  }
}

function persistAccountStore(store) {
  const normalizedStore = normalizeAccountStore(store)

  if (!normalizedStore.accounts.length) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalizedStore))
}

function getActiveSession(store) {
  const normalizedStore = normalizeAccountStore(store)
  return normalizedStore.accounts.find((account) => getAccountId(account) === normalizedStore.activeAccountId) ?? null
}

function activateStoredAccount(store, accountId) {
  return normalizeAccountStore({
    ...normalizeAccountStore(store),
    activeAccountId: accountId ? String(accountId) : null,
  })
}

function upsertStoredAccount(store, session) {
  const normalizedStore = normalizeAccountStore(store)
  const normalizedSession = normalizeSession(session)
  if (!normalizedSession) {
    return normalizedStore
  }

  const accountId = getAccountId(normalizedSession)
  const nextAccounts = normalizedStore.accounts.filter((account) => getAccountId(account) !== accountId)
  nextAccounts.push(normalizedSession)

  return normalizeAccountStore({
    version: ACCOUNT_STORE_VERSION,
    activeAccountId: accountId,
    accounts: nextAccounts,
  })
}

function removeStoredAccount(store, accountId) {
  const normalizedStore = normalizeAccountStore(store)
  const targetAccountId = accountId ? String(accountId) : null
  const nextAccounts = normalizedStore.accounts.filter((account) => getAccountId(account) !== targetAccountId)
  const nextActiveId = normalizedStore.activeAccountId === targetAccountId
    ? (getAccountId(nextAccounts[0]) ?? null)
    : normalizedStore.activeAccountId

  return normalizeAccountStore({
    version: ACCOUNT_STORE_VERSION,
    activeAccountId: nextActiveId,
    accounts: nextAccounts,
  })
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
  const [accountStore, setAccountStore] = useState(() => readAccountStore())
  const [isReady, setIsReady] = useState(false)
  const [pendingLogoutRedirect, setPendingLogoutRedirect] = useState(null)
  const [pendingAccountRedirect, setPendingAccountRedirect] = useState(null)
  const accountStoreRef = useRef(accountStore)

  const saveAccountStore = useCallback((nextStore) => {
    const normalizedStore = normalizeAccountStore(nextStore)
    accountStoreRef.current = normalizedStore
    setAccountStore(normalizedStore)
    persistAccountStore(normalizedStore)
    if (getActiveSession(normalizedStore)?.accessToken) {
      setPendingLogoutRedirect(null)
    }
    return normalizedStore
  }, [])

  const clearPendingLogoutRedirect = useCallback(() => {
    setPendingLogoutRedirect(null)
  }, [])

  const clearPendingAccountRedirect = useCallback(() => {
    setPendingAccountRedirect(null)
  }, [])

  const saveAccountStoreAfterAccountRemoval = useCallback((store, removedAccountId) => {
    const previousStore = normalizeAccountStore(store)
    const targetAccountId = removedAccountId ? String(removedAccountId) : null
    const savedStore = saveAccountStore(removeStoredAccount(previousStore, targetAccountId))

    if (
      targetAccountId
      && previousStore.activeAccountId === targetAccountId
      && savedStore.activeAccountId
      && savedStore.activeAccountId !== targetAccountId
    ) {
      setPendingAccountRedirect({
        accountId: savedStore.activeAccountId,
        replace: true,
      })
    }

    return savedStore
  }, [saveAccountStore])

  const reloadStoredSession = useCallback(() => {
    const storedStore = readAccountStore()
    saveAccountStore(storedStore)
    return getActiveSession(storedStore)
  }, [saveAccountStore])

  const saveAuthenticatedSession = useCallback((nextSession, options = {}) => {
    const mode = options.mode === ADD_ACCOUNT_AUTH_MODE ? ADD_ACCOUNT_AUTH_MODE : DEFAULT_AUTH_MODE
    const normalizedSession = normalizeSession(nextSession)

    if (!normalizedSession) {
      return null
    }

    if (mode === ADD_ACCOUNT_AUTH_MODE) {
      const mergedStore = upsertStoredAccount(accountStoreRef.current, normalizedSession)
      saveAccountStore(activateStoredAccount(mergedStore, getAccountId(normalizedSession)))
      clearPendingAccountRedirect()
      return normalizedSession
    }

    saveAccountStore({
      version: ACCOUNT_STORE_VERSION,
      activeAccountId: getAccountId(normalizedSession),
      accounts: [normalizedSession],
    })
    clearPendingAccountRedirect()
    return normalizedSession
  }, [clearPendingAccountRedirect, saveAccountStore])

  useEffect(() => {
    accountStoreRef.current = accountStore
  }, [accountStore])

  const session = getActiveSession(accountStore)

  useEffect(() => {
    let active = true

    async function bootstrap() {
      const storedStore = readAccountStore()
      const storedSession = getActiveSession(storedStore)

      if (!storedSession?.accessToken || storedSession.demo) {
        if (active) {
          saveAccountStore(storedStore)
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

        saveAccountStore(
          activateStoredAccount(
            upsertStoredAccount(storedStore, {
              ...refreshedSession,
              demo: false,
            }),
            refreshedSession?.user?.id ?? storedSession.user.id,
          ),
        )
      } catch (error) {
        if (!active) return

        if (shouldClearSessionAfterRefreshFailure(error, storedSession.accessToken)) {
          saveAccountStoreAfterAccountRemoval(storedStore, storedSession.user.id)
        } else {
          saveAccountStore(storedStore)
        }
      } finally {
        if (active) {
          setIsReady(true)
        }
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [saveAccountStore, saveAccountStoreAfterAccountRemoval])

  useEffect(() => {
    if (!session?.accessToken || session.demo) {
      return undefined
    }

    const accessToken = session.accessToken
    const accountId = getAccountId(session)
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

        const latestStore = accountStoreRef.current
        saveAccountStore(
          activateStoredAccount(
            upsertStoredAccount(latestStore, {
              ...refreshedSession,
              demo: false,
            }),
            refreshedSession?.user?.id ?? accountId,
          ),
        )
      } catch (error) {
        if (!active) return

        if (shouldClearSessionAfterRefreshFailure(error, accessToken)) {
          saveAccountStoreAfterAccountRemoval(accountStoreRef.current, accountId)
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
  }, [saveAccountStore, saveAccountStoreAfterAccountRemoval, session?.accessToken, session?.demo, session?.user?.id])

  const patchSession = useCallback(({ user, workspace } = {}) => {
    if (!session) return null

    const nextSession = {
      ...session,
      user: user ? { ...session.user, ...user } : session.user,
      workspace: workspace ? { ...session.workspace, ...workspace } : session.workspace,
    }

    saveAccountStore(
      activateStoredAccount(
        upsertStoredAccount(accountStoreRef.current, nextSession),
        getAccountId(nextSession),
      ),
    )

    return nextSession
  }, [saveAccountStore, session])

  const switchAccount = useCallback(async (accountId) => {
    const targetAccountId = accountId ? String(accountId) : null
    if (!targetAccountId) {
      throw new Error('Conta nao encontrada.')
    }

    const currentStore = accountStoreRef.current
    const targetAccount = currentStore.accounts.find((account) => getAccountId(account) === targetAccountId)
    if (!targetAccount) {
      throw new Error('Conta nao encontrada.')
    }

    if (currentStore.activeAccountId === targetAccountId) {
      return targetAccount
    }

    if (targetAccount.demo || !targetAccount.accessToken) {
      saveAccountStore(activateStoredAccount(currentStore, targetAccountId))
      return targetAccount
    }

    try {
      const refreshedSession = await apiRequest('/api/auth/refresh', {
        method: 'POST',
        token: targetAccount.accessToken,
      })

      const normalizedSession = {
        ...refreshedSession,
        demo: false,
      }
      const refreshedAccountId = getAccountId(normalizedSession) ?? targetAccountId

      saveAccountStore(
        activateStoredAccount(
          upsertStoredAccount(accountStoreRef.current, normalizedSession),
          refreshedAccountId,
        ),
      )

      return normalizedSession
    } catch (error) {
      if (shouldClearSessionAfterRefreshFailure(error, targetAccount.accessToken)) {
        saveAccountStore(removeStoredAccount(accountStoreRef.current, targetAccountId))
        throw new Error('Nao foi possivel acessar essa conta. A sessao expirou e ela foi removida.')
      }

      throw error
    }
  }, [saveAccountStore])

  const login = useCallback(async (credentials, options = {}) => {
    if (isTestEnvironment()) {
      return saveAuthenticatedSession(createDemoSession('login', credentials), options)
    }

    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: {
        ...credentials,
        client: 'web',
      },
    })

    return saveAuthenticatedSession({
      ...response,
      demo: false,
    }, options)
  }, [saveAuthenticatedSession])

  const register = useCallback(async (payload, options = {}) => {
    if (isTestEnvironment()) {
      return saveAuthenticatedSession(createDemoSession('register', payload), options)
    }

    const response = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: {
        ...payload,
        client: 'web',
      },
    })

    return saveAuthenticatedSession({
      ...response,
      demo: false,
    }, options)
  }, [saveAuthenticatedSession])

  const forgotPassword = useCallback(async (email) => {
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
  }, [])

  const resetPassword = useCallback(async (token, newPassword) => {
    if (isTestEnvironment()) {
      return {
        message: 'Senha atualizada em modo de teste.',
      }
    }

    return apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword },
    })
  }, [])

  const startOAuthLogin = useCallback(async (provider, options = {}) => {
    if (isTestEnvironment()) {
      const redirectSuffix = options.redirectTo ? `&redirectTo=${encodeURIComponent(options.redirectTo)}` : ''
      return {
        authorizationUrl: `${window.location.origin}/oauth/callback?code=demo-${provider}-oauth-code${redirectSuffix}`,
      }
    }

    return apiRequest(`/api/auth/oauth/${provider}/start`, {
      method: 'POST',
      body: {
        redirectTo: options.redirectTo,
        client: 'web',
      },
    })
  }, [])

  const completeOAuthLogin = useCallback(async (code, options = {}) => {
    if (isTestEnvironment() && String(code).startsWith('demo-')) {
      return saveAuthenticatedSession(
        createDemoSession('oauth', deriveDemoOAuthIdentity(code)),
        options,
      )
    }

    const response = await apiRequest('/api/auth/oauth/exchange', {
      method: 'POST',
      body: { code },
    })

    return saveAuthenticatedSession({
      ...response,
      demo: false,
    }, options)
  }, [saveAuthenticatedSession])

  const logout = useCallback(async (options = {}) => {
    const redirectTo = normalizeLogoutRedirect(options.redirectTo)
    const accountsToRevoke = accountStoreRef.current.accounts.filter((account) => (
      Boolean(account?.accessToken) && !account.demo
    ))

    saveAccountStore(createEmptyAccountStore())
    if (redirectTo) {
      setPendingLogoutRedirect({
        to: redirectTo,
        replace: options.replace !== false,
      })
    } else {
      clearPendingLogoutRedirect()
    }

    if (accountsToRevoke.length === 0) {
      return
    }

    await Promise.allSettled(accountsToRevoke.map((account) => (
      apiRequest('/api/auth/logout', {
        method: 'POST',
        token: account.accessToken,
      })
    )))
  }, [clearPendingLogoutRedirect, saveAccountStore])

  const sessionMode = resolveSessionMode({
    session,
    isReady,
  })

  const savedAccounts = useMemo(() => (
    accountStore.accounts.map((account) => ({
      ...account,
      accountId: getAccountId(account),
    }))
  ), [accountStore.accounts])

  const value = useMemo(() => ({
    accessToken: session?.accessToken ?? null,
    currentUser: session?.user ?? null,
    workspace: session?.workspace ?? null,
    activeAccountId: accountStore.activeAccountId,
    savedAccounts,
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
    reloadStoredSession,
    switchAccount,
    patchSession,
    logout,
    pendingLogoutRedirect,
    clearPendingLogoutRedirect,
    pendingAccountRedirect,
    clearPendingAccountRedirect,
  }), [
    accountStore.activeAccountId,
    clearPendingAccountRedirect,
    clearPendingLogoutRedirect,
    completeOAuthLogin,
    reloadStoredSession,
    forgotPassword,
    isReady,
    login,
    logout,
    patchSession,
    pendingAccountRedirect,
    pendingLogoutRedirect,
    register,
    resetPassword,
    savedAccounts,
    session,
    sessionMode,
    startOAuthLogin,
    switchAccount,
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
