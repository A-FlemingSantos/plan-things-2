import { createContext, useContext, useMemo } from 'react'
import styles from './Dock.module.css'

const DockContext = createContext(null)

export function Dock({ children, size = 34, className = '' }) {
  const value = useMemo(() => ({ size }), [size])

  return (
    <DockContext.Provider value={value}>
      <div className={[styles.dock, className].filter(Boolean).join(' ')}>
        {children}
      </div>
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
  const size = dock?.size ?? 34

  const pill = active ? (
    <span className={styles.pill} aria-hidden="true" />
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
