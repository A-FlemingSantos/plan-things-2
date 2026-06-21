import { describe, expect, it, vi } from 'vitest'

vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core')
  return {
    ...actual,
    pointerWithin: vi.fn(() => []),
  }
})

import { pointerWithin } from '@dnd-kit/core'
import { columnCardStackDropId } from './boardDnDUtils.js'
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

function buildCardStackRect(left, top, bottom, width = 276) {
  return {
    top,
    left,
    right: left + width,
    bottom,
    width,
    height: bottom - top,
  }
}

function buildBoardRects() {
  return new Map([
    ['col-1', buildColumnRect(0)],
    ['col-2', buildColumnRect(314)],
    [columnCardStackDropId('col-1'), buildCardStackRect(12, 60, 360)],
    [columnCardStackDropId('col-2'), buildCardStackRect(326, 60, 360)],
    ['card-2', buildCardStackRect(12, 120, 200)],
    ['card-4', buildCardStackRect(326, 120, 200)],
  ])
}

function buildBoardContainers() {
  return [
    { id: 'col-1', data: { current: { type: 'column' } }, rect: { current: null } },
    { id: 'col-2', data: { current: { type: 'column' } }, rect: { current: null } },
    { id: columnCardStackDropId('col-1'), data: { current: { type: 'card-stack', columnId: 'col-1' } }, rect: { current: null } },
    { id: columnCardStackDropId('col-2'), data: { current: { type: 'card-stack', columnId: 'col-2' } }, rect: { current: null } },
    { id: 'card-2', data: { current: { type: 'card', columnId: 'col-1' } }, rect: { current: null } },
    { id: 'card-4', data: { current: { type: 'card', columnId: 'col-2' } }, rect: { current: null } },
  ]
}

describe('boardCollisionDetection', () => {
  it('keeps the sticky column while the pointer is in the gap between columns', () => {
    const dragState = createBoardDragCollisionState()
    dragState.setStickyColumnId('col-1')
    dragState.setPointerColumnId('col-1')

    const detect = createBoardCollisionDetection(['col-1', 'col-2'], dragState)

    const collisions = detect(buildCollisionArgs({
      pointer: { x: 308, y: 200 },
      droppableContainers: buildBoardContainers(),
      droppableRects: buildBoardRects(),
    }))

    expect(collisions).toEqual([{ id: 'card-2' }])
    expect(dragState.getStickyColumnId()).toBe('col-1')
    expect(dragState.getPointerColumnId()).toBeNull()
  })

  it('switches the sticky column only after the pointer enters the next column', () => {
    const dragState = createBoardDragCollisionState()
    dragState.setStickyColumnId('col-1')

    const detect = createBoardCollisionDetection(['col-1', 'col-2'], dragState)

    pointerWithin.mockReturnValueOnce([{ id: 'card-4' }])

    const collisions = detect(buildCollisionArgs({
      pointer: { x: 360, y: 200 },
      droppableContainers: buildBoardContainers(),
      droppableRects: buildBoardRects(),
    }))

    expect(collisions).toEqual([{ id: 'card-4' }])
    expect(dragState.getStickyColumnId()).toBe('col-2')
    expect(dragState.getPointerColumnId()).toBeNull()
  })

  it('targets a column by horizontal position when the pointer is below the list area', () => {
    const dragState = createBoardDragCollisionState()
    dragState.setStickyColumnId('col-1')

    const detect = createBoardCollisionDetection(['col-1', 'col-2'], dragState)

    const collisions = detect(buildCollisionArgs({
      pointer: { x: 360, y: 1200 },
      droppableContainers: buildBoardContainers(),
      droppableRects: buildBoardRects(),
    }))

    expect(collisions).toEqual([{ id: 'col-2' }])
    expect(dragState.getStickyColumnId()).toBe('col-2')
    expect(dragState.getPointerColumnId()).toBe('col-2')
  })

  it('does not append to the column bottom while the pointer is still inside the card stack', () => {
    const dragState = createBoardDragCollisionState()
    dragState.setStickyColumnId('col-1')

    const detect = createBoardCollisionDetection(['col-1', 'col-2'], dragState)

    const collisions = detect(buildCollisionArgs({
      pointer: { x: 150, y: 300 },
      droppableContainers: buildBoardContainers(),
      droppableRects: buildBoardRects(),
    }))

    expect(collisions).toEqual([{ id: 'card-2' }])
    expect(dragState.getPointerColumnId()).toBeNull()
  })
})
