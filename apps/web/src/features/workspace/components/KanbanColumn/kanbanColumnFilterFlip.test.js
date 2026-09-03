import { waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  measureCardRects,
  measureColumnStackCap,
  measureInFlowStackHeight,
  playKanbanFilterFlip,
  resolveAnimatedStackHeight,
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

describe('measureColumnStackCap', () => {
  it('reads the board height when the column max-height is a percentage', () => {
    const header = { getBoundingClientRect: () => ({ height: 40 }) }
    const composer = { getBoundingClientRect: () => ({ height: 48 }) }
    const stackRoot = { getBoundingClientRect: () => ({ height: 1800 }) }
    const viewport = {}
    const column = {
      offsetHeight: 200,
      clientHeight: 200,
      parentElement: { clientHeight: 600 },
      children: [header, stackRoot, composer],
      querySelector: (selector) => (selector === '[data-column-card-stack]' ? stackRoot : null),
    }
    viewport.closest = (selector) => (selector === '[data-column-id]' ? column : null)
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ maxHeight: '100%' })

    expect(measureColumnStackCap(viewport)).toBe(512)
    vi.restoreAllMocks()
  })

  it('skips the card stack root when measuring from the inner viewport', () => {
    const header = { getBoundingClientRect: () => ({ height: 40 }) }
    const composer = { getBoundingClientRect: () => ({ height: 48 }) }
    const stackRoot = { getBoundingClientRect: () => ({ height: 1800 }) }
    const viewport = {}
    const column = {
      offsetHeight: 600,
      clientHeight: 600,
      parentElement: { clientHeight: 600 },
      children: [header, stackRoot, composer],
      querySelector: (selector) => (selector === '[data-column-card-stack]' ? stackRoot : null),
    }
    viewport.closest = (selector) => (selector === '[data-column-id]' ? column : null)

    expect(measureColumnStackCap(viewport)).toBe(512)
  })
})

describe('resolveAnimatedStackHeight', () => {
  it('does not collapse remaining cards when their live height was not measured', () => {
    expect(resolveAnimatedStackHeight({
      contentHeight: 0,
      startHeight: 512,
      stackCap: 12,
      inFlowCount: 4,
    })).toBe(512)
  })

  it('keeps a scrolled list at the column cap when remaining content still overflows', () => {
    expect(resolveAnimatedStackHeight({
      contentHeight: 1800,
      startHeight: 512,
      stackCap: 512,
      inFlowCount: 12,
    })).toBe(512)
  })

  it('does not treat a missing cap as permission to grow past the visible list height', () => {
    expect(resolveAnimatedStackHeight({
      contentHeight: 1800,
      startHeight: 512,
      stackCap: Number.POSITIVE_INFINITY,
      inFlowCount: 12,
      idleOverflowing: true,
    })).toBe(512)
  })

  it('does not grow a short list past its idle height when no column cap exists', () => {
    expect(resolveAnimatedStackHeight({
      contentHeight: 178,
      startHeight: 88,
      stackCap: Number.POSITIVE_INFINITY,
      inFlowCount: 2,
      idleOverflowing: false,
    })).toBe(88)
  })

  it('shrinks a previously scrolled list when remaining cards no longer fill the column', () => {
    expect(resolveAnimatedStackHeight({
      contentHeight: 178,
      startHeight: 512,
      stackCap: 512,
      inFlowCount: 2,
      idleOverflowing: true,
    })).toBe(178)
  })

  it('grows a short list up to the column cap, not the full content height', () => {
    expect(resolveAnimatedStackHeight({
      contentHeight: 1800,
      startHeight: 88,
      stackCap: 512,
      inFlowCount: 12,
    })).toBe(512)
  })
})

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
    expect(viewport.style.height).toBe('260px')
    expect(viewport.animate).toHaveBeenCalledWith(
      [
        { height: '260px' },
        { height: `${expectedLastHeight}px` },
      ],
      expect.objectContaining({ fill: 'both' }),
    )
    expect(below.style.transform).toBe('translate3d(0px, 90px, 0)')
    expect(below.animate).toHaveBeenCalledWith(
      [
        { transform: 'translate3d(0px, 90px, 0)' },
        { transform: 'translate3d(0, 0, 0)' },
      ],
      expect.objectContaining({ fill: 'both' }),
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
      stackCap: 512,
      motionsById: {
        stay: 'in',
        enter: 'entering',
      },
      onComplete: vi.fn(),
    })

    const expectedLastHeight = measureInFlowStackHeight(
      new Map([
        ['stay', { height: 80 }],
        ['enter', { height: 80 }],
      ]),
      { stay: 'in', enter: 'entering' },
    )

    expect(viewport.style.height).toBe('88px')
    expect(viewport.style.maxHeight).toBe(`${Math.max(88, expectedLastHeight)}px`)
    expect(viewport.animate).toHaveBeenCalledWith(
      [
        { height: '88px' },
        { height: `${expectedLastHeight}px` },
      ],
      expect.objectContaining({ fill: 'both' }),
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

  it('does not grow a scrolled list past the column cap, so the composer stays at the visible bottom', () => {
    const staying = createNode({ top: 40, left: 10, width: 200, height: 400 })
    const entering = createNode({ top: 450, left: 10, width: 200, height: 400 })
    const stack = createViewport(512)
    const header = { getBoundingClientRect: () => ({ height: 40 }) }
    const composer = { getBoundingClientRect: () => ({ height: 48 }) }
    const column = {
      offsetHeight: 600,
      clientHeight: 600,
      parentElement: { clientHeight: 600 },
      children: [header, stack, composer],
    }
    stack.closest = (selector) => (selector === '[data-column-id]' ? column : null)

    playKanbanFilterFlip({
      viewport: stack,
      stack,
      nodesById: new Map([
        ['stay', staying],
        ['enter', entering],
      ]),
      firstRects: measureCardRects(new Map([['stay', staying]])),
      firstHeight: 512,
      stackCap: 512,
      motionsById: {
        stay: 'in',
        enter: 'entering',
      },
      onComplete: vi.fn(),
    })

    const heightKeyframes = stack.animate.mock.calls
      .map((call) => call[0])
      .find((frames) => frames?.[0]?.height)

    expect(heightKeyframes).toBeUndefined()
    expect(stack.style.height).toBe('512px')
    expect(stack.style.maxHeight).toBe('512px')
  })

  it('does not animate a scrolled list to content height when the column cap was not measured', () => {
    const staying = createNode({ top: 40, left: 10, width: 200, height: 400 })
    const entering = createNode({ top: 450, left: 10, width: 200, height: 400 })
    const stack = createViewport(512)

    playKanbanFilterFlip({
      viewport: stack,
      stack,
      nodesById: new Map([
        ['stay', staying],
        ['enter', entering],
      ]),
      firstRects: measureCardRects(new Map([['stay', staying]])),
      firstHeight: 512,
      idleOverflowing: true,
      motionsById: {
        stay: 'in',
        enter: 'entering',
      },
      onComplete: vi.fn(),
    })

    const heightKeyframes = stack.animate.mock.calls
      .map((call) => call[0])
      .find((frames) => frames?.[0]?.height)

    expect(heightKeyframes).toBeUndefined()
    expect(stack.style.height).toBe('512px')
    expect(stack.style.maxHeight).toBe('512px')
  })

  it('shrinks a tall list as soon as remaining cards no longer fill the column', () => {
    const staying = createNode({ top: 40, left: 10, width: 200, height: 80 })
    const exiting = createNode({ top: 130, left: 10, width: 200, height: 400 })
    const stack = createViewport(512)

    playKanbanFilterFlip({
      viewport: stack,
      stack,
      nodesById: new Map([
        ['stay', staying],
        ['gone', exiting],
      ]),
      firstRects: measureCardRects(new Map([
        ['stay', staying],
        ['gone', exiting],
      ])),
      firstHeight: 512,
      stackCap: 512,
      motionsById: {
        stay: 'in',
        gone: 'exiting',
      },
      onComplete: vi.fn(),
    })

    const expectedLastHeight = measureInFlowStackHeight(
      new Map([['stay', { height: 80 }]]),
      { stay: 'in' },
    )

    expect(stack.style.height).toBe('512px')
    expect(stack.style.maxHeight).toBe('512px')
    expect(stack.animate).toHaveBeenCalledWith(
      [
        { height: '512px' },
        { height: `${expectedLastHeight}px` },
      ],
      expect.objectContaining({ fill: 'both' }),
    )
  })
})
