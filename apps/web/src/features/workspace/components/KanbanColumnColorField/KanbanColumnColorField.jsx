import { useEffect, useRef, useState } from 'react'
import { CircleOff } from 'lucide-react'
import KanbanColumnColorPalette from '../KanbanColumnColorPalette/KanbanColumnColorPalette.jsx'

const ICON_STROKE = 1.75

export default function KanbanColumnColorField({
  value = '',
  onChange,
  colorOptions,
  styles,
  tabIndex = 0,
  onOpenChange,
  ariaLabel,
}) {
  const fieldRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const selectedColorLabel = colorOptions.find((color) => color.value === value)?.label ?? 'Sem cor'

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
    <div className={styles.addColColorField} ref={fieldRef}>
      <button
        type="button"
        className={styles.addColColorTrigger}
        onClick={() => setOpen((open) => !open)}
        aria-label={ariaLabel ?? `Cor da lista: ${selectedColorLabel}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={tabIndex}
      >
        {value ? (
          <span
            className={styles.addColColorSwatch}
            style={{ background: value }}
            aria-hidden="true"
          />
        ) : (
          <CircleOff
            size={14}
            strokeWidth={ICON_STROKE}
            className={styles.addColColorIconNone}
            aria-hidden="true"
          />
        )}
      </button>

      {isOpen ? (
        <KanbanColumnColorPalette
          value={value}
          onChange={(colorValue) => {
            onChange(colorValue)
            setOpen(false)
          }}
          colorOptions={colorOptions}
          styles={styles}
        />
      ) : null}
    </div>
  )
}
