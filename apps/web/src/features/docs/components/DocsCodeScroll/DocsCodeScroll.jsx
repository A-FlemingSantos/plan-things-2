import { memo, useCallback } from 'react'
import useHorizontalCustomScrollbar from '../../hooks/useHorizontalCustomScrollbar.js'
import styles from './DocsCodeScroll.module.css'

function assignRef(ref, value) {
  if (typeof ref === 'function') {
    ref(value)
    return
  }
  if (ref) ref.current = value
}

/**
 * Horizontal twin of shared CustomScrollArea for Docs code fences.
 * Same thumb metrics/colors: 2px → 6px on hover, 12px hit track.
 */
function DocsCodeScroll({
  children,
  enabled = true,
  refreshKey = 'default',
  className = '',
  viewportClassName = '',
  viewportRef = null,
}) {
  const scrollbar = useHorizontalCustomScrollbar({
    enabled,
    refreshKey,
  })

  const rootClassName = [styles.root, className].filter(Boolean).join(' ')
  const trackClassName = [
    styles.track,
    scrollbar.thumbVisible ? '' : styles.trackHidden,
  ].filter(Boolean).join(' ')

  const setViewportRef = useCallback((node) => {
    assignRef(scrollbar.viewportRef, node)
    assignRef(viewportRef, node)
  }, [scrollbar.viewportRef, viewportRef])

  return (
    <div className={rootClassName}>
      <pre
        ref={setViewportRef}
        className={[styles.viewport, viewportClassName].filter(Boolean).join(' ')}
      >
        {children}
      </pre>
      <span className={trackClassName} aria-hidden={!scrollbar.thumbVisible}>
        <span
          ref={scrollbar.thumbRef}
          className={`${styles.thumb} ${scrollbar.isDragging ? styles.thumbDragging : ''}`}
          onPointerDown={scrollbar.handleThumbPointerDown}
        />
      </span>
    </div>
  )
}

export default memo(DocsCodeScroll)
