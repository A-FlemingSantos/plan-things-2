import { memo } from 'react'
import useCustomScrollbar from '../../hooks/useCustomScrollbar.js'
import styles from './CustomScrollArea.module.css'

const DEFAULT_INSET_PX = 0
const DEFAULT_MIN_THUMB_PX = 18

function CustomScrollArea({
  children,
  enabled = true,
  refreshKey = 'default',
  insetPx = DEFAULT_INSET_PX,
  minThumbPx = DEFAULT_MIN_THUMB_PX,
  className = '',
  viewportClassName = '',
  viewportTag = 'div',
  viewportProps = null,
}) {
  const scrollbar = useCustomScrollbar({
    enabled,
    refreshKey,
    insetPx,
    minThumbPx,
  })

  const ViewportTag = viewportTag
  const viewportRest = viewportProps ?? {}
  const rootClassName = [styles.root, className].filter(Boolean).join(' ')
  const viewportCombinedClassName = [styles.viewport, viewportClassName].filter(Boolean).join(' ')
  const trackClassName = [
    styles.track,
    scrollbar.thumbVisible ? '' : styles.trackHidden,
  ].filter(Boolean).join(' ')

  return (
    <div className={rootClassName}>
      <ViewportTag
        {...viewportRest}
        ref={scrollbar.viewportRef}
        className={viewportCombinedClassName}
      >
        {children}
      </ViewportTag>
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

export default memo(CustomScrollArea)
