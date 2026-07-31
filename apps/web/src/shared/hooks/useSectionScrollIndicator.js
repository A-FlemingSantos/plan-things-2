import { useCallback, useLayoutEffect, useRef, useState } from 'react'

const MIN_SECTION_HEIGHT_PX = 1
const MIN_BAR_WIDTH_PX = 6
const MAX_BAR_WIDTH_PX = 22
const LAYOUT_DEBOUNCE_MS = 32

export function getSectionVisibilityRatio(viewport, sectionElement) {
  if (!viewport || !sectionElement) return 0

  const viewportRect = viewport.getBoundingClientRect()
  const sectionRect = sectionElement.getBoundingClientRect()
  const sectionHeight = sectionRect.height

  if (sectionHeight <= MIN_SECTION_HEIGHT_PX) {
    return 0
  }

  const visibleTop = Math.max(viewportRect.top, sectionRect.top)
  const visibleBottom = Math.min(viewportRect.bottom, sectionRect.bottom)
  const visibleHeight = Math.max(0, visibleBottom - visibleTop)

  return Math.min(1, visibleHeight / sectionHeight)
}

export function getSectionOffsetTop(viewport, sectionElement) {
  if (!viewport || !sectionElement) return 0

  const viewportRect = viewport.getBoundingClientRect()
  const sectionRect = sectionElement.getBoundingClientRect()

  return sectionRect.top - viewportRect.top + viewport.scrollTop
}

export function computeSectionBarMetrics(
  viewport,
  section,
  {
    minBarWidthPx = MIN_BAR_WIDTH_PX,
    maxBarWidthPx = MAX_BAR_WIDTH_PX,
  } = {},
) {
  const element = section.element
  if (!viewport || !element) {
    return null
  }

  const sectionHeight = element.offsetHeight
  if (sectionHeight <= MIN_SECTION_HEIGHT_PX) {
    return null
  }

  const visibilityRatio = getSectionVisibilityRatio(viewport, element)
  const widthPx = minBarWidthPx + (maxBarWidthPx - minBarWidthPx) * visibilityRatio

  return {
    id: section.id,
    label: section.label ?? section.id,
    widthPx,
    visibilityRatio,
  }
}

function computeBars(viewport, sections, options) {
  if (!viewport) return []

  const scrollHeight = viewport.scrollHeight
  const trackHeight = viewport.clientHeight

  if (!scrollHeight || !trackHeight || scrollHeight <= trackHeight + 1) {
    return []
  }

  return sections
    .map((section) => computeSectionBarMetrics(viewport, section, options))
    .filter(Boolean)
}

export default function useSectionScrollIndicator({
  viewportRef,
  sections,
  enabled = true,
  refreshKey = 'default',
  minBarWidthPx = MIN_BAR_WIDTH_PX,
  maxBarWidthPx = MAX_BAR_WIDTH_PX,
} = {}) {
  const [bars, setBars] = useState([])
  const sectionsRef = useRef(sections)
  sectionsRef.current = sections

  const updateBars = useCallback(() => {
    const viewport = viewportRef.current
    if (!enabled || !viewport) {
      setBars((current) => (current.length === 0 ? current : []))
      return
    }

    const nextBars = computeBars(viewport, sectionsRef.current, {
      minBarWidthPx,
      maxBarWidthPx,
    })

    setBars((current) => {
      if (
        current.length === nextBars.length
        && current.every((bar, index) => {
          const next = nextBars[index]
          return next
            && bar.id === next.id
            && bar.widthPx === next.widthPx
        })
      ) {
        return current
      }

      return nextBars
    })
  }, [enabled, maxBarWidthPx, minBarWidthPx, viewportRef])

  const scrollToSection = useCallback((sectionId) => {
    const viewport = viewportRef.current
    const section = sectionsRef.current.find((entry) => entry.id === sectionId)
    if (!viewport || !section?.element) return

    const offsetTop = getSectionOffsetTop(viewport, section.element)
    viewport.scrollTo({
      top: Math.max(0, offsetTop),
      behavior: 'smooth',
    })
  }, [viewportRef])

  useLayoutEffect(() => {
    if (!enabled) {
      setBars([])
      return undefined
    }

    const viewport = viewportRef.current
    if (!viewport) return undefined

    let frameId = null
    let layoutTimeoutRef = null

    function scheduleUpdate() {
      if (frameId !== null) return

      frameId = requestAnimationFrame(() => {
        frameId = null
        updateBars()
      })
    }

    function scheduleLayoutUpdate() {
      if (layoutTimeoutRef !== null) {
        window.clearTimeout(layoutTimeoutRef)
      }

      layoutTimeoutRef = window.setTimeout(() => {
        layoutTimeoutRef = null
        scheduleUpdate()
      }, LAYOUT_DEBOUNCE_MS)
    }

    updateBars()
    viewport.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleLayoutUpdate)

    const resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => scheduleLayoutUpdate())
      : null

    const mutationObserver = typeof MutationObserver === 'function'
      ? new MutationObserver(() => scheduleLayoutUpdate())
      : null

    resizeObserver?.observe(viewport)
    mutationObserver?.observe(viewport, {
      childList: true,
      subtree: true,
      attributes: true,
    })

    return () => {
      viewport.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleLayoutUpdate)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()

      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
      if (layoutTimeoutRef !== null) {
        window.clearTimeout(layoutTimeoutRef)
      }
    }
  }, [enabled, refreshKey, updateBars, viewportRef])

  return {
    bars,
    scrollToSection,
    indicatorVisible: bars.length > 0,
  }
}
