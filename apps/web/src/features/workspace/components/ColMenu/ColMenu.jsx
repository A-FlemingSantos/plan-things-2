import { useEffect, useRef } from 'react'

export default function ColMenu({
  onRename,
  onDelete,
  onChangeColor,
  onClose,
  colorOptions,
  EditIcon,
  TrashIcon,
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
        <EditIcon /> Renomear
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
        <TrashIcon /> Excluir lista
      </button>
    </div>
  )
}
