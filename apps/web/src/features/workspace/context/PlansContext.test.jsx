import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}))

const authState = vi.hoisted(() => ({
  current: {
    accessToken: null,
    currentUser: null,
    workspace: null,
    isAuthenticated: false,
    isDemoSession: false,
    isReady: true,
    sessionMode: 'anonymous',
  },
}))

const preferencesState = vi.hoisted(() => ({
  current: {
    generalPreferences: {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      dateFormat: 'dd/MM/yyyy',
    },
  },
}))

vi.mock('../../auth/context/AuthContext.jsx', () => ({
  useAuth: () => authState.current,
}))

vi.mock('../../preferences/context/PreferencesContext.jsx', () => ({
  usePreferences: () => preferencesState.current,
}))

vi.mock('../../../shared/api/apiClient.js', () => ({
  apiRequest: apiMock.apiRequest,
}))

const { PlansProvider, usePlans } = await import('./PlansContext.jsx')

function wrapper({ children }) {
  return <PlansProvider>{children}</PlansProvider>
}

describe('PlansProvider', () => {
  beforeEach(() => {
    apiMock.apiRequest.mockReset()
    authState.current = {
      accessToken: null,
      currentUser: null,
      workspace: null,
      isAuthenticated: false,
      isDemoSession: false,
      isReady: true,
      sessionMode: 'anonymous',
    }
  })

  it('keeps the plans store empty for anonymous sessions', async () => {
    const { result } = renderHook(() => usePlans(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.plans).toEqual([])
    expect(result.current.activePlan).toBeNull()
    expect(result.current.isBackendDriven).toBe(false)
  })

  it('hydrates the local snapshot for demo sessions', async () => {
    authState.current = {
      accessToken: 'demo-token',
      currentUser: {
        id: 'demo-user',
        fullName: 'Arthur Santos',
      },
      workspace: {
        id: 'demo-workspace',
        name: 'Workspace demo',
      },
      isAuthenticated: true,
      isDemoSession: true,
      isReady: true,
      sessionMode: 'demo',
    }

    const { result } = renderHook(() => usePlans(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.plans.length).toBeGreaterThan(0)
    expect(result.current.activePlan).not.toBeNull()
    expect(result.current.isBackendDriven).toBe(false)
  })

  it('hydrates plans from the backend for authenticated sessions', async () => {
    authState.current = {
      accessToken: 'real-token',
      currentUser: {
        id: 'user-1',
        fullName: 'Arthur Santos',
      },
      workspace: {
        id: 'workspace-1',
        name: 'Workspace real',
      },
      isAuthenticated: true,
      isDemoSession: false,
      isReady: true,
      sessionMode: 'authenticated',
    }

    apiMock.apiRequest.mockResolvedValueOnce([
      {
        id: 'plan-1',
        name: 'Plano backend',
        description: 'Sincronizado da API',
        role: 'OWNER',
        memberCount: 2,
        taskCount: 5,
        createdAt: { iso: '2026-05-09T12:00:00.000Z' },
        updatedAt: { iso: '2026-05-09T12:00:00.000Z' },
      },
    ])

    const { result } = renderHook(() => usePlans(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(apiMock.apiRequest).toHaveBeenCalledWith('/api/plans', {
      token: 'real-token',
    })
    expect(result.current.isBackendDriven).toBe(true)
    expect(result.current.plans).toHaveLength(1)
    expect(result.current.plans[0].name).toBe('Plano backend')
  })
})
