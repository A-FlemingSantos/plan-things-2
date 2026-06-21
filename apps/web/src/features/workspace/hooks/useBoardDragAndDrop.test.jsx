import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useBoardDragAndDrop } from './useBoardDragAndDrop.js'

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

describe('useBoardDragAndDrop', () => {
  it('moves cards optimistically before the backend responds', async () => {
    let columns = buildColumns()
    const deferred = createDeferred()
    const updateColumns = vi.fn((updater) => {
      columns = typeof updater === 'function' ? updater(columns) : updater
    })
    const moveCard = vi.fn(() => deferred.promise)

    const { result } = renderHook(() => useBoardDragAndDrop({
      activePlanId: 'plan-1',
      columns,
      updateColumns,
      moveCard,
      isBackendDriven: true,
      onMoveError: vi.fn(),
    }))

    act(() => {
      result.current.handleDragStart('card-1', 'col-1')
    })

    await act(async () => {
      const dropPromise = result.current.handleDrop({ type: 'col', colId: 'col-2' })
      await Promise.resolve()
      expect(columns[0].cards.map((card) => card.id)).toEqual(['card-2'])
      expect(columns[1].cards.map((card) => card.id)).toEqual(['card-1'])
      expect(columns[1].cards[0].columnId).toBe('col-2')
      deferred.resolve(true)
      await dropPromise
    })
  })

  it('restores the previous board order when the backend move fails', async () => {
    let columns = buildColumns()
    const deferred = createDeferred()
    const updateColumns = vi.fn((updater) => {
      columns = typeof updater === 'function' ? updater(columns) : updater
    })
    const onMoveError = vi.fn()
    const moveCard = vi.fn(() => deferred.promise)

    const { result } = renderHook(() => useBoardDragAndDrop({
      activePlanId: 'plan-1',
      columns,
      updateColumns,
      moveCard,
      isBackendDriven: true,
      onMoveError,
    }))

    act(() => {
      result.current.handleDragStart('card-1', 'col-1')
    })

    const error = new Error('Falha ao mover')

    await act(async () => {
      const dropPromise = result.current.handleDrop({ type: 'col', colId: 'col-2' })
      await Promise.resolve()
      expect(columns[0].cards.map((card) => card.id)).toEqual(['card-2'])
      expect(columns[1].cards.map((card) => card.id)).toEqual(['card-1'])
      expect(columns[1].cards[0].columnId).toBe('col-2')
      deferred.reject(error)
      await dropPromise
    })

    expect(columns[0].cards.map((card) => card.id)).toEqual(['card-1', 'card-2'])
    expect(columns[0].cards[0].columnId).toBe('col-1')
    expect(columns[1].cards).toEqual([])
    expect(onMoveError).toHaveBeenCalledWith(error)
  })
})
