import { createContext, useContext, useMemo } from 'react'
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import styles from './Dock.module.css'

const DockContext = createContext(null)

const DOCK_PILL_LAYOUT_ID = 'app-dock-active-pill'

const SPRING_LAYOUT = {
  type: 'spring',
  stiffness: 520,
  damping: 38,
  mass: 0.8,
}

export function Dock({ children, size = 34, className = '' }) {
  const value = useMemo(
    () => ({ size, pillLayoutId: DOCK_PILL_LAYOUT_ID }),
    [size],
  )

  return (
    <DockContext.Provider value={value}>
      <LayoutGroup id="app-navigation-dock">
        <div className={[styles.dock, className].filter(Boolean).join(' ')}>
          {children}
        </div>
      </LayoutGroup>
    </DockContext.Provider>
  )
}

export function DockItem({
  children,
  className = '',
  onClick,
  active = false,
  'aria-label': ariaLabel,
}) {
  const dock = useContext(DockContext)
  const reduce = useReducedMotion()
  const size = dock?.size ?? 34
  const pillLayoutId = dock?.pillLayoutId ?? DOCK_PILL_LAYOUT_ID

  const pill = active ? (
    <motion.span
      layoutId={pillLayoutId}
      transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
      className={styles.pill}
      aria-hidden="true"
    />
  ) : null

  const sharedStyle = { width: size, height: size }
  const sharedClassName = [styles.item, className].filter(Boolean).join(' ')

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={active}
        style={sharedStyle}
        className={[sharedClassName, styles.itemButton].filter(Boolean).join(' ')}
      >
        {pill}
        {children}
      </button>
    )
  }

  return (
    <div style={sharedStyle} className={sharedClassName}>
      {pill}
      {children}
    </div>
  )
}

export function DockSeparator({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={[styles.separator, className].filter(Boolean).join(' ')}
    />
  )
}
