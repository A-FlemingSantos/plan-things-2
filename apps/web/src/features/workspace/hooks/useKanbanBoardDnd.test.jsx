import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { moveCardToIndex } from './boardDnDUtils.js'
import { useKanbanBoardDnd } from './useKanbanBoardDnd.js'

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function buildColumns() {
  return [
    {
      id: 'col-1',
      title: 'Backlog',
      cards: [
        { id: 'card-1', title: 'Card 1', columnId: 'col-1' },
        { id: 'card-2', title: 'Card 2', columnId: 'col-1' },
      ],
    },
    {
      id: 'col-2',
      title: 'Doing',
      cards: [],
    },
  ]
}

describe('useKanbanBoardDnd', () => {
  it('persists the final card index after cross-column drag end', async () => {
    let columns = buildColumns()
    const deferred = createDeferred()
    const updateColumns = vi.fn((updater) => {
      columns = typeof updater === 'function' ? updater(columns) : updater
    })
    const moveCard = vi.fn(() => deferred.promise)

    const { result, rerender } = renderHook(
      ({ currentColumns }) => useKanbanBoardDnd({
        activePlanId: 'plan-1',
        columns: currentColumns,
        updateColumns,
        moveCard,
        isBackendDriven: true,
        onMoveError: vi.fn(),
      }),
      { initialProps: { currentColumns: columns } },
    )

    act(() => {
      result.current.handleDragStart({ active: { id: 'card-1' } })
    })

    columns = moveCardToIndex(columns, 'card-1', 'col-1', 'col-2', 0)
    rerender({ currentColumns: columns })

    await act(async () => {
      const dragEndPromise = result.current.handleDragEnd({
        active: { id: 'card-1' },
        over: { id: 'col-2' },
      })
      deferred.resolve(true)
      await dragEndPromise
    })

    expect(moveCard).toHaveBeenCalledWith('card-1', 'col-2', 0)
  })

  it('restores the board when the backend move fails', async () => {
    let columns = buildColumns()
    const deferred = createDeferred()
    const updateColumns = vi.fn((updater) => {
      columns = typeof updater === 'function' ? updater(columns) : updater
    })
    const onMoveError = vi.fn()
    const moveCard = vi.fn(() => deferred.promise)

    const { result, rerender } = renderHook(
      ({ currentColumns }) => useKanbanBoardDnd({
        activePlanId: 'plan-1',
        columns: currentColumns,
        updateColumns,
        moveCard,
        isBackendDriven: true,
        onMoveError,
      }),
      { initialProps: { currentColumns: columns } },
    )

    act(() => {
      result.current.handleDragStart({ active: { id: 'card-1' } })
    })

    columns = moveCardToIndex(columns, 'card-1', 'col-1', 'col-2', 0)
    rerender({ currentColumns: columns })

    const error = new Error('Falha ao mover')

    await act(async () => {
      const dragEndPromise = result.current.handleDragEnd({
        active: { id: 'card-1' },
        over: { id: 'col-2' },
      })
      deferred.reject(error)
      await dragEndPromise
    })

    expect(columns[0].cards.map((card) => card.id)).toEqual(['card-1', 'card-2'])
    expect(columns[1].cards).toEqual([])
    expect(onMoveError).toHaveBeenCalledWith(error)
  })

  it('routes inbox drops through the inbox callback and restores the board', () => {
    let columns = buildColumns()
    const updateColumns = vi.fn((updater) => {
      columns = typeof updater === 'function' ? updater(columns) : updater
    })
    const onInboxDrop = vi.fn()

    const { result, rerender } = renderHook(
      ({ currentColumns }) => useKanbanBoardDnd({
        activePlanId: 'plan-1',
        columns: currentColumns,
        updateColumns,
        moveCard: vi.fn(),
        isBackendDriven: true,
        onInboxDrop,
      }),
      { initialProps: { currentColumns: columns } },
    )

    act(() => {
      result.current.handleDragStart({ active: { id: 'card-1' } })
    })

    columns = moveCardToIndex(columns, 'card-1', 'col-1', 'col-2', 0)
    rerender({ currentColumns: columns })

    act(() => {
      result.current.handleDragEnd({
        active: { id: 'card-1' },
        over: { id: 'kanban-inbox-drop' },
      })
    })

    expect(onInboxDrop).toHaveBeenCalledWith('card-1')
    expect(columns[0].cards.map((card) => card.id)).toEqual(['card-1', 'card-2'])
    expect(columns[1].cards).toEqual([])
  })
})
