import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiClientMock = vi.hoisted(() => ({
  ApiClientError: class ApiClientError extends Error {
    constructor(message, options = {}) {
      super(message)
      this.name = 'ApiClientError'
      this.code = options.code
      this.status = options.status
    }
  },
  apiRequest: vi.fn(),
}))

vi.mock('../../../shared/api/apiClient.js', () => ({
  ApiClientError: apiClientMock.ApiClientError,
  apiRequest: apiClientMock.apiRequest,
}))

const { useBoardColumns } = await import('./useBoardColumns.js')

function buildFrontendCard(overrides = {}) {
  return {
    id: 'card-1',
    columnId: 'col-1',
    title: 'Card original',
    description: 'Descricao original',
    isCompleted: false,
    starred: false,
    labelId: '',
    memberIds: [],
    dueDate: '',
    startAt: null,
    dueAt: null,
    comments: [],
    attachments: [],
    checklists: [],
    kind: 'CARTAO',
    schedule: {
      selectedCalendarDay: 7,
      startEnabled: false,
      startDateValue: '',
      dueEnabled: false,
      dueDateValue: '',
      dueTimeValue: '',
      displayLabel: '',
      preserveDisplayLabel: false,
    },
    ...overrides,
  }
}

function buildBackendCardView(overrides = {}) {
  return {
    id: 'card-1',
    columnId: 'col-1',
    title: 'Card original',
    description: 'Descricao original',
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
    ...overrides,
  }
}

describe('useBoardColumns card saves without board reload', () => {
  beforeEach(() => {
    apiClientMock.apiRequest.mockReset()
  })

  it('replaces the saved card locally after PATCH and skips reloading the full board', async () => {
    let boardState = [
      {
        id: 'col-1',
        title: 'Backlog',
        color: '',
        cards: [buildFrontendCard()],
      },
    ]

    const updatePlanBoard = vi.fn((planId, updater) => {
      boardState = typeof updater === 'function' ? updater(boardState) : updater
    })
    const loadPlanBoard = vi.fn()

    apiClientMock.apiRequest.mockResolvedValueOnce(buildBackendCardView({
      title: 'Card salvo pela API',
      description: 'Descricao normalizada',
      label: { id: 'label-1', name: 'Urgente', color: '#ff6766' },
      assignees: [{ id: 'user-1', fullName: 'Arthur Fleming', email: 'arthur@example.com' }],
      dueAt: { iso: '2026-05-18T18:30:00-03:00', text: '18/05/2026 18:30' },
    }))

    const { result } = renderHook(() => useBoardColumns({
      activePlanId: 'plan-1',
      boardColumns: boardState,
      updatePlanBoard,
      isBackendDriven: true,
      accessToken: 'token-1',
      applyBoardView: vi.fn(),
      loadPlanBoard,
      timeZone: 'America/Sao_Paulo',
      dateFormat: 'dd/MM/yyyy',
    }))

    let savedCard = null
    await act(async () => {
      savedCard = await result.current.updateCard(buildFrontendCard({
        title: 'Card editado',
        description: 'Descricao editada',
        labelId: 'label-1',
        memberIds: ['user-1'],
        dueDate: '18 mai',
        schedule: {
          selectedCalendarDay: 18,
          startEnabled: false,
          startDateValue: '',
          dueEnabled: true,
          dueDateValue: '18/05/2026',
          dueTimeValue: '18:30',
          displayLabel: '18 mai',
          preserveDisplayLabel: false,
        },
      }))
    })

    expect(apiClientMock.apiRequest).toHaveBeenCalledWith('/api/plans/plan-1/board/cards/card-1', expect.objectContaining({
      method: 'PATCH',
      token: 'token-1',
    }))
    expect(loadPlanBoard).not.toHaveBeenCalled()
    expect(savedCard).toMatchObject({
      id: 'card-1',
      title: 'Card salvo pela API',
      description: 'Descricao normalizada',
      labelId: 'label-1',
      memberIds: ['user-1'],
    })
    expect(boardState[0].cards[0]).toMatchObject({
      id: 'card-1',
      title: 'Card salvo pela API',
      description: 'Descricao normalizada',
      labelId: 'label-1',
      memberIds: ['user-1'],
      dueDate: '18 mai',
    })
  })

  it('appends the created comment locally after POST and skips board reload', async () => {
    let boardState = [
      {
        id: 'col-1',
        title: 'Backlog',
        color: '',
        cards: [buildFrontendCard()],
      },
    ]

    const updatePlanBoard = vi.fn((planId, updater) => {
      boardState = typeof updater === 'function' ? updater(boardState) : updater
    })
    const loadPlanBoard = vi.fn()

    apiClientMock.apiRequest.mockResolvedValueOnce({
      id: 'comment-1',
      authorName: 'Arthur Fleming',
      message: 'Novo comentário',
      createdAt: { text: 'Agora' },
      author: {
        id: 'user-1',
        avatarUrl: 'https://example.com/avatar.png',
      },
    })

    const { result } = renderHook(() => useBoardColumns({
      activePlanId: 'plan-1',
      boardColumns: boardState,
      updatePlanBoard,
      isBackendDriven: true,
      accessToken: 'token-1',
      applyBoardView: vi.fn(),
      loadPlanBoard,
    }))

    let createdComment = null
    await act(async () => {
      createdComment = await result.current.addCardComment('card-1', 'Novo comentário')
    })

    expect(apiClientMock.apiRequest).toHaveBeenCalledWith('/api/plans/plan-1/board/cards/card-1/comments', expect.objectContaining({
      method: 'POST',
      token: 'token-1',
      body: {
        message: 'Novo comentário',
      },
    }))
    expect(loadPlanBoard).not.toHaveBeenCalled()
    expect(createdComment).toMatchObject({
      id: 'comment-1',
      authorId: 'user-1',
      authorName: 'Arthur Fleming',
      text: 'Novo comentário',
    })
    expect(boardState[0].cards[0].comments).toEqual([
      expect.objectContaining({
        id: 'comment-1',
        text: 'Novo comentário',
      }),
    ])
  })
})
