import { useLayoutEffect, useState } from 'react'

const DEFAULT_OFFSET_PX = 20
const LAYOUT_DEBOUNCE_MS = 32

export function measureIndicatorOffsetTop(viewport, anchor, barButtonHalfHeightPx = 4) {
  if (!viewport || !anchor) {
    return null
  }

  const viewportRect = viewport.getBoundingClientRect()
  const anchorRect = anchor.getBoundingClientRect()
  const anchorTop = anchorRect.top - viewportRect.top + viewport.scrollTop

  return Math.max(0, anchorTop + (anchor.offsetHeight / 2) - barButtonHalfHeightPx)
}

export default function useIndicatorAnchorOffset({
  viewportRef,
  anchorRef,
  refreshKey = 'default',
  defaultOffsetPx = DEFAULT_OFFSET_PX,
} = {}) {
  const [offsetTop, setOffsetTop] = useState(defaultOffsetPx)

  useLayoutEffect(() => {
    const viewport = viewportRef?.current
    const anchor = anchorRef?.current

    if (!viewport || !anchor) {
      setOffsetTop(defaultOffsetPx)
      return undefined
    }

    let frameId = null
    let layoutTimeoutRef = null

    function measure() {
      const nextOffset = measureIndicatorOffsetTop(viewport, anchor)
      if (nextOffset === null) return

      setOffsetTop((current) => (current === nextOffset ? current : nextOffset))
    }

    function scheduleMeasure() {
      if (frameId !== null) return

      frameId = requestAnimationFrame(() => {
        frameId = null
        measure()
      })
    }

    function scheduleLayoutMeasure() {
      if (layoutTimeoutRef !== null) {
        window.clearTimeout(layoutTimeoutRef)
      }

      layoutTimeoutRef = window.setTimeout(() => {
        layoutTimeoutRef = null
        scheduleMeasure()
      }, LAYOUT_DEBOUNCE_MS)
    }

    measure()
    window.addEventListener('resize', scheduleLayoutMeasure)

    const resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => scheduleLayoutMeasure())
      : null

    const mutationObserver = typeof MutationObserver === 'function'
      ? new MutationObserver(() => scheduleLayoutMeasure())
      : null

    resizeObserver?.observe(viewport)
    resizeObserver?.observe(anchor)
    mutationObserver?.observe(anchor, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => {
      window.removeEventListener('resize', scheduleLayoutMeasure)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()

      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
      if (layoutTimeoutRef !== null) {
        window.clearTimeout(layoutTimeoutRef)
      }
    }
  }, [anchorRef, defaultOffsetPx, refreshKey, viewportRef])

  return offsetTop
}
