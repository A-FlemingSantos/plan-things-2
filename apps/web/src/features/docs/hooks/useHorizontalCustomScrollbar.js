import { useCallback, useLayoutEffect, useRef, useState } from 'react'

const HIDDEN_THUMB_STATE = { visible: false, width: 0, left: 0 }
const SCROLL_IDLE_MS = 120
const LAYOUT_DEBOUNCE_MS = 32

function computeThumbMetrics(viewport, { insetPx, minThumbPx }) {
  const { clientWidth, scrollWidth, scrollLeft } = viewport

  if (!clientWidth || scrollWidth <= clientWidth + 1) {
    return HIDDEN_THUMB_STATE
  }

  const trackWidth = Math.max(0, clientWidth - insetPx * 2)
  const width = Math.max(
    minThumbPx,
    Math.round((clientWidth / scrollWidth) * trackWidth),
  )
  const maxLeft = Math.max(0, trackWidth - width)
  const scrollRange = scrollWidth - clientWidth
  const left = insetPx + (scrollRange > 0 ? (scrollLeft / scrollRange) * maxLeft : 0)

  return { visible: true, width, left }
}

function applyThumbStyles(thumb, metrics) {
  if (!thumb) return

  if (!metrics.visible) {
    thumb.style.width = '0px'
    thumb.style.transform = 'translate3d(0, 0, 0)'
    return
  }

  thumb.style.width = `${metrics.width}px`
  thumb.style.transform = `translate3d(${metrics.left}px, 0, 0)`
}

/** Horizontal twin of useCustomScrollbar — same behavior, scrollLeft axis. */
export default function useHorizontalCustomScrollbar({
  enabled = true,
  refreshKey = 'default',
  insetPx = 0,
  minThumbPx = 24,
} = {}) {
  const viewportRef = useRef(null)
  const thumbRef = useRef(null)
  const thumbMetricsRef = useRef(HIDDEN_THUMB_STATE)
  const isScrollingRef = useRef(false)
  const scrollIdleTimeoutRef = useRef(null)
  const layoutTimeoutRef = useRef(null)
  const [thumbVisible, setThumbVisible] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragStateRef = useRef(null)

  const stopDragging = useCallback(() => {
    dragStateRef.current = null
    setIsDragging(false)
  }, [])

  const handleThumbPointerDown = useCallback((event) => {
    const metrics = thumbMetricsRef.current
    if (!enabled || !metrics.visible) return

    const viewport = viewportRef.current
    if (!viewport) return

    const trackWidth = Math.max(0, viewport.clientWidth - insetPx * 2)
    const maxThumbTravel = Math.max(0, trackWidth - metrics.width)
    const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth)

    if (!maxThumbTravel || !maxScrollLeft) return

    event.preventDefault()
    event.stopPropagation()

    dragStateRef.current = {
      startX: event.clientX,
      startScrollLeft: viewport.scrollLeft,
      maxScrollLeft,
      maxThumbTravel,
    }
    setIsDragging(true)
  }, [enabled, insetPx])

  useLayoutEffect(() => {
    if (!enabled) {
      thumbMetricsRef.current = HIDDEN_THUMB_STATE
      setThumbVisible(false)
      applyThumbStyles(thumbRef.current, HIDDEN_THUMB_STATE)
      stopDragging()
      return undefined
    }

    const viewport = viewportRef.current
    if (!viewport) return undefined

    let frameId = null
    let dragFrameId = null

    function setVisible(nextVisible) {
      setThumbVisible((current) => (current === nextVisible ? current : nextVisible))
    }

    function commitMetrics(nextMetrics) {
      const previous = thumbMetricsRef.current
      thumbMetricsRef.current = nextMetrics
      applyThumbStyles(thumbRef.current, nextMetrics)

      if (previous.visible !== nextMetrics.visible) {
        setVisible(nextMetrics.visible)
      }
    }

    function updateThumbPositionFromScroll() {
      const thumb = thumbRef.current
      if (!thumb) return

      const nextMetrics = computeThumbMetrics(viewport, { insetPx, minThumbPx })
      const metrics = thumbMetricsRef.current

      if (
        metrics.visible !== nextMetrics.visible
        || metrics.width !== nextMetrics.width
      ) {
        commitMetrics(nextMetrics)
        return
      }

      thumbMetricsRef.current = { ...metrics, left: nextMetrics.left }
      thumb.style.transform = `translate3d(${nextMetrics.left}px, 0, 0)`
    }

    function updateThumbLayout() {
      commitMetrics(computeThumbMetrics(viewport, { insetPx, minThumbPx }))
    }

    function scheduleFrameUpdate(updateFn) {
      if (frameId !== null) return

      frameId = requestAnimationFrame(() => {
        frameId = null
        updateFn()
      })
    }

    function scheduleLayoutUpdate() {
      if (layoutTimeoutRef.current !== null) {
        window.clearTimeout(layoutTimeoutRef.current)
      }

      layoutTimeoutRef.current = window.setTimeout(() => {
        layoutTimeoutRef.current = null
        scheduleFrameUpdate(updateThumbLayout)
      }, LAYOUT_DEBOUNCE_MS)
    }

    function markScrolling() {
      isScrollingRef.current = true

      if (layoutTimeoutRef.current !== null) {
        window.clearTimeout(layoutTimeoutRef.current)
        layoutTimeoutRef.current = null
      }

      scheduleFrameUpdate(updateThumbPositionFromScroll)

      if (scrollIdleTimeoutRef.current !== null) {
        window.clearTimeout(scrollIdleTimeoutRef.current)
      }

      scrollIdleTimeoutRef.current = window.setTimeout(() => {
        scrollIdleTimeoutRef.current = null
        isScrollingRef.current = false
        updateThumbLayout()
      }, SCROLL_IDLE_MS)
    }

    function handleScroll() {
      markScrolling()
    }

    function handlePointerMove(event) {
      const dragState = dragStateRef.current
      if (!dragState) return

      event.preventDefault()

      if (dragFrameId !== null) {
        cancelAnimationFrame(dragFrameId)
      }

      dragFrameId = requestAnimationFrame(() => {
        dragFrameId = null
        const deltaX = event.clientX - dragState.startX
        const nextScrollLeft = dragState.startScrollLeft
          + (deltaX / dragState.maxThumbTravel) * dragState.maxScrollLeft
        viewport.scrollLeft = Math.min(
          dragState.maxScrollLeft,
          Math.max(0, nextScrollLeft),
        )
      })
    }

    function handlePointerUp() {
      stopDragging()
    }

    const resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => scheduleLayoutUpdate())
      : null

    const mutationObserver = typeof MutationObserver === 'function'
      ? new MutationObserver(() => scheduleLayoutUpdate())
      : null

    updateThumbLayout()
    viewport.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', scheduleLayoutUpdate)
    window.addEventListener('pointermove', handlePointerMove, { passive: false })
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    resizeObserver?.observe(viewport)
    mutationObserver?.observe(viewport, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => {
      viewport.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', scheduleLayoutUpdate)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()

      if (frameId !== null) cancelAnimationFrame(frameId)
      if (dragFrameId !== null) cancelAnimationFrame(dragFrameId)
      if (scrollIdleTimeoutRef.current !== null) {
        window.clearTimeout(scrollIdleTimeoutRef.current)
        scrollIdleTimeoutRef.current = null
      }
      if (layoutTimeoutRef.current !== null) {
        window.clearTimeout(layoutTimeoutRef.current)
        layoutTimeoutRef.current = null
      }

      isScrollingRef.current = false
      stopDragging()
    }
  }, [enabled, insetPx, minThumbPx, refreshKey, stopDragging])

  return {
    viewportRef,
    thumbRef,
    thumbVisible,
    isDragging,
    handleThumbPointerDown,
  }
}
