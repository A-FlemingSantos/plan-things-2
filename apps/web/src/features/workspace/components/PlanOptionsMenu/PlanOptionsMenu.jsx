import { useEffect, useRef } from 'react'
import { AlignStartHorizontal, Image, PencilLine, Trash2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import styles from '../../pages/Workspace/Workspace.module.css'

export const PLAN_OPTIONS_MENU_WIDTH = 176
export const PLAN_OPTIONS_MENU_HEIGHT = 190
export const PLAN_OPTIONS_MENU_GAP = 8
export const PLAN_OPTIONS_MENU_ICON_SIZE = 14
export const PLAN_OPTIONS_MENU_ICON_STROKE = 1.75

export function resolvePlanOptionsMenuPosition(anchorRect) {
  if (!anchorRect) return { left: 0, top: 0 }

  const preferredLeft = anchorRect.right + PLAN_OPTIONS_MENU_GAP
  const maxLeft = window.innerWidth - PLAN_OPTIONS_MENU_WIDTH - PLAN_OPTIONS_MENU_GAP
  const left = Math.max(PLAN_OPTIONS_MENU_GAP, Math.min(preferredLeft, maxLeft))
  const maxTop = window.innerHeight - PLAN_OPTIONS_MENU_HEIGHT - PLAN_OPTIONS_MENU_GAP
  const top = Math.max(PLAN_OPTIONS_MENU_GAP, Math.min(anchorRect.top, maxTop))

  return { left, top }
}

export default function PlanOptionsMenu({ anchorRect, anchorRef, onAction, onClose }) {
  const menuRef = useRef(null)
  const openedAtRef = useRef(0)
  const actions = [
    { id: 'board', label: 'Abrir plano', Icon: AlignStartHorizontal },
    { id: 'rename', label: 'Renomear', Icon: PencilLine },
    { id: 'background', label: 'Alterar background', Icon: Image },
    { id: 'delete', label: 'Excluir', Icon: Trash2, danger: true },
  ]
  const position = resolvePlanOptionsMenuPosition(anchorRect)
  const portalRoot = document.querySelector('[data-app-theme-scope]') ?? document.body

  useEffect(() => {
    openedAtRef.current = Date.now()

    const handlePointerDown = (event) => {
      if (Date.now() - openedAtRef.current < 120) return
      if (menuRef.current?.contains(event.target)) return
      if (anchorRef?.current?.contains(event.target)) return
      onClose?.()
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [anchorRef, onClose])

  const handleMenuAction = (actionId) => {
    onAction?.(actionId)
  }

  return createPortal(
    <div
      ref={menuRef}
      className={styles.planOptionsMenu}
      role="menu"
      style={position}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {actions.map(({ id, label, Icon, danger }) => (
        <button
          key={id}
          type="button"
          className={`${styles.planOptionsMenuItem} ${danger ? styles.planOptionsMenuItemDanger : ''}`}
          role="menuitem"
          onMouseDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
            handleMenuAction(id)
          }}
        >
          <Icon size={PLAN_OPTIONS_MENU_ICON_SIZE} strokeWidth={PLAN_OPTIONS_MENU_ICON_STROKE} />
          <span>{label}</span>
        </button>
      ))}
    </div>,
    portalRoot
  )
}
