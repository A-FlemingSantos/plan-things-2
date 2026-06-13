import { useEffect, useRef } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

const ICON_SIZE = 13
const ICON_STROKE = 1.75

export default function ColMenu({
  onRename,
  onDelete,
  onChangeColor,
  onClose,
  colorOptions,
  styles,
}) {
  const ref = useRef(null)

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!ref.current?.contains(event.target)) {
        onClose()
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div className={styles.colMenu} ref={ref} role="menu">
      <button type="button" className={styles.colMenuItem} onClick={() => { onRename(); onClose() }} role="menuitem">
        <Pencil size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /> Renomear
      </button>

      {colorOptions.map((color) => (
        <button
          type="button"
          key={color.id}
          className={styles.colMenuColorOpt}
          onClick={() => { onChangeColor(color.value); onClose() }}
          aria-label={`Definir cor da coluna: ${color.label ?? color.id}`}
          title={color.label ?? color.id}
        >
          <span
            className={`${styles.colMenuColorDot} ${color.value ? '' : styles.colMenuColorDotNone}`}
            style={color.value ? { background: color.value } : undefined}
          />
        </button>
      ))}

      <div className={styles.colMenuDivider} />

      <button type="button" className={`${styles.colMenuItem} ${styles.colMenuItemDanger}`} onClick={() => { onDelete(); onClose() }} role="menuitem">
        <Trash2 size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /> Excluir lista
      </button>
    </div>
  )
}
