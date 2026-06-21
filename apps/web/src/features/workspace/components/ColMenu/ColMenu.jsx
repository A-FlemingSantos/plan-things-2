import { useEffect, useRef } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import KanbanColumnColorPalette from '../KanbanColumnColorPalette/KanbanColumnColorPalette.jsx'

const ICON_SIZE = 13
const ICON_STROKE = 1.75

export default function ColMenu({
  currentColor = '',
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

      <KanbanColumnColorPalette
        value={currentColor}
        onChange={(color) => {
          onChangeColor(color)
          onClose()
        }}
        colorOptions={colorOptions}
        styles={styles}
        variant="inline"
        className={styles.colMenuColorPalette}
      />

      <div className={styles.colMenuDivider} />

      <button type="button" className={`${styles.colMenuItem} ${styles.colMenuItemDanger}`} onClick={() => { onDelete(); onClose() }} role="menuitem">
        <Trash2 size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" /> Excluir lista
      </button>
    </div>
  )
}
