import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  applyDragOverToColumns,
  columnGroupBeforeDropId,
  reorderColumnsByDrag,
} from './boardDnDUtils.js'
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

function buildThreeColumns() {
  return [
    ...buildColumns(),
    {
      id: 'col-3',
      title: 'To Do',
      cards: [],
    },
  ]
}

function columnDrag(id) {
  return { id, data: { current: { type: 'column' } } }
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
        reorderColumns: vi.fn(),
        isBackendDriven: true,
        onMoveError: vi.fn(),
      }),
      { initialProps: { currentColumns: columns } },
    )

    act(() => {
      result.current.handleDragStart({ active: { id: 'card-1' } })
    })

    columns = applyDragOverToColumns(columns, ['col-1', 'col-2'], 'card-1', 'col-2').columns
    rerender({ currentColumns: columns })

    await act(async () => {
      const dragEndPromise = result.current.handleDragEnd({
        active: { id: 'card-1' },
        over: { id: 'col-2' },
      })
      deferred.resolve(true)
      await dragEndPromise
    })

    expect(moveCard).toHaveBeenCalledWith('card-1', 'col-2', 0, null)
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
        reorderColumns: vi.fn(),
        isBackendDriven: true,
        onMoveError,
      }),
      { initialProps: { currentColumns: columns } },
    )

    act(() => {
      result.current.handleDragStart({ active: { id: 'card-1' } })
    })

    columns = applyDragOverToColumns(columns, ['col-1', 'col-2'], 'card-1', 'col-2').columns
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
        reorderColumns: vi.fn(),
        isBackendDriven: true,
        onInboxDrop,
      }),
      { initialProps: { currentColumns: columns } },
    )

    act(() => {
      result.current.handleDragStart({ active: { id: 'card-1' } })
    })

    columns = applyDragOverToColumns(columns, ['col-1', 'col-2'], 'card-1', 'col-2').columns
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

  it('updates board state during drag-over', () => {
    let columns = buildColumns()
    const updateColumns = vi.fn((updater) => {
      columns = typeof updater === 'function' ? updater(columns) : updater
    })

    const { result } = renderHook(() => useKanbanBoardDnd({
      activePlanId: 'plan-1',
      columns,
      updateColumns,
      moveCard: vi.fn(),
      reorderColumns: vi.fn(),
      isBackendDriven: true,
    }))

    act(() => {
      result.current.handleDragStart({ active: { id: 'card-1' } })
      result.current.handleDragOver({
        active: { id: 'card-1' },
        over: { id: 'col-2' },
      })
    })

    expect(updateColumns).toHaveBeenCalled()
    expect(columns[1].cards.map((card) => card.id)).toEqual(['card-1'])
  })

  it('applies the same structural preview used by loose cards during grouped drag-over', () => {
    let columns = [{
      id: 'col-1',
      title: 'Backlog',
      cards: [
        { id: 'card-1', title: 'Card 1', columnId: 'col-1' },
        { id: 'card-2', title: 'Card 2', columnId: 'col-1' },
        { id: 'card-3', title: 'Card 3', columnId: 'col-1' },
      ],
      groups: [{ id: 'group-1', startCardId: 'card-2', endCardId: 'card-3' }],
    }]
    const updateColumns = vi.fn((updater) => {
      columns = typeof updater === 'function' ? updater(columns) : updater
    })

    const { result } = renderHook(() => useKanbanBoardDnd({
      activePlanId: 'plan-1',
      columns,
      updateColumns,
      moveCard: vi.fn(),
      reorderColumns: vi.fn(),
      isBackendDriven: true,
    }))

    act(() => {
      result.current.handleDragStart({ active: { id: 'card-2' } })
      result.current.handleDragOver({
        active: { id: 'card-2' },
        over: { id: 'card-1' },
      })
    })

    expect(updateColumns).toHaveBeenCalled()
    expect(columns[0].cards.map((card) => card.id)).toEqual(['card-2', 'card-1', 'card-3'])
    expect(columns[0].groups[0].cardIds).toEqual(['card-3'])
    expect(result.current.groupDropPreview).toBeNull()
    expect(result.current.dragPreviewCardIdsByColumn).toBeNull()
  })

  it('keeps a loose card in the target group when collision intent is temporarily unavailable', async () => {
    const columns = [{
      id: 'col-1',
      title: 'Backlog',
      cards: [
        { id: 'card-1', title: 'Card 1', columnId: 'col-1' },
        { id: 'card-2', title: 'Card 2', columnId: 'col-1' },
        { id: 'card-3', title: 'Card 3', columnId: 'col-1' },
      ],
      groups: [{ id: 'group-1', startCardId: 'card-2', endCardId: 'card-3' }],
    }]
    let previewColumns = columns
    const moveCard = vi.fn(() => Promise.resolve(true))
    const updateColumns = vi.fn((updater) => {
      previewColumns = typeof updater === 'function' ? updater(previewColumns) : updater
    })
    const { result } = renderHook(() => useKanbanBoardDnd({
      activePlanId: 'plan-1',
      columns,
      updateColumns,
      moveCard,
      reorderColumns: vi.fn(),
      isBackendDriven: true,
    }))

    act(() => {
      result.current.handleDragStart({ active: { id: 'card-1' } })
      result.current.handleDragOver({
        active: { id: 'card-1' },
        over: { id: 'card-2' },
      })
    })

    expect(previewColumns[0].cards.map((card) => card.id)).toEqual(['card-2', 'card-1', 'card-3'])
    expect(previewColumns[0].groups[0].cardIds).toEqual(['card-2', 'card-1', 'card-3'])

    act(() => {
      result.current.handleDragOver({
        active: { id: 'card-1' },
        over: { id: 'card-1' },
      })
    })

    expect(previewColumns[0].groups[0].cardIds).toEqual(['card-2', 'card-1', 'card-3'])

    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: 'card-1' },
        over: { id: 'card-1' },
      })
    })

    expect(moveCard).toHaveBeenCalledWith('card-1', 'col-1', 1, 'group-1')
  })

  it('persists a group-card drop from its stable drag snapshot', async () => {
    const columns = [{
      id: 'col-1',
      title: 'Backlog',
      cards: [
        { id: 'card-1', title: 'Card 1', columnId: 'col-1' },
        { id: 'card-2', title: 'Card 2', columnId: 'col-1' },
        { id: 'card-3', title: 'Card 3', columnId: 'col-1' },
      ],
      groups: [{ id: 'group-1', cardIds: ['card-2', 'card-3'] }],
    }]
    const moveCard = vi.fn(() => Promise.resolve(true))

    const { result } = renderHook(() => useKanbanBoardDnd({
      activePlanId: 'plan-1',
      columns,
      updateColumns: vi.fn(),
      moveCard,
      reorderColumns: vi.fn(),
      isBackendDriven: true,
    }))

    act(() => {
      result.current.handleDragStart({ active: { id: 'card-2' } })
      result.current.handleDragOver({
        active: { id: 'card-2' },
        over: { id: 'card-1' },
      })
    })

    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: 'card-2' },
        over: { id: 'card-1' },
      })
    })

    expect(moveCard).toHaveBeenCalledWith('card-2', 'col-1', 0, null)
  })

  it('detaches a group card when it is dropped on the group boundary', async () => {
    const columns = [{
      id: 'col-1',
      title: 'Backlog',
      cards: [
        { id: 'card-1', title: 'Card 1', columnId: 'col-1' },
        { id: 'card-2', title: 'Card 2', columnId: 'col-1' },
        { id: 'card-3', title: 'Card 3', columnId: 'col-1' },
      ],
      groups: [{ id: 'group-1', startCardId: 'card-2', cardIds: ['card-2', 'card-3'] }],
    }]
    let previewColumns = columns
    const moveCard = vi.fn(() => Promise.resolve(true))
    const updateColumns = vi.fn((updater) => {
      previewColumns = typeof updater === 'function' ? updater(previewColumns) : updater
    })

    const { result } = renderHook(() => useKanbanBoardDnd({
      activePlanId: 'plan-1',
      columns,
      updateColumns,
      moveCard,
      reorderColumns: vi.fn(),
      isBackendDriven: true,
    }))

    act(() => {
      result.current.handleDragStart({ active: { id: 'card-2' } })
      result.current.handleDragOver({
        active: { id: 'card-2' },
        over: { id: columnGroupBeforeDropId('col-1', 'group-1') },
      })
    })

    expect(previewColumns[0].groups[0].cardIds).toEqual(['card-3'])

    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: 'card-2' },
        over: { id: columnGroupBeforeDropId('col-1', 'group-1') },
      })
    })

    expect(moveCard).toHaveBeenCalledWith('card-2', 'col-1', 1, null)
    expect(previewColumns[0].groups[0].cardIds).toEqual(['card-3'])
  })

  it('marks inbox as active during drag-over on inbox target', () => {
    const updateColumns = vi.fn()

    const { result } = renderHook(() => useKanbanBoardDnd({
      activePlanId: 'plan-1',
      columns: buildColumns(),
      updateColumns,
      moveCard: vi.fn(),
      reorderColumns: vi.fn(),
      isBackendDriven: true,
    }))

    act(() => {
      result.current.handleDragStart({ active: { id: 'card-1' } })
      result.current.handleDragOver({
        active: { id: 'card-1' },
        over: { id: 'kanban-inbox-drop' },
      })
    })

    expect(result.current.isInboxDropActive).toBe(true)
    expect(result.current.dragOverColumnId).toBeNull()
    expect(updateColumns).not.toHaveBeenCalled()
  })

  it('persists column order after drag end', async () => {
    let columns = buildColumns()
    const deferred = createDeferred()
    const updateColumns = vi.fn((updater) => {
      columns = typeof updater === 'function' ? updater(columns) : updater
    })
    const reorderColumns = vi.fn(() => deferred.promise)

    const { result, rerender } = renderHook(
      ({ currentColumns }) => useKanbanBoardDnd({
        activePlanId: 'plan-1',
        columns: currentColumns,
        updateColumns,
        moveCard: vi.fn(),
        reorderColumns,
        isBackendDriven: true,
      }),
      { initialProps: { currentColumns: columns } },
    )

    act(() => {
      result.current.handleDragStart({
        active: { id: 'col-1', data: { current: { type: 'column' } } },
      })
    })

    columns = reorderColumnsByDrag(columns, 'col-1', 'col-2').columns
    rerender({ currentColumns: columns })

    await act(async () => {
      const dragEndPromise = result.current.handleDragEnd({
        active: { id: 'col-1', data: { current: { type: 'column' } } },
        over: { id: 'col-2' },
      })
      deferred.resolve(true)
      await dragEndPromise
    })

    expect(reorderColumns).toHaveBeenCalledWith(['col-2', 'col-1'])
  })

  it('restores column order when backend reorder fails', async () => {
    let columns = buildColumns()
    const deferred = createDeferred()
    const updateColumns = vi.fn((updater) => {
      columns = typeof updater === 'function' ? updater(columns) : updater
    })
    const onReorderError = vi.fn()
    const reorderColumns = vi.fn(() => deferred.promise)

    const { result, rerender } = renderHook(
      ({ currentColumns }) => useKanbanBoardDnd({
        activePlanId: 'plan-1',
        columns: currentColumns,
        updateColumns,
        moveCard: vi.fn(),
        reorderColumns,
        isBackendDriven: true,
        onReorderError,
      }),
      { initialProps: { currentColumns: columns } },
    )

    act(() => {
      result.current.handleDragStart({
        active: { id: 'col-1', data: { current: { type: 'column' } } },
      })
    })

    columns = reorderColumnsByDrag(columns, 'col-1', 'col-2').columns
    rerender({ currentColumns: columns })

    const error = new Error('Falha ao reordenar')

    await act(async () => {
      const dragEndPromise = result.current.handleDragEnd({
        active: { id: 'col-1', data: { current: { type: 'column' } } },
        over: { id: 'col-2' },
      })
      deferred.reject(error)
      await dragEndPromise
    })

    expect(columns.map((column) => column.id)).toEqual(['col-1', 'col-2'])
    expect(onReorderError).toHaveBeenCalledWith(error)
  })

  it('does not mutate list order during drag-over so the sortable strategy can animate the gap', () => {
    let columns = buildThreeColumns()
    const updateColumns = vi.fn((updater) => {
      columns = typeof updater === 'function' ? updater(columns) : updater
    })

    const { result } = renderHook(() => useKanbanBoardDnd({
      activePlanId: 'plan-1',
      columns,
      updateColumns,
      moveCard: vi.fn(),
      reorderColumns: vi.fn(),
      isBackendDriven: true,
    }))

    act(() => {
      result.current.handleDragStart({ active: columnDrag('col-1') })
      result.current.handleDragOver({
        active: columnDrag('col-1'),
        over: { id: 'col-2' },
      })
    })

    expect(updateColumns).not.toHaveBeenCalled()
    expect(columns.map((column) => column.id)).toEqual(['col-1', 'col-2', 'col-3'])
  })

  it('ignores card droppables while dragging a list', () => {
    let columns = buildThreeColumns()
    const updateColumns = vi.fn((updater) => {
      columns = typeof updater === 'function' ? updater(columns) : updater
    })

    const { result } = renderHook(() => useKanbanBoardDnd({
      activePlanId: 'plan-1',
      columns,
      updateColumns,
      moveCard: vi.fn(),
      reorderColumns: vi.fn(),
      isBackendDriven: true,
    }))

    act(() => {
      result.current.handleDragStart({ active: columnDrag('col-1') })
      result.current.handleDragOver({
        active: columnDrag('col-1'),
        over: { id: 'card-2' },
      })
    })

    expect(updateColumns).not.toHaveBeenCalled()
    expect(columns.map((column) => column.id)).toEqual(['col-1', 'col-2', 'col-3'])
  })

  it('moves a list into the first position when dropped on the first list', async () => {
    let columns = buildThreeColumns()
    const updateColumns = vi.fn((updater) => {
      columns = typeof updater === 'function' ? updater(columns) : updater
    })
    const reorderColumns = vi.fn(() => Promise.resolve(true))

    const { result } = renderHook(() => useKanbanBoardDnd({
      activePlanId: 'plan-1',
      columns,
      updateColumns,
      moveCard: vi.fn(),
      reorderColumns,
      isBackendDriven: true,
    }))

    act(() => {
      result.current.handleDragStart({ active: columnDrag('col-3') })
    })

    await act(async () => {
      await result.current.handleDragEnd({
        active: columnDrag('col-3'),
        over: { id: 'col-1' },
      })
    })

    expect(columns.map((column) => column.id)).toEqual(['col-3', 'col-1', 'col-2'])
    expect(reorderColumns).toHaveBeenCalledWith(['col-3', 'col-1', 'col-2'])
  })
})
