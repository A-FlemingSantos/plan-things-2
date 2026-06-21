import { CircleOff } from 'lucide-react'

const ICON_STROKE = 1.75

export default function KanbanColumnColorPalette({
  value = '',
  onChange,
  colorOptions,
  styles,
  variant = 'floating',
  className = '',
  ariaLabel = 'Cores da lista',
}) {
  const paletteClassName = [
    styles.addColColorPalette,
    variant === 'inline' ? styles.addColColorPaletteInline : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={paletteClassName} role="listbox" aria-label={ariaLabel}>
      {colorOptions.map((color) => {
        const isSelected = value === color.value

        return (
          <button
            key={color.id || 'none'}
            type="button"
            className={`${styles.addColColorPaletteOption} ${isSelected ? styles.addColColorPaletteOptionSelected : ''}`}
            onClick={() => onChange(color.value)}
            role="option"
            aria-selected={isSelected}
            aria-label={color.label ?? color.id}
            title={color.label ?? color.id}
          >
            {color.value ? (
              <span
                className={styles.addColColorPaletteDot}
                style={{ background: color.value }}
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
        )
      })}
    </div>
  )
}
