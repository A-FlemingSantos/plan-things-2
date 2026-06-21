import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  CircleDashed,
  CircleDotDashed,
  CircleOff,
  CircleX,
  Loader,
  Pencil,
  Trash2,
} from 'lucide-react'
import KanbanColumnColorPalette from '../KanbanColumnColorPalette/KanbanColumnColorPalette.jsx'
import { resolveKanbanColumnStatus } from '../../data/kanbanColumnStatusOptions.js'

const ICON_SIZE = 13
const ICON_STROKE = 1.75
const MENU_GAP = 4
const VIEWPORT_GAP = 8
const MENU_WIDTH = 188
const COLOR_FLYOUT_WIDTH = 196
const STATUS_FLYOUT_WIDTH = 200

const STATUS_ICONS = {
  CircleOff,
  CircleDashed,
  CircleDotDashed,
  Loader,
  CircleAlert,
  CircleCheckBig,
  CircleX,
}

function StatusMenuIcon({ option }) {
  const Icon = STATUS_ICONS[option.icon]
  if (!Icon) return null

  return (
    <Icon
      size={ICON_SIZE}
      strokeWidth={ICON_STROKE}
      style={{ color: option.color }}
      aria-hidden="true"
    />
  )
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max))
}

function resolveMenuPosition(anchorRect, menuHeight = 160) {
  if (!anchorRect) {
    return { top: VIEWPORT_GAP, left: VIEWPORT_GAP }
  }

  const left = clamp(
    anchorRect.right - MENU_WIDTH,
    VIEWPORT_GAP,
    window.innerWidth - MENU_WIDTH - VIEWPORT_GAP,
  )
  const top = clamp(
    anchorRect.bottom + MENU_GAP,
    VIEWPORT_GAP,
    window.innerHeight - menuHeight - VIEWPORT_GAP,
  )

  return { top, left }
}

function resolveFlyoutPosition(menuRect, triggerRect, flyoutWidth, flyoutHeight) {
  if (!menuRect || !triggerRect) {
    return null
  }

  const preferredLeft = menuRect.right + MENU_GAP
  const fallbackLeft = menuRect.left - MENU_GAP - flyoutWidth
  const canOpenRight = preferredLeft + flyoutWidth <= window.innerWidth - VIEWPORT_GAP
  const left = canOpenRight
    ? preferredLeft
    : clamp(fallbackLeft, VIEWPORT_GAP, window.innerWidth - flyoutWidth - VIEWPORT_GAP)

  const top = clamp(
    triggerRect.top,
    VIEWPORT_GAP,
    window.innerHeight - flyoutHeight - VIEWPORT_GAP,
  )

  return { top, left }
}

export default function ColMenu({
  anchorRef,
  currentColor = '',
  currentStatus = '',
  onRename,
  onDelete,
  onChangeColor,
  onChangeStatus,
  onClose,
  colorOptions,
  statusOptions,
  styles,
}) {
  const containerRef = useRef(null)
  const menuRef = useRef(null)
  const colorTriggerRef = useRef(null)
  const statusTriggerRef = useRef(null)
  const [activeFlyout, setActiveFlyout] = useState(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [flyoutPosition, setFlyoutPosition] = useState(null)
  const selectedStatus = resolveKanbanColumnStatus(currentStatus)
  const selectedColorLabel = colorOptions.find((color) => color.value === currentColor)?.label ?? 'Sem cor'
  const portalRoot = typeof document !== 'undefined'
    ? (document.querySelector('[data-app-theme-scope]') ?? document.body)
    : null

  const updateMenuPosition = () => {
    const anchorRect = anchorRef?.current?.getBoundingClientRect()
    const menuHeight = menuRef.current?.getBoundingClientRect().height ?? 160
    setMenuPosition(resolveMenuPosition(anchorRect, menuHeight))
  }

  const updateFlyoutPosition = () => {
    if (!activeFlyout) {
      setFlyoutPosition(null)
      return
    }

    const menuRect = menuRef.current?.getBoundingClientRect()
    const triggerRect = activeFlyout === 'color'
      ? colorTriggerRef.current?.getBoundingClientRect()
      : statusTriggerRef.current?.getBoundingClientRect()
    const flyoutWidth = activeFlyout === 'color' ? COLOR_FLYOUT_WIDTH : STATUS_FLYOUT_WIDTH
    const flyoutHeight = activeFlyout === 'color' ? 72 : Math.min(280, statusOptions.length * 34 + 12)

    setFlyoutPosition(resolveFlyoutPosition(menuRect, triggerRect, flyoutWidth, flyoutHeight))
  }

  useLayoutEffect(() => {
    updateMenuPosition()
  }, [])

  useLayoutEffect(() => {
    updateFlyoutPosition()
  }, [activeFlyout, statusOptions.length])

  useEffect(() => {
    const handleReposition = () => {
      updateMenuPosition()
      updateFlyoutPosition()
    }

    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)

    return () => {
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [activeFlyout, statusOptions.length])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (containerRef.current?.contains(event.target)) return
      if (anchorRef?.current?.contains(event.target)) return
      onClose()
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (activeFlyout) {
          event.preventDefault()
          setActiveFlyout(null)
          return
        }

        onClose()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeFlyout, anchorRef, onClose])

  const toggleFlyout = (flyout) => {
    setActiveFlyout((current) => (current === flyout ? null : flyout))
  }

  if (!portalRoot) {
    return null
  }

  return createPortal(
    <div ref={containerRef} className={styles.colMenuPortal}>
      <div
        ref={menuRef}
        className={styles.colMenu}
        style={menuPosition}
        role="menu"
        aria-label="Opções da lista"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.colMenuItem}
          onClick={() => {
            onRename()
            onClose()
          }}
          role="menuitem"
        >
          <Pencil size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
          Renomear
        </button>

        <button
          ref={colorTriggerRef}
          type="button"
          className={`${styles.colMenuItem} ${styles.colMenuItemHasSubmenu} ${activeFlyout === 'color' ? styles.colMenuItemActive : ''}`}
          onClick={() => toggleFlyout('color')}
          role="menuitem"
          aria-haspopup="menu"
          aria-expanded={activeFlyout === 'color'}
        >
          <span className={styles.colMenuItemLeading}>
            {currentColor ? (
              <span
                className={styles.colMenuColorPreview}
                style={{ background: currentColor }}
                aria-hidden="true"
              />
            ) : (
              <CircleOff size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
            )}
            <span className={styles.colMenuItemLabel}>Cor</span>
          </span>
          <span className={styles.colMenuItemMeta}>{selectedColorLabel}</span>
          <ChevronRight size={12} strokeWidth={ICON_STROKE} className={styles.colMenuItemChevron} aria-hidden="true" />
        </button>

        <button
          ref={statusTriggerRef}
          type="button"
          className={`${styles.colMenuItem} ${styles.colMenuItemHasSubmenu} ${activeFlyout === 'status' ? styles.colMenuItemActive : ''}`}
          onClick={() => toggleFlyout('status')}
          role="menuitem"
          aria-haspopup="menu"
          aria-expanded={activeFlyout === 'status'}
        >
          <span className={styles.colMenuItemLeading}>
            <StatusMenuIcon option={selectedStatus} />
            <span className={styles.colMenuItemLabel}>Status</span>
          </span>
          <span className={styles.colMenuItemMeta}>{selectedStatus.label}</span>
          <ChevronRight size={12} strokeWidth={ICON_STROKE} className={styles.colMenuItemChevron} aria-hidden="true" />
        </button>

        <div className={styles.colMenuDivider} />

        <button
          type="button"
          className={`${styles.colMenuItem} ${styles.colMenuItemDanger}`}
          onClick={() => {
            onDelete()
            onClose()
          }}
          role="menuitem"
        >
          <Trash2 size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
          Excluir lista
        </button>
      </div>

      {activeFlyout === 'color' && flyoutPosition ? (
        <div
          className={`${styles.colMenuFlyout} ${styles.colMenuFlyoutColors}`}
          style={flyoutPosition}
          role="menu"
          aria-label="Cor da lista"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <KanbanColumnColorPalette
            value={currentColor}
            onChange={(color) => {
              onChangeColor(color)
              setActiveFlyout(null)
            }}
            colorOptions={colorOptions}
            styles={styles}
            variant="inline"
            className={styles.colMenuFlyoutPalette}
            ariaLabel="Cor da lista"
          />
        </div>
      ) : null}

      {activeFlyout === 'status' && flyoutPosition ? (
        <div
          className={`${styles.colMenuFlyout} ${styles.colMenuFlyoutStatus}`}
          style={flyoutPosition}
          role="menu"
          aria-label="Status da lista"
          onMouseDown={(event) => event.stopPropagation()}
        >
          {statusOptions.map((status) => {
            const isSelected = currentStatus === status.id

            return (
              <button
                key={status.id || 'none'}
                type="button"
                className={`${styles.colMenuItem} ${isSelected ? styles.colMenuItemSelected : ''}`}
                onClick={() => {
                  onChangeStatus(status.id)
                  setActiveFlyout(null)
                }}
                role="menuitemradio"
                aria-checked={isSelected}
              >
                <StatusMenuIcon option={status} />
                <span className={styles.colMenuItemLabel}>{status.label}</span>
                {isSelected ? (
                  <Check
                    size={12}
                    strokeWidth={ICON_STROKE}
                    className={styles.colMenuItemCheck}
                    aria-hidden="true"
                  />
                ) : (
                  <span className={styles.colMenuItemCheckPlaceholder} aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>,
    portalRoot,
  )
}
