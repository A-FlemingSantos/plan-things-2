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
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Trash2,
} from 'lucide-react'
import KanbanColumnColorPalette from '../KanbanColumnColorPalette/KanbanColumnColorPalette.jsx'
import { resolveKanbanColumnStatus } from '../../data/kanbanColumnStatusOptions.js'

const ICON_SIZE = 15
const ICON_STROKE = 1.75
const TRAILING_ICON_SIZE = 13
const MENU_GAP = 4
const VIEWPORT_GAP = 8
const MENU_WIDTH = 188
const FLYOUT_WIDTH = 188

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

  const preferredLeft = anchorRect.left
  const left = clamp(
    preferredLeft,
    VIEWPORT_GAP,
    window.innerWidth - MENU_WIDTH - VIEWPORT_GAP,
  )
  const top = clamp(
    anchorRect.bottom,
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
  isCompact = false,
  onToggleCompactView,
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
    const flyoutHeight = activeFlyout === 'color'
      ? 56
      : Math.min(280, statusOptions.length * 36)

    setFlyoutPosition(resolveFlyoutPosition(menuRect, triggerRect, FLYOUT_WIDTH, flyoutHeight))
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
          <span className={styles.colMenuItemIcon} aria-hidden="true">
            <Pencil size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          </span>
          <span className={styles.colMenuItemLabel}>Renomear</span>
        </button>

        <button
          type="button"
          className={styles.colMenuItem}
          onClick={() => {
            onToggleCompactView()
            onClose()
          }}
          role="menuitem"
        >
          <span className={styles.colMenuItemIcon} aria-hidden="true">
            {isCompact ? (
              <PanelLeftOpen size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            ) : (
              <PanelLeftClose size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            )}
          </span>
          <span className={styles.colMenuItemLabel}>
            {isCompact ? 'Expandir lista' : 'Visualização compacta'}
          </span>
        </button>

        <button
          ref={colorTriggerRef}
          type="button"
          className={[
            styles.colMenuItem,
            styles.colMenuItemWithMeta,
            activeFlyout === 'color' ? styles.colMenuItemActive : '',
          ].filter(Boolean).join(' ')}
          onClick={() => toggleFlyout('color')}
          role="menuitem"
          aria-haspopup="menu"
          aria-expanded={activeFlyout === 'color'}
        >
          <span className={styles.colMenuItemIcon} aria-hidden="true">
            {currentColor ? (
              <span
                className={styles.colMenuColorPreview}
                style={{ background: currentColor }}
              />
            ) : (
              <CircleOff size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            )}
          </span>
          <span className={styles.colMenuItemLabel}>Cor</span>
          <span className={styles.colMenuItemMeta}>{selectedColorLabel}</span>
          <ChevronRight
            size={TRAILING_ICON_SIZE}
            strokeWidth={ICON_STROKE}
            className={styles.colMenuItemTrailing}
            aria-hidden="true"
          />
        </button>

        <button
          ref={statusTriggerRef}
          type="button"
          className={[
            styles.colMenuItem,
            styles.colMenuItemWithMeta,
            activeFlyout === 'status' ? styles.colMenuItemActive : '',
          ].filter(Boolean).join(' ')}
          onClick={() => toggleFlyout('status')}
          role="menuitem"
          aria-haspopup="menu"
          aria-expanded={activeFlyout === 'status'}
        >
          <span className={styles.colMenuItemIcon} aria-hidden="true">
            <StatusMenuIcon option={selectedStatus} />
          </span>
          <span className={styles.colMenuItemLabel}>Status</span>
          <span className={styles.colMenuItemMeta}>{selectedStatus.label}</span>
          <ChevronRight
            size={TRAILING_ICON_SIZE}
            strokeWidth={ICON_STROKE}
            className={styles.colMenuItemTrailing}
            aria-hidden="true"
          />
        </button>

        <div className={styles.colMenuDivider} role="separator" />

        <button
          type="button"
          className={`${styles.colMenuItem} ${styles.colMenuItemDanger}`}
          onClick={() => {
            onDelete()
            onClose()
          }}
          role="menuitem"
        >
          <span className={styles.colMenuItemIcon} aria-hidden="true">
            <Trash2 size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          </span>
          <span className={styles.colMenuItemLabel}>Excluir lista</span>
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
                className={[
                  styles.colMenuItem,
                  styles.colMenuItemWithTrailing,
                  isSelected ? styles.colMenuItemActive : '',
                ].filter(Boolean).join(' ')}
                onClick={() => {
                  onChangeStatus(status.id)
                  setActiveFlyout(null)
                }}
                role="menuitemradio"
                aria-checked={isSelected}
              >
                <span className={styles.colMenuItemIcon} aria-hidden="true">
                  <StatusMenuIcon option={status} />
                </span>
                <span className={styles.colMenuItemLabel}>{status.label}</span>
                {isSelected ? (
                  <Check
                    size={TRAILING_ICON_SIZE}
                    strokeWidth={ICON_STROKE}
                    className={styles.colMenuItemTrailing}
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>,
    portalRoot,
  )
}
