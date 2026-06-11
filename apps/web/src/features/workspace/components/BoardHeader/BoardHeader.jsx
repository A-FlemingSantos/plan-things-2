import { useEffect, useId, useRef, useState } from 'react'
import {
  AlignStartHorizontal,
  AlignStartVertical,
  Blocks,
  Bug,
  ChevronDown,
  EllipsisVertical,
  Funnel,
  Globe,
  Route,
} from 'lucide-react'
import styles from './BoardHeader.module.css'

const ICON_SIZE = 15
const ICON_STROKE = 1.75

export const BOARD_VIEW_MODES = [
  { id: 'kanban', label: 'Kanban', Icon: AlignStartHorizontal },
  { id: 'timeline', label: 'Timeline', Icon: AlignStartVertical },
  { id: 'bugtrack', label: 'Bugtrack', Icon: Bug },
  { id: 'actions', label: 'Actions', Icon: Route },
]

const ACTION_ITEMS = [
  { id: 'blocks', Icon: Blocks, label: 'Blocos' },
  { id: 'globe', Icon: Globe, label: 'Globo' },
  { id: 'funnel', Icon: Funnel, label: 'Filtros' },
  { id: 'more', Icon: EllipsisVertical, label: 'Mais opções' },
]

export default function BoardHeader({
  planName = 'Plano',
  viewMode = 'kanban',
  onViewModeChange,
}) {
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false)
  const viewMenuId = useId()
  const viewMenuWrapRef = useRef(null)

  useEffect(() => {
    if (!isViewMenuOpen) return undefined

    const handlePointerDown = (event) => {
      if (viewMenuWrapRef.current?.contains(event.target)) return
      setIsViewMenuOpen(false)
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsViewMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isViewMenuOpen])

  const activeViewMode = BOARD_VIEW_MODES.find((mode) => mode.id === viewMode) ?? BOARD_VIEW_MODES[0]
  const ActiveViewIcon = activeViewMode.Icon

  const handleSelectViewMode = (nextViewMode) => {
    onViewModeChange?.(nextViewMode)
    setIsViewMenuOpen(false)
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div ref={viewMenuWrapRef} className={styles.viewMenuWrap}>
          <button
            type="button"
            className={`${styles.viewIconButton} ${isViewMenuOpen ? styles.viewIconButtonOpen : ''}`}
            aria-haspopup="menu"
            aria-controls={viewMenuId}
            aria-expanded={isViewMenuOpen}
            aria-label={`Alterar visualização (${activeViewMode.label})`}
            onClick={() => setIsViewMenuOpen((open) => !open)}
          >
            <span className={styles.viewIconButtonIcon} aria-hidden="true">
              <ActiveViewIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            </span>
            <span className={styles.viewIconButtonMeta}>
              <span className={styles.viewIconButtonLabel}>{activeViewMode.label}</span>
              <span className={styles.viewIconButtonChevron} aria-hidden="true">
                <ChevronDown size={12} strokeWidth={ICON_STROKE} />
              </span>
            </span>
          </button>

          {isViewMenuOpen ? (
            <div
              id={viewMenuId}
              className={styles.viewMenu}
              role="menu"
              aria-label="Modos de visualização do board"
            >
              {BOARD_VIEW_MODES.map(({ id, label, Icon }, index) => {
                const isActive = viewMode === id

                return (
                  <button
                    key={id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    className={`${styles.viewMenuItem} ${isActive ? styles.viewMenuItemActive : ''}`}
                    style={{ animationDelay: `${index * 45}ms` }}
                    onClick={() => handleSelectViewMode(id)}
                  >
                    <span className={styles.viewMenuItemIcon} aria-hidden="true">
                      <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                    </span>
                    <span className={styles.viewMenuItemLabel}>{label}</span>
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>

        <span className={styles.titleDivider} aria-hidden="true" />
        <h1 className={styles.planName}>{planName}</h1>
      </div>

      <div className={styles.actions}>
        {ACTION_ITEMS.map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            className={styles.iconButton}
            aria-label={label}
          >
            <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          </button>
        ))}
      </div>
    </header>
  )
}
