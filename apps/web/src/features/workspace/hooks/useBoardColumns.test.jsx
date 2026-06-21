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

  it('skips redundant card replacement when persisted payload matches the current card', async () => {
    const initialColumn = {
      id: 'col-1',
      title: 'Backlog',
      color: '',
      cards: [buildFrontendCard()],
    }
    const initialBoardState = [initialColumn]
    let boardState = initialBoardState

    const updatePlanBoard = vi.fn((planId, updater) => {
      boardState = typeof updater === 'function' ? updater(boardState) : updater
    })

    apiClientMock.apiRequest.mockResolvedValueOnce(buildBackendCardView())

    const { result } = renderHook(() => useBoardColumns({
      activePlanId: 'plan-1',
      boardColumns: boardState,
      updatePlanBoard,
      isBackendDriven: true,
      accessToken: 'token-1',
      applyBoardView: vi.fn(),
      loadPlanBoard: vi.fn(),
      timeZone: 'America/Sao_Paulo',
      dateFormat: 'dd/MM/yyyy',
    }))

    await act(async () => {
      await result.current.updateCard(buildFrontendCard())
    })

    expect(boardState).toBe(initialBoardState)
    expect(boardState[0]).toBe(initialColumn)
    expect(boardState[0].cards[0]).toBe(initialColumn.cards[0])
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
      createdAt: {
        iso: '2026-06-07T21:38:00-03:00',
        text: '07/06/2026 21:38',
      },
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
      kind: 'USER_COMMENT',
      text: 'Novo comentário',
      createdAtIso: '2026-06-07T21:38:00-03:00',
    })
    expect(boardState[0].cards[0].comments).toEqual([
      expect.objectContaining({
        id: 'comment-1',
        kind: 'USER_COMMENT',
        text: 'Novo comentário',
        createdAtIso: '2026-06-07T21:38:00-03:00',
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
    expect(createdCard.uiKey).toMatch(/^card-ui-/)
    expect(boardState[0].cards.map((card) => card.id)).toEqual(['card-1', 'card-2'])
    expect(boardState[0].cards[1].uiKey).toBe(createdCard.uiKey)

    await act(async () => {
      await result.current.deleteCard('card-1')
    })

    expect(loadPlanBoard).not.toHaveBeenCalled()
    expect(boardState[0].cards.map((card) => card.id)).toEqual(['card-2'])
  })

  it('creates cards optimistically and rolls back when the backend creation fails', async () => {
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
      timeZone: 'America/Sao_Paulo',
      dateFormat: 'dd/MM/yyyy',
    }))

    let addPromise
    await act(async () => {
      addPromise = result.current.addCard('col-1', 'Novo card')
    })

    expect(boardState[0].cards).toHaveLength(2)
    expect(boardState[0].cards[1]).toMatchObject({
      title: 'Novo card',
      isCompleted: false,
      starred: false,
    })

    await act(async () => {
      deferred.reject(new Error('Falha ao criar card'))
      await expect(addPromise).rejects.toThrow('Falha ao criar card')
    })

    expect(boardState[0].cards.map((card) => card.id)).toEqual(['card-1'])
  })

  it('deletes cards optimistically and restores them when the backend deletion fails', async () => {
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

    let deletePromise
    await act(async () => {
      deletePromise = result.current.deleteCard('card-1')
    })

    expect(boardState[0].cards).toEqual([])

    await act(async () => {
      deferred.reject(new Error('Falha ao excluir card'))
      await expect(deletePromise).rejects.toThrow('Falha ao excluir card')
    })

    expect(boardState[0].cards.map((card) => card.id)).toEqual(['card-1'])
  })

  it('reconciles move confirmations locally and preserves untouched column references', async () => {
    const untouchedCard = buildFrontendCard({ id: 'card-4', columnId: 'col-3', title: 'Intacto' })
    const untouchedColumn = {
      id: 'col-3',
      title: 'Done',
      color: '',
      cards: [untouchedCard],
    }
    let boardState = [
      {
        id: 'col-1',
        title: 'Backlog',
        color: '',
        cards: [
          buildFrontendCard({ id: 'card-1', columnId: 'col-1', position: 0, title: 'Mover' }),
          buildFrontendCard({ id: 'card-2', columnId: 'col-1', position: 1, title: 'Fica no backlog' }),
        ],
      },
      {
        id: 'col-2',
        title: 'Doing',
        color: '',
        cards: [buildFrontendCard({ id: 'card-3', columnId: 'col-2', position: 0, title: 'Ja em doing' })],
      },
      untouchedColumn,
    ]

    const updatePlanBoard = vi.fn((planId, updater) => {
      boardState = typeof updater === 'function' ? updater(boardState) : updater
    })
    const applyBoardView = vi.fn()

    apiClientMock.apiRequest.mockResolvedValueOnce({
      columns: [
        {
          id: 'col-1',
          title: 'Backlog',
          color: '',
          status: '',
          cards: [buildBackendCardView({ id: 'card-2', columnId: 'col-1', position: 0, title: 'Fica no backlog' })],
        },
        {
          id: 'col-2',
          title: 'Doing',
          color: '',
          status: '',
          cards: [
            buildBackendCardView({ id: 'card-3', columnId: 'col-2', position: 0, title: 'Ja em doing' }),
            buildBackendCardView({ id: 'card-1', columnId: 'col-2', position: 1, title: 'Mover' }),
          ],
        },
        {
          id: 'col-3',
          title: 'Done',
          color: '',
          status: '',
          cards: [buildBackendCardView({ id: 'card-4', columnId: 'col-3', position: 0, title: 'Intacto' })],
        },
      ],
      labels: [],
      inboxItems: [],
    })

    const { result } = renderHook(() => useBoardColumns({
      activePlanId: 'plan-1',
      boardColumns: boardState,
      updatePlanBoard,
      isBackendDriven: true,
      accessToken: 'token-1',
      applyBoardView,
      loadPlanBoard: vi.fn(),
      timeZone: 'America/Sao_Paulo',
      dateFormat: 'dd/MM/yyyy',
    }))

    await act(async () => {
      await result.current.moveCard('card-1', 'col-2', 1)
    })

    expect(applyBoardView).not.toHaveBeenCalled()
    expect(boardState[2]).toBe(untouchedColumn)
    expect(boardState[2].cards[0]).toBe(untouchedCard)
    expect(boardState[0].cards.map((card) => card.id)).toEqual(['card-2'])
    expect(boardState[1].cards.map((card) => card.id)).toEqual(['card-3', 'card-1'])
    expect(boardState[1].cards[1].columnId).toBe('col-2')
  })

  it('keeps optimistic column ui key when backend confirms creation', async () => {
    let boardState = [
      {
        id: 'col-1',
        title: 'Backlog',
        color: '',
        status: '',
        cards: [],
      },
    ]

    const updatePlanBoard = vi.fn((planId, updater) => {
      boardState = typeof updater === 'function' ? updater(boardState) : updater
    })

    apiClientMock.apiRequest.mockResolvedValueOnce({
      columns: [
        {
          id: 'col-1',
          title: 'Backlog',
          color: '',
          status: '',
          cards: [],
        },
        {
          id: 'col-2',
          title: 'Doing',
          color: '',
          status: '',
          cards: [],
        },
      ],
      labels: [],
      inboxItems: [],
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
      await result.current.createColumn('Doing')
    })

    expect(boardState.map((column) => column.id)).toEqual(['col-1', 'col-2'])
    expect(boardState[1].uiKey).toMatch(/^column-ui-/)
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

  it('creates columns optimistically and rolls back when the backend creation fails', async () => {
    let boardState = [
      {
        id: 'col-1',
        title: 'Backlog',
        color: '',
        cards: [],
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

    let createPromise
    await act(async () => {
      createPromise = result.current.createColumn('Doing')
    })

    expect(boardState.map((column) => column.title)).toEqual(['Backlog', 'Doing'])

    await act(async () => {
      deferred.reject(new Error('Falha ao criar lista'))
      await expect(createPromise).rejects.toThrow('Falha ao criar lista')
    })

    expect(boardState.map((column) => column.id)).toEqual(['col-1'])
  })

  it('renames columns optimistically and restores the previous title when the backend update fails', async () => {
    let boardState = [
      {
        id: 'col-1',
        title: 'Backlog',
        color: '#4290da',
        cards: [],
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

    let renamePromise
    await act(async () => {
      renamePromise = result.current.renameColumn('col-1', 'Em andamento')
    })

    expect(boardState[0].title).toBe('Em andamento')

    await act(async () => {
      deferred.reject(new Error('Falha ao renomear lista'))
      await expect(renamePromise).rejects.toThrow('Falha ao renomear lista')
    })

    expect(boardState[0].title).toBe('Backlog')
  })

  it('changes column colors optimistically and restores the previous color when the backend update fails', async () => {
    let boardState = [
      {
        id: 'col-1',
        title: 'Backlog',
        color: '#4290da',
        cards: [],
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

    let colorPromise
    await act(async () => {
      colorPromise = result.current.changeColColor('col-1', '#ff6766')
    })

    expect(boardState[0].color).toBe('#ff6766')

    await act(async () => {
      deferred.reject(new Error('Falha ao alterar cor'))
      await expect(colorPromise).rejects.toThrow('Falha ao alterar cor')
    })

    expect(boardState[0].color).toBe('#4290da')
  })

  it('changes column status optimistically and restores the previous status when the backend update fails', async () => {
    let boardState = [
      {
        id: 'col-1',
        title: 'Backlog',
        color: '#4290da',
        status: '',
        cards: [],
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

    let statusPromise
    await act(async () => {
      statusPromise = result.current.changeColStatus('col-1', 'in_progress')
    })

    expect(boardState[0].status).toBe('in_progress')

    await act(async () => {
      deferred.reject(new Error('Falha ao alterar status'))
      await expect(statusPromise).rejects.toThrow('Falha ao alterar status')
    })

    expect(boardState[0].status).toBe('')
  })

  it('deletes columns optimistically and restores them when the backend deletion fails', async () => {
    let boardState = [
      {
        id: 'col-1',
        title: 'Backlog',
        color: '',
        cards: [],
      },
      {
        id: 'col-2',
        title: 'Doing',
        color: '#4290da',
        cards: [],
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

    let deletePromise
    await act(async () => {
      deletePromise = result.current.deleteColumn('col-2')
    })

    expect(boardState.map((column) => column.id)).toEqual(['col-1'])

    await act(async () => {
      deferred.reject(new Error('Falha ao excluir lista'))
      await expect(deletePromise).rejects.toThrow('Falha ao excluir lista')
    })

    expect(boardState.map((column) => column.id)).toEqual(['col-1', 'col-2'])
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
