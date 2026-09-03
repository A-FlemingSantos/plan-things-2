import { waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  measureCardRects,
  measureInFlowStackHeight,
  playKanbanFilterFlip,
} from './kanbanColumnFilterFlip.js'

function createAnimation() {
  return {
    finished: Promise.resolve(),
    cancel: vi.fn(),
    commitStyles: vi.fn(),
  }
}

function createNode(rect) {
  const style = {}
  let currentRect = rect
  return {
    style,
    isConnected: true,
    getBoundingClientRect: () => currentRect,
    setRect(next) {
      currentRect = next
    },
    getAnimations: () => [],
    animate: vi.fn(() => createAnimation()),
  }
}

function createViewport(height = 260) {
  return {
    style: {},
    offsetHeight: height,
    scrollHeight: height,
    scrollTop: 0,
    scrollLeft: 0,
    getBoundingClientRect: () => ({ top: 0, left: 0 }),
    animate: vi.fn(() => createAnimation()),
  }
}

describe('playKanbanFilterFlip', () => {
  it('shrinks the list from the previous height, ignoring removed cards still in the DOM', () => {
    const staying = createNode({ top: 40, left: 10, width: 200, height: 80 })
    const exiting = createNode({ top: 130, left: 10, width: 200, height: 80 })
    const viewport = createViewport(260)
    viewport.scrollHeight = 260

    const originalStayingMeasure = staying.getBoundingClientRect
    staying.getBoundingClientRect = () => {
      if (exiting.style.position === 'absolute') {
        return { top: 40, left: 10, width: 200, height: 80 }
      }
      return originalStayingMeasure()
    }

    const below = createNode({ top: 220, left: 10, width: 200, height: 80 })
    below.getBoundingClientRect = () => {
      if (exiting.style.position === 'absolute') {
        return { top: 130, left: 10, width: 200, height: 80 }
      }
      return { top: 220, left: 10, width: 200, height: 80 }
    }

    const motionsById = {
      'stay-top': 'in',
      gone: 'exiting',
      'stay-bottom': 'in',
    }
    const nodesById = new Map([
      ['stay-top', staying],
      ['gone', exiting],
      ['stay-bottom', below],
    ])
    const firstRects = measureCardRects(nodesById)

    playKanbanFilterFlip({
      viewport,
      stack: viewport,
      nodesById,
      firstRects,
      firstHeight: 260,
      motionsById,
      onComplete: vi.fn(),
    })

    const lastRects = new Map([
      ['stay-top', { height: 80 }],
      ['stay-bottom', { height: 80 }],
    ])
    const expectedLastHeight = measureInFlowStackHeight(lastRects, {
      'stay-top': 'in',
      'stay-bottom': 'in',
    })

    expect(exiting.style.position).toBe('absolute')
    expect(viewport.animate).toHaveBeenCalledWith(
      [
        { height: '260px' },
        { height: `${expectedLastHeight}px` },
      ],
      expect.objectContaining({ fill: 'forwards' }),
    )
    expect(below.animate).toHaveBeenCalledWith(
      [
        { transform: 'translate3d(0px, 90px, 0)' },
        { transform: 'translate3d(0, 0, 0)' },
      ],
      expect.objectContaining({ fill: 'forwards' }),
    )
  })

  it('grows the list from the idle height when cards re-enter, instead of jumping to the new layout height', () => {
    const staying = createNode({ top: 40, left: 10, width: 200, height: 80 })
    const entering = createNode({ top: 130, left: 10, width: 200, height: 80 })
    const viewport = createViewport(178)

    playKanbanFilterFlip({
      viewport,
      stack: viewport,
      nodesById: new Map([
        ['stay', staying],
        ['enter', entering],
      ]),
      firstRects: measureCardRects(new Map([
        ['stay', staying],
      ])),
      firstHeight: 88,
      motionsById: {
        stay: 'in',
        enter: 'entering',
      },
      onComplete: vi.fn(),
    })

    expect(viewport.style.height).toBe('88px')
    expect(viewport.animate).toHaveBeenCalledWith(
      [
        { height: '88px' },
        { height: `${measureInFlowStackHeight(
          new Map([
            ['stay', { height: 80 }],
            ['enter', { height: 80 }],
          ]),
          { stay: 'in', enter: 'entering' },
        )}px` },
      ],
      expect.objectContaining({ fill: 'forwards' }),
    )
  })

  it('keeps removed cards hidden after the fade so they cannot flash back', async () => {
    const exiting = createNode({ top: 130, left: 10, width: 200, height: 80 })
    const staying = createNode({ top: 40, left: 10, width: 200, height: 80 })
    const viewport = createViewport(88)

    playKanbanFilterFlip({
      viewport,
      firstHeight: 178,
      nodesById: new Map([
        ['stay', staying],
        ['gone', exiting],
      ]),
      firstRects: measureCardRects(new Map([
        ['stay', staying],
        ['gone', exiting],
      ])),
      motionsById: {
        stay: 'in',
        gone: 'exiting',
      },
      onComplete: vi.fn(),
    })

    expect(exiting.animate).toHaveBeenCalled()
    await waitFor(() => {
      expect(exiting.style.opacity).toBe('0')
      expect(exiting.style.visibility).toBe('hidden')
      expect(exiting.style.position).toBe('absolute')
    })
  })

  it('completes pending motion immediately without a viewport', () => {
    const onComplete = vi.fn()
    playKanbanFilterFlip({
      viewport: null,
      nodesById: new Map(),
      firstRects: new Map(),
      motionsById: { a: 'exiting', b: 'entering' },
      onComplete,
    })

    expect(onComplete).toHaveBeenCalledWith('a')
    expect(onComplete).toHaveBeenCalledWith('b')
  })
})
