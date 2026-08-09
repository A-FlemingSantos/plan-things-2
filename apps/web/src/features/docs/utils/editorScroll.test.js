import { describe, expect, it } from 'vitest'
import {
  computeViewportScrollDelta,
  restoreCaretScrollLock,
} from './editorScroll.js'

describe('computeViewportScrollDelta', () => {
  const root = { top: 100, bottom: 500 }

  it('does not scroll when the caret is already inside the viewport', () => {
    expect(computeViewportScrollDelta({ top: 200, bottom: 220 }, root)).toBe(0)
  })

  it('scrolls up when the caret is above the viewport', () => {
    expect(computeViewportScrollDelta({ top: 50, bottom: 70 }, root, 16)).toBe(-(100 + 16 - 50))
  })

  it('scrolls down when the caret is below the viewport', () => {
    expect(computeViewportScrollDelta({ top: 520, bottom: 540 }, root, 16)).toBe(540 - (500 - 16))
  })
})

describe('restoreCaretScrollLock', () => {
  it('pins near-bottom edits to the bottom of the scroll root', () => {
    const scrollRoot = {
      scrollTop: 400,
      scrollHeight: 500,
      clientHeight: 100,
    }
    const view = {
      isDestroyed: false,
      state: { selection: { head: 1 } },
      coordsAtPos: () => ({ top: 480, bottom: 500 }),
    }

    restoreCaretScrollLock(view, {
      scrollRoot,
      caretOffsetInViewport: 80,
      distanceFromBottom: 12,
    })

    expect(scrollRoot.scrollTop).toBe(388)
  })

  it('keeps the caret at the same viewport offset when not near the bottom', () => {
    const scrollRoot = {
      scrollTop: 200,
      scrollHeight: 800,
      clientHeight: 100,
      getBoundingClientRect: () => ({ top: 0, bottom: 100 }),
    }
    const view = {
      isDestroyed: false,
      state: { selection: { head: 1 } },
      coordsAtPos: () => ({ top: 120, bottom: 140 }),
    }

    restoreCaretScrollLock(view, {
      scrollRoot,
      caretOffsetInViewport: 40,
      distanceFromBottom: 500,
    })

    // caret is at 120, want offset 40 → scroll by +80
    expect(scrollRoot.scrollTop).toBe(280)
  })
})
