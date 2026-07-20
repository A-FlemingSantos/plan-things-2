import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClientError } from '@plan-things/shared-client/api'

const mobileApiMock = vi.hoisted(() => ({
  mobileApiRequest: vi.fn(),
}))

const linkingMock = vi.hoisted(() => ({
  addEventListener: vi.fn(),
  getInitialURL: vi.fn(),
  openURL: vi.fn(),
}))

const secureStoreMock = vi.hoisted(() => ({
  deleteItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}))

vi.mock('react-native', () => ({
  Linking: linkingMock,
  Platform: { OS: 'web' },
}))

vi.mock('expo-secure-store', () => secureStoreMock)

vi.mock('../../../../mobile/src/services/api.js', () => ({
  mobileApiRequest: mobileApiMock.mobileApiRequest,
}))

const { AuthProvider, useAuth } = await import('../../../../mobile/src/providers/AuthProvider.js')

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

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('mobile auth provider parity', () => {
  beforeEach(() => {
    mobileApiMock.mobileApiRequest.mockReset()
    linkingMock.getInitialURL.mockReset()
    linkingMock.addEventListener.mockReset()
    linkingMock.openURL.mockReset()
    secureStoreMock.getItemAsync.mockReset()
    secureStoreMock.setItemAsync.mockReset()
    secureStoreMock.deleteItemAsync.mockReset()
    window.localStorage.clear()
    vi.useRealTimers()

    linkingMock.getInitialURL.mockResolvedValue(null)
    linkingMock.addEventListener.mockReturnValue({ remove: vi.fn() })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the stored session when bootstrap refresh fails transiently', async () => {
    const expiresLater = Date.now() + (60 * 60 * 1000)
    const storedToken = createAccessToken(expiresLater)

    window.localStorage.setItem('plan-things.session', JSON.stringify({
      accessToken: storedToken,
      user: { id: 'user-1', fullName: 'Arthur Santos' },
      workspace: { id: 'workspace-1', name: 'Workspace antigo' },
      demo: false,
    }))

    mobileApiMock.mobileApiRequest.mockRejectedValueOnce(new Error('network unavailable'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    expect(mobileApiMock.mobileApiRequest).toHaveBeenCalledWith('/api/auth/refresh', {
      method: 'POST',
      token: storedToken,
    })
    expect(result.current.sessionMode).toBe('authenticated')
    expect(result.current.accessToken).toBe(storedToken)
    expect(result.current.currentUser?.fullName).toBe('Arthur Santos')
    expect(JSON.parse(window.localStorage.getItem('plan-things.session'))).toMatchObject({
      accessToken: storedToken,
      user: { fullName: 'Arthur Santos' },
      workspace: { name: 'Workspace antigo' },
      demo: false,
    })
  })

  it('reads the active session from the web versioned account store', async () => {
    const expiresLater = Date.now() + (60 * 60 * 1000)
    const primaryToken = createAccessToken(expiresLater)
    const secondaryToken = createAccessToken(expiresLater + (60 * 1000))

    window.localStorage.setItem('plan-things.session', JSON.stringify({
      version: 2,
      activeAccountId: 'user-2',
      accounts: [
        {
          accessToken: primaryToken,
          user: { id: 'user-1', fullName: 'Arthur Santos' },
          workspace: { id: 'workspace-1', name: 'Workspace Arthur' },
          demo: false,
        },
        {
          accessToken: secondaryToken,
          user: { id: 'user-2', fullName: 'Bruna Costa' },
          workspace: { id: 'workspace-2', name: 'Workspace Bruna' },
          demo: false,
        },
      ],
    }))

    mobileApiMock.mobileApiRequest.mockResolvedValueOnce({
      accessToken: secondaryToken,
      user: { id: 'user-2', fullName: 'Bruna Costa' },
      workspace: { id: 'workspace-2', name: 'Workspace Bruna' },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    expect(mobileApiMock.mobileApiRequest).toHaveBeenCalledWith('/api/auth/refresh', {
      method: 'POST',
      token: secondaryToken,
    })
    expect(result.current.sessionMode).toBe('authenticated')
    expect(result.current.currentUser?.fullName).toBe('Bruna Costa')
    expect(result.current.workspace?.name).toBe('Workspace Bruna')
  })

  it('renews the token before expiration', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-09T12:00:00.000Z'))

    const initialToken = createAccessToken(Date.now() + (60 * 1000))
    const renewedToken = createAccessToken(Date.now() + (2 * 60 * 60 * 1000))

    window.localStorage.setItem('plan-things.session', JSON.stringify({
      accessToken: initialToken,
      user: { id: 'user-1', fullName: 'Arthur Santos' },
      workspace: { id: 'workspace-1', name: 'Workspace' },
      demo: false,
    }))

    mobileApiMock.mobileApiRequest
      .mockResolvedValueOnce({
        accessToken: initialToken,
        user: { id: 'user-1', fullName: 'Arthur Santos' },
        workspace: { id: 'workspace-1', name: 'Workspace' },
      })
      .mockResolvedValueOnce({
        accessToken: renewedToken,
        user: { id: 'user-1', fullName: 'Arthur Santos' },
        workspace: { id: 'workspace-1', name: 'Workspace' },
      })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(result.current.isReady).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
      await Promise.resolve()
    })

    expect(mobileApiMock.mobileApiRequest).toHaveBeenCalledTimes(2)
    expect(mobileApiMock.mobileApiRequest).toHaveBeenLastCalledWith('/api/auth/refresh', {
      method: 'POST',
      token: initialToken,
    })
    expect(result.current.sessionMode).toBe('authenticated')
    expect(result.current.accessToken).toBe(renewedToken)
  })

  it('clears the session on auth refresh failures', async () => {
    const storedToken = createAccessToken(Date.now() + (60 * 60 * 1000))

    window.localStorage.setItem('plan-things.session', JSON.stringify({
      accessToken: storedToken,
      user: { id: 'user-1', fullName: 'Arthur Santos' },
      workspace: { id: 'workspace-1', name: 'Workspace' },
      demo: false,
    }))

    mobileApiMock.mobileApiRequest.mockRejectedValueOnce(new ApiClientError('expired', {
      status: 401,
    }))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    expect(result.current.sessionMode).toBe('anonymous')
    expect(result.current.accessToken).toBeNull()
    expect(window.localStorage.getItem('plan-things.session')).toBeNull()
  })

  it('stores logout redirects in memory and maps them to auth screen modes', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    const loginToken = createAccessToken(Date.now() + (60 * 60 * 1000))
    mobileApiMock.mobileApiRequest.mockResolvedValueOnce({
      accessToken: loginToken,
      user: { id: 'user-1', fullName: 'Arthur Santos' },
      workspace: { id: 'workspace-1', name: 'Workspace' },
    })

    await act(async () => {
      await result.current.login({
        email: 'arthur@example.com',
        password: 'segredo123',
      })
    })

    await act(async () => {
      await result.current.logout({
        redirectTo: '/cadastro',
        replace: false,
      })
    })

    expect(result.current.sessionMode).toBe('anonymous')
    expect(result.current.pendingLogoutRedirect).toEqual({
      to: '/cadastro',
      replace: false,
    })
  })
})
