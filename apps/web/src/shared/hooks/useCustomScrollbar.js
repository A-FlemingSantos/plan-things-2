import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const HIDDEN_THUMB_STATE = { visible: false, height: 0, top: 0 }

function computeThumbMetrics(viewport, { insetPx, minThumbPx }) {
  const { clientHeight, scrollHeight, scrollTop } = viewport

  if (!clientHeight || scrollHeight <= clientHeight + 1) {
    return HIDDEN_THUMB_STATE
  }

  const trackHeight = Math.max(0, clientHeight - insetPx * 2)
  const height = Math.max(
    minThumbPx,
    Math.round((clientHeight / scrollHeight) * trackHeight),
  )
  const maxTop = Math.max(0, trackHeight - height)
  const scrollRange = scrollHeight - clientHeight
  const top = insetPx + (scrollRange > 0 ? (scrollTop / scrollRange) * maxTop : 0)

  return { visible: true, height, top }
}

export default function useCustomScrollbar({
  enabled = true,
  refreshKey = 'default',
  insetPx = 0,
  minThumbPx = 18,
} = {}) {
  const viewportRef = useRef(null)
  const thumbRef = useRef(null)
  const thumbMetricsRef = useRef(HIDDEN_THUMB_STATE)
  const [thumbState, setThumbState] = useState(HIDDEN_THUMB_STATE)
  const [isDragging, setIsDragging] = useState(false)
  const dragStateRef = useRef(null)

  const applyThumbStyles = useCallback((metrics) => {
    const thumb = thumbRef.current
    if (!thumb || !metrics.visible) return

    thumb.style.height = `${metrics.height}px`
    thumb.style.transform = `translate3d(0, ${metrics.top}px, 0)`
  }, [])

  const stopDragging = useCallback(() => {
    dragStateRef.current = null
    setIsDragging(false)
  }, [])

  const handleThumbPointerDown = useCallback((event) => {
    const metrics = thumbMetricsRef.current
    if (!enabled || !metrics.visible) return

    const viewport = viewportRef.current
    if (!viewport) return

    const trackHeight = Math.max(0, viewport.clientHeight - insetPx * 2)
    const maxThumbTravel = Math.max(0, trackHeight - metrics.height)
    const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight)

    if (!maxThumbTravel || !maxScrollTop) return

    event.preventDefault()
    event.stopPropagation()

    dragStateRef.current = {
      startY: event.clientY,
      startScrollTop: viewport.scrollTop,
      maxScrollTop,
      maxThumbTravel,
    }
    setIsDragging(true)
  }, [enabled, insetPx])

  useLayoutEffect(() => {
    if (!thumbState.visible) return
    applyThumbStyles(thumbMetricsRef.current)
  }, [applyThumbStyles, thumbState.height, thumbState.visible])

  useEffect(() => {
    if (!enabled) {
      thumbMetricsRef.current = HIDDEN_THUMB_STATE
      setThumbState((current) => (
        current.visible || current.height || current.top
          ? HIDDEN_THUMB_STATE
          : current
      ))
      stopDragging()
      return undefined
    }

    const viewport = viewportRef.current
    if (!viewport) return undefined

    let frameId = null
    let dragFrameId = null
    const resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => scheduleFullUpdate())
      : null

    function commitMetrics(nextMetrics) {
      const previous = thumbMetricsRef.current
      thumbMetricsRef.current = nextMetrics
      applyThumbStyles(nextMetrics)

      if (
        previous.visible !== nextMetrics.visible
        || previous.height !== nextMetrics.height
      ) {
        setThumbState(nextMetrics)
      }
    }

    function updateThumbPositionFromScroll() {
      const metrics = thumbMetricsRef.current
      const thumb = thumbRef.current
      if (!metrics.visible || !thumb) return

      const { clientHeight, scrollHeight, scrollTop } = viewport
      const scrollRange = scrollHeight - clientHeight
      if (scrollRange <= 0) {
        scheduleFullUpdate()
        return
      }

      const trackHeight = Math.max(0, clientHeight - insetPx * 2)
      const maxTop = Math.max(0, trackHeight - metrics.height)
      const top = insetPx + (scrollTop / scrollRange) * maxTop

      thumbMetricsRef.current = { ...metrics, top }
      thumb.style.transform = `translate3d(0, ${top}px, 0)`
    }

    function updateThumb() {
      commitMetrics(computeThumbMetrics(viewport, { insetPx, minThumbPx }))
    }

    function scheduleFullUpdate() {
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }

      frameId = requestAnimationFrame(() => {
        frameId = null
        updateThumb()
      })
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
        const deltaY = event.clientY - dragState.startY
        const nextScrollTop = dragState.startScrollTop + (deltaY / dragState.maxThumbTravel) * dragState.maxScrollTop
        viewport.scrollTop = Math.min(dragState.maxScrollTop, Math.max(0, nextScrollTop))
      })
    }

    function handlePointerUp() {
      stopDragging()
    }

    scheduleFullUpdate()
    viewport.addEventListener('scroll', updateThumbPositionFromScroll, { passive: true })
    window.addEventListener('resize', scheduleFullUpdate)
    window.addEventListener('pointermove', handlePointerMove, { passive: false })
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    if (resizeObserver) {
      resizeObserver.observe(viewport)
      Array.from(viewport.children).forEach((child) => resizeObserver.observe(child))
    }

    return () => {
      viewport.removeEventListener('scroll', updateThumbPositionFromScroll)
      window.removeEventListener('resize', scheduleFullUpdate)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      resizeObserver?.disconnect()
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
      if (dragFrameId !== null) {
        cancelAnimationFrame(dragFrameId)
      }
      stopDragging()
    }
  }, [applyThumbStyles, enabled, insetPx, minThumbPx, refreshKey, stopDragging])

  return { viewportRef, thumbRef, thumbState, isDragging, handleThumbPointerDown }
}
