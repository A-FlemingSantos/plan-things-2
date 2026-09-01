import {
  AlignStartHorizontal,
  AlignStartVertical,
  Bug,
  Route,
} from 'lucide-react'
import styles from './BoardViewModePopover.module.css'

const ICON_SIZE = 15
const ICON_STROKE = 1.75

export const BOARD_VIEW_MODES = [
  { id: 'kanban', label: 'Kanban', Icon: AlignStartHorizontal },
  { id: 'timeline', label: 'Timeline', Icon: AlignStartVertical },
  { id: 'bugtrack', label: 'Bugtrack', Icon: Bug },
  { id: 'actions', label: 'Actions', Icon: Route },
]

export default function BoardViewModePopover({
  open,
  menuId,
  viewMode = 'kanban',
  onSelect,
  onClose,
}) {
  if (!open) return null

  return (
    <div
      id={menuId}
      className={styles.popover}
      role="menu"
      aria-label="Modos de visualização do board"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className={styles.section}>
        {BOARD_VIEW_MODES.map(({ id, label, Icon }) => {
          const isActive = viewMode === id

          return (
            <button
              key={id}
              type="button"
              role="menuitemradio"
              aria-checked={isActive}
              className={[styles.item, isActive ? styles.itemActive : ''].filter(Boolean).join(' ')}
              onClick={() => {
                onSelect?.(id)
                onClose?.()
              }}
            >
              <span className={styles.itemIcon} aria-hidden="true">
                <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
              </span>
              <span className={styles.itemLabel}>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
