import { useEffect, useRef, useState } from 'react'

export function useKanbanBoardToolbarMetrics() {
  const [toolbarMetrics, setToolbarMetrics] = useState({ left: null, width: 0, height: 44, bottom: 24 })
  const boardViewToolbarRef = useRef(null)

  useEffect(() => {
    const toolbar = boardViewToolbarRef.current
    if (!toolbar || typeof window === 'undefined') return undefined

    const updateToolbarMetrics = () => {
      const rect = toolbar.getBoundingClientRect()
      const computedStyles = window.getComputedStyle(toolbar)
      const nextMetrics = {
        left: Math.round(rect.left + (rect.width / 2)),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        bottom: Math.round(Number.parseFloat(computedStyles.bottom) || 24),
      }

      setToolbarMetrics((current) => (
        current.left === nextMetrics.left
        && current.width === nextMetrics.width
        && current.height === nextMetrics.height
        && current.bottom === nextMetrics.bottom
          ? current
          : nextMetrics
      ))
    }

    updateToolbarMetrics()

    const resizeHandler = () => updateToolbarMetrics()
    window.addEventListener('resize', resizeHandler)

    let observer = null
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(() => updateToolbarMetrics())
      observer.observe(toolbar)
    }

    return () => {
      window.removeEventListener('resize', resizeHandler)
      observer?.disconnect()
    }
  }, [])

  return {
    toolbarMetrics,
    boardViewToolbarRef,
  }
}
