import { describe, expect, it } from 'vitest'
import {
  computeSectionBarMetrics,
  getSectionOffsetTop,
  getSectionVisibilityRatio,
} from './useSectionScrollIndicator.js'

function createRect({ top, height }) {
  return {
    top,
    bottom: top + height,
    height,
  }
}

describe('useSectionScrollIndicator helpers', () => {
  it('computes full visibility when the section fits inside the viewport', () => {
    const viewport = {
      scrollTop: 0,
      getBoundingClientRect: () => createRect({ top: 0, height: 400 }),
    }
    const sectionElement = {
      offsetHeight: 120,
      getBoundingClientRect: () => createRect({ top: 80, height: 120 }),
    }

    expect(getSectionVisibilityRatio(viewport, sectionElement)).toBe(1)
  })

  it('computes partial visibility when only part of the section is visible', () => {
    const viewport = {
      scrollTop: 0,
      getBoundingClientRect: () => createRect({ top: 0, height: 200 }),
    }
    const sectionElement = {
      offsetHeight: 200,
      getBoundingClientRect: () => createRect({ top: 100, height: 200 }),
    }

    expect(getSectionVisibilityRatio(viewport, sectionElement)).toBe(0.5)
  })

  it('maps visibility ratio to bar width and skips empty sections', () => {
    const viewport = {
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 400,
      getBoundingClientRect: () => createRect({ top: 0, height: 400 }),
    }
    const visibleSection = {
      id: 'description',
      label: 'Descrição',
      element: {
        offsetHeight: 250,
        getBoundingClientRect: () => createRect({ top: 120, height: 250 }),
      },
    }
    const emptySection = {
      id: 'github',
      label: 'GitHub',
      element: {
        offsetHeight: 0,
        getBoundingClientRect: () => createRect({ top: 0, height: 0 }),
      },
    }

    expect(computeSectionBarMetrics(viewport, emptySection)).toBeNull()

    const metrics = computeSectionBarMetrics(viewport, visibleSection)
    expect(metrics).toMatchObject({
      id: 'description',
      label: 'Descrição',
      visibilityRatio: 1,
      widthPx: 22,
    })
  })

  it('computes scroll offsets for section navigation', () => {
    const viewport = {
      scrollTop: 120,
      getBoundingClientRect: () => createRect({ top: 0, height: 400 }),
    }
    const sectionElement = {
      getBoundingClientRect: () => createRect({ top: 180, height: 160 }),
    }

    expect(getSectionOffsetTop(viewport, sectionElement)).toBe(300)
  })
})