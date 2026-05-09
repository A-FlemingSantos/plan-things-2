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

describe('AuthProvider', () => {
  beforeEach(() => {
    apiMock.apiRequest.mockReset()
    window.localStorage.clear()
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('refreshes the stored session during bootstrap', async () => {
    const expiredLater = Date.now() + (60 * 60 * 1000)
    const storedToken = createAccessToken(expiredLater)
    const refreshedToken = createAccessToken(expiredLater + (60 * 60 * 1000))

    window.localStorage.setItem('plan-things.session', JSON.stringify({
      accessToken: storedToken,
      user: { id: 'user-1', fullName: 'Arthur Santos' },
      workspace: { id: 'workspace-1', name: 'Workspace antigo' },
      demo: false,
    }))

    apiMock.apiRequest.mockResolvedValueOnce({
      accessToken: refreshedToken,
      user: { id: 'user-1', fullName: 'Arthur Fleming' },
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
    expect(result.current.accessToken).toBe(refreshedToken)
    expect(result.current.currentUser?.fullName).toBe('Arthur Fleming')

    expect(JSON.parse(window.localStorage.getItem('plan-things.session'))).toMatchObject({
      accessToken: refreshedToken,
      user: { fullName: 'Arthur Fleming' },
      workspace: { name: 'Workspace novo' },
      demo: false,
    })
  })

  it('renews the token before expiration while the user stays active', async () => {
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

    apiMock.apiRequest
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
  })
})
