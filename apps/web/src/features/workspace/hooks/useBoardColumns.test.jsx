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
    position: 0,
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
    position: 0,
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

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
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

  it('creates and deletes cards locally without reloading the board', async () => {
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

    apiClientMock.apiRequest
      .mockResolvedValueOnce(buildBackendCardView({
        id: 'card-2',
        position: 1,
        title: 'Novo card',
        description: '',
      }))
      .mockResolvedValueOnce({ message: 'ok' })

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

    let createdCard = null
    await act(async () => {
      createdCard = await result.current.addCard('col-1', 'Novo card')
    })

    expect(createdCard).toMatchObject({
      id: 'card-2',
      title: 'Novo card',
    })
    expect(boardState[0].cards.map((card) => card.id)).toEqual(['card-1', 'card-2'])

    await act(async () => {
      await result.current.deleteCard('card-1')
    })

    expect(loadPlanBoard).not.toHaveBeenCalled()
    expect(boardState[0].cards.map((card) => card.id)).toEqual(['card-2'])
  })

  it('deletes columns locally without reloading the board', async () => {
    let boardState = [
      {
        id: 'col-1',
        title: 'Backlog',
        color: '',
        cards: [buildFrontendCard()],
      },
      {
        id: 'col-2',
        title: 'Doing',
        color: '',
        cards: [],
      },
    ]

    const updatePlanBoard = vi.fn((planId, updater) => {
      boardState = typeof updater === 'function' ? updater(boardState) : updater
    })
    const loadPlanBoard = vi.fn()

    apiClientMock.apiRequest.mockResolvedValueOnce({ message: 'ok' })

    const { result } = renderHook(() => useBoardColumns({
      activePlanId: 'plan-1',
      boardColumns: boardState,
      updatePlanBoard,
      isBackendDriven: true,
      accessToken: 'token-1',
      applyBoardView: vi.fn(),
      loadPlanBoard,
    }))

    await act(async () => {
      await result.current.deleteColumn('col-2')
    })

    expect(loadPlanBoard).not.toHaveBeenCalled()
    expect(boardState.map((column) => column.id)).toEqual(['col-1'])
  })

  it('updates checklist mutations locally without reloading the board', async () => {
    let boardState = [
      {
        id: 'col-1',
        title: 'Backlog',
        color: '',
        cards: [
          buildFrontendCard({
            checklists: [],
          }),
        ],
      },
    ]

    const updatePlanBoard = vi.fn((planId, updater) => {
      boardState = typeof updater === 'function' ? updater(boardState) : updater
    })
    const loadPlanBoard = vi.fn()

    apiClientMock.apiRequest
      .mockResolvedValueOnce({
        id: 'checklist-1',
        title: 'Entrega',
        position: 0,
        items: [],
      })
      .mockResolvedValueOnce({
        id: 'item-1',
        title: 'Enviar briefing',
        completed: false,
        position: 0,
        assignee: null,
        startAt: null,
        dueAt: null,
      })
      .mockResolvedValueOnce({
        id: 'item-1',
        title: 'Enviar briefing',
        completed: true,
        position: 0,
        assignee: null,
        startAt: null,
        dueAt: null,
      })
      .mockResolvedValueOnce({ message: 'ok' })

    const { result } = renderHook(() => useBoardColumns({
      activePlanId: 'plan-1',
      boardColumns: boardState,
      updatePlanBoard,
      isBackendDriven: true,
      accessToken: 'token-1',
      applyBoardView: vi.fn(),
      loadPlanBoard,
    }))

    let checklist = null
    await act(async () => {
      checklist = await result.current.createChecklist('card-1', 'Entrega')
    })

    expect(checklist).toMatchObject({
      id: 'checklist-1',
      title: 'Entrega',
    })
    expect(boardState[0].cards[0].checklists).toEqual([
      expect.objectContaining({
        id: 'checklist-1',
        title: 'Entrega',
      }),
    ])

    await act(async () => {
      await result.current.createChecklistItem('checklist-1', {
        title: 'Enviar briefing',
        assigneeUserId: null,
        startAt: null,
        dueAt: null,
      })
    })

    expect(boardState[0].cards[0].checklists[0].items).toEqual([
      expect.objectContaining({
        id: 'item-1',
        completed: false,
      }),
    ])

    await act(async () => {
      await result.current.updateChecklistItem({
        id: 'item-1',
        title: 'Enviar briefing',
        completed: true,
        assigneeUserId: null,
        startAt: null,
        dueAt: null,
      })
    })

    expect(boardState[0].cards[0].checklists[0].items).toEqual([
      expect.objectContaining({
        id: 'item-1',
        completed: true,
      }),
    ])

    await act(async () => {
      await result.current.deleteChecklist('checklist-1')
    })

    expect(loadPlanBoard).not.toHaveBeenCalled()
    expect(boardState[0].cards[0].checklists).toEqual([])
  })

  it('optimistically toggles checklist items and rolls back on backend failure', async () => {
    let boardState = [
      {
        id: 'col-1',
        title: 'Backlog',
        color: '',
        cards: [
          buildFrontendCard({
            checklists: [
              {
                id: 'checklist-1',
                title: 'Entrega',
                items: [
                  {
                    id: 'item-1',
                    title: 'Enviar briefing',
                    completed: false,
                  },
                ],
              },
            ],
          }),
        ],
      },
    ]

    const updatePlanBoard = vi.fn((planId, updater) => {
      boardState = typeof updater === 'function' ? updater(boardState) : updater
    })
    const deferred = createDeferred()

    apiClientMock.apiRequest.mockReturnValueOnce(deferred.promise)

    const { result } = renderHook(() => useBoardColumns({
      activePlanId: 'plan-1',
      boardColumns: boardState,
      updatePlanBoard,
      isBackendDriven: true,
      accessToken: 'token-1',
      applyBoardView: vi.fn(),
      loadPlanBoard: vi.fn(),
    }))

    let updatePromise
    await act(async () => {
      updatePromise = result.current.updateChecklistItem({
        id: 'item-1',
        title: 'Enviar briefing',
        completed: true,
        assigneeUserId: null,
        startAt: null,
        dueAt: null,
      })
      await Promise.resolve()
    })

    expect(boardState[0].cards[0].checklists[0].items).toEqual([
      expect.objectContaining({
        id: 'item-1',
        completed: true,
      }),
    ])

    deferred.reject(new Error('Falha ao salvar item'))

    await expect(updatePromise).rejects.toThrow('Falha ao salvar item')
    expect(boardState[0].cards[0].checklists[0].items).toEqual([
      expect.objectContaining({
        id: 'item-1',
        completed: false,
      }),
    ])
  })

  it('preserves untouched column references during localized updates', async () => {
    const untouchedColumn = {
      id: 'col-2',
      title: 'Doing',
      color: '',
      cards: [buildFrontendCard({ id: 'card-2', columnId: 'col-2', title: 'Outro card' })],
    }

    let boardState = [
      {
        id: 'col-1',
        title: 'Backlog',
        color: '',
        cards: [buildFrontendCard()],
      },
      untouchedColumn,
    ]

    const updatePlanBoard = vi.fn((planId, updater) => {
      boardState = typeof updater === 'function' ? updater(boardState) : updater
    })

    apiClientMock.apiRequest.mockResolvedValueOnce({
      id: 'comment-1',
      authorName: 'Arthur Fleming',
      message: 'Novo comentário',
      createdAt: { text: 'Agora' },
      author: {
        id: 'user-1',
        avatarUrl: null,
      },
    })

    const { result } = renderHook(() => useBoardColumns({
      activePlanId: 'plan-1',
      boardColumns: boardState,
      updatePlanBoard,
      isBackendDriven: true,
      accessToken: 'token-1',
      applyBoardView: vi.fn(),
      loadPlanBoard: vi.fn(),
    }))

    await act(async () => {
      await result.current.addCardComment('card-1', 'Novo comentário')
    })

    expect(boardState[1]).toBe(untouchedColumn)
  })

  it('preserves untouched column references when updating local cards', async () => {
    const localCard = buildFrontendCard({ columnId: undefined })
    const untouchedColumn = {
      id: 'col-2',
      title: 'Doing',
      color: '',
      cards: [buildFrontendCard({ id: 'card-2', columnId: 'col-2', title: 'Outro card' })],
    }
    let boardState = [
      {
        id: 'col-1',
        title: 'Backlog',
        color: '',
        cards: [localCard],
      },
      untouchedColumn,
    ]

    const updatePlanBoard = vi.fn((planId, updater) => {
      boardState = typeof updater === 'function' ? updater(boardState) : updater
    })

    const { result } = renderHook(() => useBoardColumns({
      activePlanId: 'plan-1',
      boardColumns: boardState,
      updatePlanBoard,
      isBackendDriven: false,
      applyBoardView: vi.fn(),
      loadPlanBoard: vi.fn(),
    }))

    await act(async () => {
      await result.current.updateCard({
        ...localCard,
        title: 'Card local atualizado',
      })
    })

    expect(boardState[1]).toBe(untouchedColumn)
    expect(boardState[0].cards[0]).toMatchObject({
      id: 'card-1',
      columnId: 'col-1',
      title: 'Card local atualizado',
    })
  })
})
