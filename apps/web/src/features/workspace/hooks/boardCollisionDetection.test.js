import { describe, expect, it, vi } from 'vitest'

vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core')
  return {
    ...actual,
    pointerWithin: vi.fn(() => []),
  }
})

import { pointerWithin } from '@dnd-kit/core'
import {
  createBoardCollisionDetection,
  createBoardDragCollisionState,
} from './boardCollisionDetection.js'

function buildCollisionArgs({ pointer, droppableContainers, droppableRects }) {
  return {
    active: { id: 'card-1', rect: { current: { translated: null } } },
    collisionRect: { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 },
    droppableRects,
    droppableContainers,
    pointerCoordinates: pointer,
  }
}

function buildColumnRect(left, width = 300) {
  return {
    top: 0,
    left,
    right: left + width,
    bottom: 800,
    width,
    height: 800,
  }
}

describe('boardCollisionDetection', () => {
  it('keeps the sticky column while the pointer is in the gap between columns', () => {
    const dragState = createBoardDragCollisionState()
    dragState.setStickyColumnId('col-1')
    dragState.setPointerColumnId('col-1')

    const detect = createBoardCollisionDetection(['col-1', 'col-2'], dragState)
    const droppableRects = new Map([
      ['col-1', buildColumnRect(0)],
      ['col-2', buildColumnRect(314)],
    ])
    const droppableContainers = [
      { id: 'col-1', data: { current: { type: 'column' } }, rect: { current: null } },
      { id: 'col-2', data: { current: { type: 'column' } }, rect: { current: null } },
    ]

    const collisions = detect(buildCollisionArgs({
      pointer: { x: 308, y: 200 },
      droppableContainers,
      droppableRects,
    }))

    expect(collisions).toEqual([{ id: 'col-1' }])
    expect(dragState.getStickyColumnId()).toBe('col-1')
    expect(dragState.getPointerColumnId()).toBeNull()
  })

  it('switches the sticky column only after the pointer enters the next column', () => {
    const dragState = createBoardDragCollisionState()
    dragState.setStickyColumnId('col-1')

    const detect = createBoardCollisionDetection(['col-1', 'col-2'], dragState)
    const droppableRects = new Map([
      ['col-1', buildColumnRect(0)],
      ['col-2', buildColumnRect(314)],
    ])
    const droppableContainers = [
      { id: 'col-1', data: { current: { type: 'column' } }, rect: { current: null } },
      { id: 'col-2', data: { current: { type: 'column' } }, rect: { current: null } },
      { id: 'card-4', data: { current: { type: 'card', columnId: 'col-2' } }, rect: { current: null } },
    ]

    pointerWithin.mockReturnValueOnce([{ id: 'card-4' }])

    const collisions = detect(buildCollisionArgs({
      pointer: { x: 360, y: 200 },
      droppableContainers,
      droppableRects,
    }))

    expect(collisions).toEqual([{ id: 'card-4' }])
    expect(dragState.getStickyColumnId()).toBe('col-2')
    expect(dragState.getPointerColumnId()).toBe('col-2')
  })
})
