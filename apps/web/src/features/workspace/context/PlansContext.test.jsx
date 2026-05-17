import { act, renderHook, waitFor } from '@testing-library/react'
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

  it('fetches members when board labels were loaded before plan details', async () => {
    const planId = '11111111-1111-4111-8111-111111111111'
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
        id: planId,
        name: 'Plano compartilhado',
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

    await act(async () => {
      result.current.applyBoardView(planId, {
        columns: [],
        labels: [
          {
            id: 'label-1',
            name: 'Urgente',
            color: '#ff6766',
          },
        ],
        inboxItems: [],
      })
    })

    expect(result.current.activePlan.labelsMeta).toHaveLength(1)
    expect(result.current.activePlan.membersMeta).toEqual([])

    apiMock.apiRequest.mockResolvedValueOnce({
      plan: {
        id: planId,
        name: 'Plano compartilhado',
        description: 'Sincronizado da API',
        role: 'OWNER',
        memberCount: 2,
        taskCount: 5,
        createdAt: { iso: '2026-05-09T12:00:00.000Z' },
        updatedAt: { iso: '2026-05-09T12:00:00.000Z' },
      },
      members: [
        {
          userId: 'user-1',
          fullName: 'Arthur Santos',
          email: 'arthur@example.com',
          role: 'OWNER',
        },
        {
          userId: 'user-2',
          fullName: 'Bruna Lima',
          email: 'bruna@example.com',
          role: 'MEMBER',
        },
      ],
      labels: [
        {
          id: 'label-1',
          name: 'Urgente',
          color: '#ff6766',
        },
      ],
    })

    let loadedPlan = null
    await act(async () => {
      loadedPlan = await result.current.ensurePlanDetails(planId)
    })

    expect(apiMock.apiRequest).toHaveBeenLastCalledWith(`/api/plans/${planId}`, {
      token: 'real-token',
    })
    expect(loadedPlan.membersMeta.map((member) => member.email)).toEqual([
      'arthur@example.com',
      'bruna@example.com',
    ])
    expect(result.current.activePlan.detailsLoaded).toBe(true)
  })

  it('updates board columns without renormalizing every card in the plan', async () => {
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

    await act(async () => {
      result.current.applyBoardView('plan-1', {
        columns: [
          {
            id: 'col-1',
            title: 'Backlog',
            color: '',
            position: 0,
            cards: [
              {
                id: 'card-1',
                columnId: 'col-1',
                position: 0,
                title: 'Card 1',
                description: '',
                completed: false,
                starred: false,
                kind: 'CARTAO',
                assignees: [],
                comments: [],
                checklists: [
                  {
                    id: 'checklist-1',
                    title: 'Checklist',
                    position: 0,
                    items: [],
                  },
                ],
                attachments: [
                  {
                    id: 'att-1',
                    fileId: 'file-1',
                    name: 'briefing.pdf',
                    type: 'FILE',
                    mimeType: 'application/pdf',
                    sizeBytes: 1200,
                    attachedBy: 'Arthur',
                    attachedByCurrentUser: true,
                    canRemove: true,
                    createdAt: null,
                  },
                ],
                label: null,
                startAt: null,
                dueAt: null,
              },
            ],
          },
          {
            id: 'col-2',
            title: 'Doing',
            color: '',
            position: 1,
            cards: [
              {
                id: 'card-2',
                columnId: 'col-2',
                position: 0,
                title: 'Card 2',
                description: '',
                completed: false,
                starred: false,
                kind: 'CARTAO',
                assignees: [],
                comments: [],
                checklists: [],
                attachments: [],
                label: null,
                startAt: null,
                dueAt: null,
              },
            ],
          },
        ],
        labels: [],
        inboxItems: [],
      })
    })

    const initialFirstCard = result.current.activePlan.boardColumns[0].cards[0]
    const untouchedColumn = result.current.activePlan.boardColumns[1]
    const untouchedCard = untouchedColumn.cards[0]

    await act(async () => {
      result.current.updatePlanBoard('plan-1', (prev) => prev.map((column) => {
        if (column.id !== 'col-1') {
          return column
        }

        return {
          ...column,
          cards: column.cards.map((card) => (
            card.id === 'card-1'
              ? { ...card, title: 'Card 1 atualizado' }
              : card
          )),
        }
      }))
    })

    expect(result.current.activePlan.boardColumns[1]).toBe(untouchedColumn)
    expect(result.current.activePlan.boardColumns[1].cards[0]).toBe(untouchedCard)
    expect(result.current.activePlan.boardColumns[0].cards[0]).not.toBe(initialFirstCard)
    expect(result.current.activePlan.boardColumns[0].cards[0]).toMatchObject({
      id: 'card-1',
      title: 'Card 1 atualizado',
    })
    expect(result.current.activePlan.boardColumns[0].cards[0].attachments).toEqual([
      expect.objectContaining({
        id: 'att-1',
        name: 'briefing.pdf',
      }),
    ])
    expect(result.current.activePlan.boardColumns[0].cards[0].checklists).toEqual([
      expect.objectContaining({
        id: 'checklist-1',
        title: 'Checklist',
      }),
    ])
  })

  it('keeps loadPlanBoard stable across local board updates', async () => {
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

    const initialLoadPlanBoard = result.current.loadPlanBoard

    await act(async () => {
      result.current.updatePlanBoard('plan-1', [
        {
          id: 'col-1',
          title: 'Backlog',
          color: '',
          cards: [],
        },
      ])
    })

    expect(result.current.loadPlanBoard).toBe(initialLoadPlanBoard)
  })
})
