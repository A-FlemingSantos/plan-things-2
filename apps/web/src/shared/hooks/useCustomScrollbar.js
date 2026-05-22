import { useCallback, useEffect, useRef, useState } from 'react'

const HIDDEN_THUMB_STATE = { visible: false, height: 0, top: 0 }

export default function useCustomScrollbar({
  enabled = true,
  refreshKey = 'default',
  insetPx = 0,
  minThumbPx = 18,
} = {}) {
  const viewportRef = useRef(null)
  const [thumbState, setThumbState] = useState(HIDDEN_THUMB_STATE)
  const [isDragging, setIsDragging] = useState(false)
  const dragStateRef = useRef(null)

  const stopDragging = useCallback(() => {
    dragStateRef.current = null
    setIsDragging(false)
  }, [])

  const handleThumbPointerDown = useCallback((event) => {
    if (!enabled || !thumbState.visible) return

    const viewport = viewportRef.current
    if (!viewport) return

    const trackHeight = Math.max(0, viewport.clientHeight - insetPx * 2)
    const maxThumbTravel = Math.max(0, trackHeight - thumbState.height)
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
  }, [enabled, insetPx, thumbState.height, thumbState.visible])

  useEffect(() => {
    if (!enabled) {
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
      ? new ResizeObserver(() => scheduleUpdate())
      : null

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

    function updateThumb() {
      const { clientHeight, scrollHeight, scrollTop } = viewport

      if (!clientHeight || scrollHeight <= clientHeight + 1) {
        setThumbState((current) => (
          current.visible || current.height || current.top
            ? HIDDEN_THUMB_STATE
            : current
        ))
        return
      }

      const trackHeight = Math.max(0, clientHeight - insetPx * 2)
      const height = Math.max(
        minThumbPx,
        Math.round((clientHeight / scrollHeight) * trackHeight),
      )
      const maxTop = Math.max(0, trackHeight - height)
      const top = insetPx + Math.round((scrollTop / (scrollHeight - clientHeight)) * maxTop)

      setThumbState((current) => (
        current.visible === true && current.height === height && current.top === top
          ? current
          : { visible: true, height, top }
      ))
    }

    function scheduleUpdate() {
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }

      frameId = requestAnimationFrame(() => {
        frameId = null
        updateThumb()
      })
    }

    scheduleUpdate()
    viewport.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('pointermove', handlePointerMove, { passive: false })
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    if (resizeObserver) {
      resizeObserver.observe(viewport)
      Array.from(viewport.children).forEach((child) => resizeObserver.observe(child))
    }

    return () => {
      viewport.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
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
  }, [enabled, insetPx, minThumbPx, refreshKey, stopDragging])

  return { viewportRef, thumbState, isDragging, handleThumbPointerDown }
}
