import { describe, expect, it } from 'vitest'
import { measureIndicatorOffsetTop } from './useIndicatorAnchorOffset.js'

function createRect({ top, height }) {
  return {
    top,
    bottom: top + height,
    height,
  }
}

describe('measureIndicatorOffsetTop', () => {
  it('centers the indicator group on the anchor element', () => {
    const viewport = {
      scrollTop: 0,
      getBoundingClientRect: () => createRect({ top: 0, height: 600 }),
    }
    const anchor = {
      offsetHeight: 48,
      getBoundingClientRect: () => createRect({ top: 48, height: 48 }),
    }

    expect(measureIndicatorOffsetTop(viewport, anchor)).toBe(68)
  })
})
