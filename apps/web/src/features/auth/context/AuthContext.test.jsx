import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}))

vi.mock('../../../shared/api/apiClient.js', () => {
  class ApiClientError extends Error {
    constructor(message, options = {}) {
      super(message)
      this.name = 'ApiClientError'
      this.status = options.status ?? 500
    }
  }

  return {
    ApiClientError,
    apiRequest: apiMock.apiRequest,
  }
})

const { AuthProvider, useAuth } = await import('./AuthContext.jsx')
const { ApiClientError } = await import('../../../shared/api/apiClient.js')

function createAccessToken(expiresAtMs) {
  const header = toBase64Url({ alg: 'HS256', typ: 'JWT' })
  const payload = toBase64Url({ exp: Math.floor(expiresAtMs / 1000) })
  return `${header}.${payload}.signature`
}

function toBase64Url(value) {
  return window.btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function createSession({
  token,
  userId,
  fullName,
  email,
  workspaceId = `workspace-${userId}`,
  workspaceName = `Workspace de ${fullName}`,
  demo = false,
}) {
  return {
    accessToken: token,
    user: {
      id: userId,
      fullName,
      email,
      locale: 'pt-BR',
      timeZone: 'America/Sao_Paulo',
    },
    workspace: {
      id: workspaceId,
      name: workspaceName,
    },
    demo,
  }
}

function createStoredAccountStore(accounts, activeAccountId = accounts[0]?.user?.id ?? null) {
  return {
    version: 2,
    activeAccountId,
    accounts,
  }
}

function readStoredValue() {
  const rawValue = window.localStorage.getItem('plan-things.session')
  return rawValue ? JSON.parse(rawValue) : null
}

function readActiveStoredSession() {
  const storedValue = readStoredValue()
  if (!storedValue) return null
  if (!Array.isArray(storedValue.accounts)) return storedValue
  return storedValue.accounts.find((account) => account.user?.id === storedValue.activeAccountId) ?? null
}

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('AuthProvider', () => {
  beforeEach(() => {
    apiMock.apiRequest.mockReset()
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('refreshes a legacy stored session during bootstrap and persists a versioned store', async () => {
    const expiresLater = Date.now() + (60 * 60 * 1000)
    const storedToken = createAccessToken(expiresLater)
    const refreshedToken = createAccessToken(expiresLater + (60 * 60 * 1000))

    window.localStorage.setItem('plan-things.session', JSON.stringify(
      createSession({
        token: storedToken,
        userId: 'user-1',
        fullName: 'Arthur Santos',
        email: 'arthur@example.com',
      }),
    ))

    apiMock.apiRequest.mockResolvedValueOnce({
      accessToken: refreshedToken,
      user: { id: 'user-1', fullName: 'Arthur Fleming', email: 'arthur@example.com' },
      workspace: { id: 'workspace-1', name: 'Workspace novo' },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    expect(apiMock.apiRequest).toHaveBeenCalledWith('/api/auth/refresh', {
      method: 'POST',
      token: storedToken,
    })
    expect(result.current.sessionMode).toBe('authenticated')
    expect(result.current.currentUser?.fullName).toBe('Arthur Fleming')
    expect(readStoredValue()).toMatchObject({
      version: 2,
      activeAccountId: 'user-1',
    })
    expect(readActiveStoredSession()).toMatchObject({
      accessToken: refreshedToken,
      user: { fullName: 'Arthur Fleming' },
      workspace: { name: 'Workspace novo' },
      demo: false,
    })
  })

  it('keeps the active stored session when bootstrap refresh fails transiently', async () => {
    const expiresLater = Date.now() + (60 * 60 * 1000)
    const storedToken = createAccessToken(expiresLater)
    const storedSession = createSession({
      token: storedToken,
      userId: 'user-1',
      fullName: 'Arthur Santos',
      email: 'arthur@example.com',
    })

    window.localStorage.setItem('plan-things.session', JSON.stringify(
      createStoredAccountStore([storedSession]),
    ))

    apiMock.apiRequest.mockRejectedValueOnce(new Error('network unavailable'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    expect(apiMock.apiRequest).toHaveBeenCalledTimes(1)
    expect(result.current.sessionMode).toBe('authenticated')
    expect(result.current.accessToken).toBe(storedToken)
    expect(result.current.currentUser?.fullName).toBe('Arthur Santos')
    expect(readStoredValue()).toMatchObject({
      version: 2,
      activeAccountId: 'user-1',
      accounts: [expect.objectContaining({
        accessToken: storedToken,
      })],
    })
  })

  it('renews the token before expiration while the active user stays selected', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-09T12:00:00.000Z'))

    const initialToken = createAccessToken(Date.now() + (60 * 1000))
    const renewedToken = createAccessToken(Date.now() + (2 * 60 * 60 * 1000))
    const storedSession = createSession({
      token: initialToken,
      userId: 'user-1',
      fullName: 'Arthur Santos',
      email: 'arthur@example.com',
    })

    window.localStorage.setItem('plan-things.session', JSON.stringify(
      createStoredAccountStore([storedSession]),
    ))

    apiMock.apiRequest
      .mockResolvedValueOnce(storedSession)
      .mockResolvedValueOnce({
        accessToken: renewedToken,
        user: { id: 'user-1', fullName: 'Arthur Santos', email: 'arthur@example.com' },
        workspace: { id: 'workspace-1', name: 'Workspace' },
      })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.isReady).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
      await Promise.resolve()
    })

    expect(apiMock.apiRequest).toHaveBeenCalledTimes(2)
    expect(apiMock.apiRequest).toHaveBeenLastCalledWith('/api/auth/refresh', {
      method: 'POST',
      token: initialToken,
    })
    expect(result.current.accessToken).toBe(renewedToken)
    expect(result.current.activeAccountId).toBe('user-1')
  })

  it('queues a home redirect when the active account expires and a saved account becomes active', async () => {
    const expiresLater = Date.now() + (60 * 60 * 1000)
    const activeSession = createSession({
      token: createAccessToken(expiresLater),
      userId: 'user-1',
      fullName: 'Arthur Santos',
      email: 'arthur@example.com',
    })
    const secondarySession = createSession({
      token: createAccessToken(expiresLater + (60 * 1000)),
      userId: 'user-2',
      fullName: 'Bruna Costa',
      email: 'bruna@example.com',
    })

    window.localStorage.setItem('plan-things.session', JSON.stringify(
      createStoredAccountStore([activeSession, secondarySession], 'user-1'),
    ))

    apiMock.apiRequest.mockRejectedValueOnce(new ApiClientError('expired', {
      status: 401,
    }))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    expect(result.current.activeAccountId).toBe('user-2')
    expect(result.current.currentUser?.fullName).toBe('Bruna Costa')
    expect(result.current.savedAccounts.map((account) => account.accountId)).toEqual(['user-2'])
    expect(result.current.pendingAccountRedirect).toEqual({
      accountId: 'user-2',
      replace: true,
    })
  })

  it('exposes anonymous mode when no session is stored', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    expect(result.current.sessionMode).toBe('anonymous')
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.pendingLogoutRedirect).toBeNull()
  })

  it('exposes demo mode after a test-environment login and persists a versioned store', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    await act(async () => {
      await result.current.login({
        email: 'arthur@example.com',
        password: 'segredo123',
      })
    })

    expect(result.current.sessionMode).toBe('demo')
    expect(result.current.isDemoSession).toBe(true)
    expect(result.current.activeAccountId).toBe('demo-user-arthur-example-com')
    expect(readStoredValue()).toMatchObject({
      version: 2,
      activeAccountId: 'demo-user-arthur-example-com',
      accounts: [expect.objectContaining({
        user: expect.objectContaining({
          id: 'demo-user-arthur-example-com',
        }),
      })],
    })
  })

  it('adds a second account via add-account login and activates it immediately', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    await act(async () => {
      await result.current.login({
        email: 'arthur@example.com',
        password: 'segredo123',
      })
    })

    await act(async () => {
      await result.current.login({
        email: 'bruna@example.com',
        password: 'segredo456',
      }, {
        mode: 'add-account',
      })
    })

    expect(result.current.activeAccountId).toBe('demo-user-bruna-example-com')
    expect(result.current.currentUser?.email).toBe('bruna@example.com')
    expect(result.current.savedAccounts.map((account) => account.accountId)).toEqual([
      'demo-user-arthur-example-com',
      'demo-user-bruna-example-com',
    ])
    expect(readStoredValue()).toMatchObject({
      version: 2,
      activeAccountId: 'demo-user-bruna-example-com',
      accounts: expect.arrayContaining([
        expect.objectContaining({ user: expect.objectContaining({ email: 'arthur@example.com' }) }),
        expect.objectContaining({ user: expect.objectContaining({ email: 'bruna@example.com' }) }),
      ]),
    })
  })

  it('re-authenticating the same account in add-account mode updates it without duplicating entries', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    await act(async () => {
      await result.current.login({
        email: 'arthur@example.com',
        password: 'segredo123',
      })
    })

    await act(async () => {
      await result.current.login({
        email: 'arthur@example.com',
        password: 'segredo123',
      }, {
        mode: 'add-account',
      })
    })

    expect(result.current.savedAccounts).toHaveLength(1)
    expect(readStoredValue().accounts).toHaveLength(1)
  })

  it('adds a second account through OAuth completion in add-account mode', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    await act(async () => {
      await result.current.login({
        email: 'arthur@example.com',
        password: 'segredo123',
      })
    })

    await act(async () => {
      await result.current.completeOAuthLogin('demo-google-oauth-code', {
        mode: 'add-account',
      })
    })

    expect(result.current.activeAccountId).toBe('demo-user-google-example-com')
    expect(result.current.savedAccounts.map((account) => account.accountId)).toEqual([
      'demo-user-arthur-example-com',
      'demo-user-google-example-com',
    ])
  })

  it('switches to a saved account after refreshing its stored token', async () => {
    const expiresLater = Date.now() + (60 * 60 * 1000)
    const activeSession = createSession({
      token: createAccessToken(expiresLater),
      userId: 'user-1',
      fullName: 'Arthur Santos',
      email: 'arthur@example.com',
    })
    const secondarySession = createSession({
      token: createAccessToken(expiresLater + (60 * 1000)),
      userId: 'user-2',
      fullName: 'Bruna Costa',
      email: 'bruna@example.com',
    })

    window.localStorage.setItem('plan-things.session', JSON.stringify(
      createStoredAccountStore([activeSession, secondarySession], 'user-1'),
    ))

    apiMock.apiRequest
      .mockResolvedValueOnce(activeSession)
      .mockResolvedValueOnce({
        accessToken: createAccessToken(expiresLater + (2 * 60 * 60 * 1000)),
        user: { id: 'user-2', fullName: 'Bruna Costa', email: 'bruna@example.com' },
        workspace: { id: 'workspace-user-2', name: 'Workspace de Bruna' },
      })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    await act(async () => {
      await result.current.switchAccount('user-2')
    })

    expect(result.current.activeAccountId).toBe('user-2')
    expect(result.current.currentUser?.fullName).toBe('Bruna Costa')
    expect(apiMock.apiRequest).toHaveBeenLastCalledWith('/api/auth/refresh', {
      method: 'POST',
      token: secondarySession.accessToken,
    })
  })

  it('removes an expired saved account during switch and keeps the current one active', async () => {
    const expiresLater = Date.now() + (60 * 60 * 1000)
    const activeSession = createSession({
      token: createAccessToken(expiresLater),
      userId: 'user-1',
      fullName: 'Arthur Santos',
      email: 'arthur@example.com',
    })
    const secondarySession = createSession({
      token: createAccessToken(expiresLater + (60 * 1000)),
      userId: 'user-2',
      fullName: 'Bruna Costa',
      email: 'bruna@example.com',
    })

    window.localStorage.setItem('plan-things.session', JSON.stringify(
      createStoredAccountStore([activeSession, secondarySession], 'user-1'),
    ))

    apiMock.apiRequest
      .mockResolvedValueOnce(activeSession)
      .mockRejectedValueOnce(new ApiClientError('expired', {
        status: 401,
      }))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    let receivedError = null

    await act(async () => {
      try {
        await result.current.switchAccount('user-2')
      } catch (error) {
        receivedError = error
      }
    })

    expect(receivedError?.message).toBe(
      'Nao foi possivel acessar essa conta. A sessao expirou e ela foi removida.',
    )
    expect(result.current.activeAccountId).toBe('user-1')
    expect(result.current.savedAccounts.map((account) => account.accountId)).toEqual(['user-1'])
    expect(readStoredValue()).toMatchObject({
      version: 2,
      activeAccountId: 'user-1',
      accounts: [expect.objectContaining({
        user: expect.objectContaining({ id: 'user-1' }),
      })],
    })
  })

  it('clears all saved accounts and stores a pending redirect when logout is explicit', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    await act(async () => {
      await result.current.login({
        email: 'arthur@example.com',
        password: 'segredo123',
      })
      await result.current.login({
        email: 'bruna@example.com',
        password: 'segredo456',
      }, {
        mode: 'add-account',
      })
    })

    act(() => {
      result.current.logout({
        redirectTo: '/login',
        replace: true,
      })
    })

    expect(result.current.accessToken).toBeNull()
    expect(result.current.sessionMode).toBe('anonymous')
    expect(result.current.savedAccounts).toHaveLength(0)
    expect(window.localStorage.getItem('plan-things.session')).toBeNull()
    expect(result.current.pendingLogoutRedirect).toEqual({
      to: '/login',
      replace: true,
    })
  })
})
