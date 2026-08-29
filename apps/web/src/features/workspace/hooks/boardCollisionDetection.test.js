import { describe, expect, it, vi } from 'vitest'

vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core')
  return {
    ...actual,
    closestCorners: vi.fn(() => []),
    pointerWithin: vi.fn(() => []),
  }
})

import { closestCorners, pointerWithin } from '@dnd-kit/core'
import { columnCardStackDropId, KANBAN_INBOX_DROP_ID } from './boardDnDUtils.js'
import {
  createBoardCollisionDetection,
  createBoardDragCollisionState,
  pickHorizontalColumnOverId,
} from './boardCollisionDetection.js'

function buildCollisionArgs({
  pointer,
  droppableContainers,
  droppableRects,
  active = { id: 'card-1', rect: { current: { translated: null } } },
}) {
  return {
    active,
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
    [KANBAN_INBOX_DROP_ID, buildCardStackRect(700, 120, 460, 360)],
    ['card-2', buildCardStackRect(12, 120, 200)],
    ['card-4', buildCardStackRect(326, 120, 200)],
  ])
}

function buildThreeColumnRects() {
  return new Map([
    ['col-1', buildColumnRect(20)],
    ['col-2', buildColumnRect(334)],
    ['col-3', buildColumnRect(648)],
  ])
}

function buildThreeColumnContainers() {
  return [
    { id: 'col-1', data: { current: { type: 'column' } }, rect: { current: null } },
    { id: 'col-2', data: { current: { type: 'column' } }, rect: { current: null } },
    { id: 'col-3', data: { current: { type: 'column' } }, rect: { current: null } },
  ]
}

function buildBoardContainers() {
  return [
    { id: 'col-1', data: { current: { type: 'column' } }, rect: { current: null } },
    { id: 'col-2', data: { current: { type: 'column' } }, rect: { current: null } },
    { id: columnCardStackDropId('col-1'), data: { current: { type: 'card-stack', columnId: 'col-1' } }, rect: { current: null } },
    { id: columnCardStackDropId('col-2'), data: { current: { type: 'card-stack', columnId: 'col-2' } }, rect: { current: null } },
    { id: 'card-2', data: { current: { type: 'card', columnId: 'col-1' } }, rect: { current: null } },
    { id: 'card-4', data: { current: { type: 'card', columnId: 'col-2' } }, rect: { current: null } },
    { id: KANBAN_INBOX_DROP_ID, data: { current: { type: 'inbox' } }, rect: { current: null } },
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

  it('prefers inbox collision when pointer is over the inbox dropzone', () => {
    const dragState = createBoardDragCollisionState()
    dragState.setStickyColumnId('col-1')

    const detect = createBoardCollisionDetection(['col-1', 'col-2'], dragState)
    pointerWithin.mockReturnValueOnce([{ id: KANBAN_INBOX_DROP_ID }])

    const collisions = detect(buildCollisionArgs({
      pointer: { x: 820, y: 260 },
      droppableContainers: buildBoardContainers(),
      droppableRects: buildBoardRects(),
    }))

    expect(collisions).toEqual([{ id: KANBAN_INBOX_DROP_ID }])
    expect(dragState.getPointerColumnId()).toBeNull()
  })

  it('falls back to closestCorners when pointer coordinates are unavailable', () => {
    const dragState = createBoardDragCollisionState()
    dragState.setStickyColumnId('col-1')

    const detect = createBoardCollisionDetection(['col-1', 'col-2'], dragState)
    closestCorners.mockReturnValueOnce([{ id: 'card-4' }])

    const collisions = detect(buildCollisionArgs({
      pointer: null,
      droppableContainers: buildBoardContainers(),
      droppableRects: buildBoardRects(),
    }))

    expect(collisions).toEqual([{ id: 'card-4' }])
    expect(closestCorners).toHaveBeenCalledTimes(1)
  })

  it('opens a slot between two columns from the pointer in the gap, not the dragged list rect', () => {
    const dragState = createBoardDragCollisionState()
    const detect = createBoardCollisionDetection(['col-1', 'col-2', 'col-3'], dragState)

    const collisions = detect(buildCollisionArgs({
      active: { id: 'col-1', data: { current: { type: 'column' } } },
      pointer: { x: 641, y: 120 },
      droppableContainers: buildThreeColumnContainers(),
      droppableRects: buildThreeColumnRects(),
    }))

    expect(collisions).toEqual([{ id: 'col-2' }])
  })

  it('targets the first column when the pointer is left of the first list center', () => {
    const dragState = createBoardDragCollisionState()
    const detect = createBoardCollisionDetection(['col-1', 'col-2', 'col-3'], dragState)

    const collisions = detect(buildCollisionArgs({
      active: { id: 'col-3', data: { current: { type: 'column' } } },
      pointer: { x: 24, y: 80 },
      droppableContainers: buildThreeColumnContainers(),
      droppableRects: buildThreeColumnRects(),
    }))

    expect(collisions).toEqual([{ id: 'col-1' }])
  })
})

describe('pickHorizontalColumnOverId', () => {
  const columns = [
    { id: 'col-1', left: 20, width: 300 },
    { id: 'col-2', left: 334, width: 300 },
    { id: 'col-3', left: 648, width: 300 },
  ]

  it('keeps the dragged first column in place while the pointer stays left of the next center', () => {
    expect(pickHorizontalColumnOverId(100, columns, 'col-1')).toBe('col-1')
  })

  it('inserts at the start when dragging a later column onto the first half of the first list', () => {
    expect(pickHorizontalColumnOverId(100, columns, 'col-3')).toBe('col-1')
  })

  it('uses the left list of a gap so space opens between In Progress and To Do', () => {
    expect(pickHorizontalColumnOverId(641, columns, 'col-1')).toBe('col-2')
  })

  it('places a right-side list between the first two lists when the pointer is in that gap', () => {
    expect(pickHorizontalColumnOverId(327, columns, 'col-3')).toBe('col-2')
  })
})
