import { useEffect, useRef, useState } from 'react'
import {
  Check,
  CircleAlert,
  CircleCheckBig,
  CircleDashed,
  CircleDotDashed,
  CircleOff,
  CircleX,
  Loader,
} from 'lucide-react'

const ICON_STROKE = 1.75
const STATUS_ICON_SIZE = 14

const STATUS_ICONS = {
  CircleOff,
  CircleDashed,
  CircleDotDashed,
  Loader,
  CircleAlert,
  CircleCheckBig,
  CircleX,
}

function ColumnStatusIcon({ option, className, size = STATUS_ICON_SIZE }) {
  const Icon = STATUS_ICONS[option.icon]

  if (!Icon) {
    return null
  }

  return (
    <Icon
      size={size}
      strokeWidth={ICON_STROKE}
      className={className}
      style={{ color: option.color }}
      aria-hidden="true"
    />
  )
}

export default function KanbanColumnStatusPicker({
  value = '',
  onChange,
  statusOptions = [],
  styles,
  labelId,
  tabIndex = 0,
  onOpenChange,
  onBeforeOpen,
}) {
  const fieldRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const safeStatusOptions = Array.isArray(statusOptions) ? statusOptions : []
  const selectedStatus = safeStatusOptions.find((status) => status.id === value)
    ?? safeStatusOptions.find((status) => status.id === '')
    ?? safeStatusOptions[0]
    ?? { id: '', label: 'Sem status', icon: 'CircleOff', color: 'var(--text-3)' }

  const setOpen = (nextOpen) => {
    setIsOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  useEffect(() => {
    if (!isOpen) return undefined

    const handlePointerDown = (event) => {
      if (!fieldRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className={styles.addColStatusField} ref={fieldRef}>
      <button
        type="button"
        className={styles.addColStatusTrigger}
        onClick={() => {
          onBeforeOpen?.()
          setOpen((open) => !open)
        }}
        aria-labelledby={labelId}
        aria-label={`Status da lista: ${selectedStatus.label}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={tabIndex}
      >
        <ColumnStatusIcon option={selectedStatus} />
        <span className={styles.addColStatusTriggerLabel}>{selectedStatus.label}</span>
      </button>

      {isOpen ? (
        <div className={styles.addColStatusMenu} role="listbox" aria-label="Status da lista">
          {safeStatusOptions.map((status) => {
            const isSelected = value === status.id

            return (
              <button
                key={status.id || 'none'}
                type="button"
                className={`${styles.addColStatusMenuOption} ${isSelected ? styles.addColStatusMenuOptionSelected : ''}`}
                onClick={() => {
                  onChange(status.id)
                  setOpen(false)
                }}
                role="option"
                aria-selected={isSelected}
              >
                <ColumnStatusIcon
                  option={status}
                  className={styles.addColStatusMenuOptionIcon}
                />
                <span className={styles.addColStatusMenuOptionLabel}>{status.label}</span>
                {isSelected ? (
                  <Check
                    size={12}
                    strokeWidth={ICON_STROKE}
                    className={styles.addColStatusMenuOptionCheck}
                    aria-hidden="true"
                  />
                ) : (
                  <span className={styles.addColStatusMenuOptionCheckPlaceholder} aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
