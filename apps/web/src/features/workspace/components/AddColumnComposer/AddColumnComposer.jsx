import { useEffect, useRef, useState } from 'react'
import { CircleOff, Plus, X } from 'lucide-react'

const ICON_SIZE = 13
const ICON_STROKE = 1.75

export default function AddColumnComposer({
  addingCol,
  newColTitle,
  setNewColTitle,
  newColColor,
  setNewColColor,
  colorOptions,
  setAddingCol,
  addColumn,
  errorMessage,
  styles,
}) {
  const inputRef = useRef(null)
  const colorFieldRef = useRef(null)
  const [isColorPaletteOpen, setIsColorPaletteOpen] = useState(false)

  const selectedColorLabel = colorOptions.find((color) => color.value === newColColor)?.label ?? 'Sem cor'

  const dismissForm = () => {
    setIsColorPaletteOpen(false)
    setAddingCol(false)
    setNewColTitle('')
    setNewColColor('')
  }

  useEffect(() => {
    if (addingCol) {
      inputRef.current?.focus()
    } else {
      setIsColorPaletteOpen(false)
    }
  }, [addingCol])

  useEffect(() => {
    if (!isColorPaletteOpen) return undefined

    const handlePointerDown = (event) => {
      if (!colorFieldRef.current?.contains(event.target)) {
        setIsColorPaletteOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsColorPaletteOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isColorPaletteOpen])

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      addColumn()
      return
    }

    if (event.key === 'Escape') {
      if (isColorPaletteOpen) {
        event.preventDefault()
        setIsColorPaletteOpen(false)
        return
      }
      dismissForm()
    }
  }

  const handleColorSelect = (colorValue) => {
    setNewColColor(colorValue)
    setIsColorPaletteOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className={styles.addColWrap}>
      <div className={`${styles.addColShell} ${addingCol ? styles.addColShellOpen : ''}`}>
        <button
          type="button"
          className={styles.addColTrigger}
          onClick={() => setAddingCol(true)}
          tabIndex={addingCol ? -1 : 0}
          aria-hidden={addingCol}
        >
          <Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
          Adicionar lista
        </button>

        <div className={styles.addColExpand} aria-hidden={!addingCol}>
          <div className={styles.addColExpandInner}>
            <div className={styles.addColForm}>
              <div className={styles.addColFormBody}>
                <div className={styles.addColTitleRow}>
                  <div className={styles.addColColorField} ref={colorFieldRef}>
                    <button
                      type="button"
                      className={styles.addColColorTrigger}
                      onClick={() => setIsColorPaletteOpen((open) => !open)}
                      aria-label={`Cor da lista: ${selectedColorLabel}`}
                      aria-expanded={isColorPaletteOpen}
                      aria-haspopup="listbox"
                      tabIndex={addingCol ? 0 : -1}
                    >
                      {newColColor ? (
                        <span
                          className={styles.addColColorSwatch}
                          style={{ background: newColColor }}
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

                    {isColorPaletteOpen ? (
                      <div className={styles.addColColorPalette} role="listbox" aria-label="Cores da lista">
                        {colorOptions.map((color) => {
                          const isSelected = newColColor === color.value

                          return (
                            <button
                              key={color.id}
                              type="button"
                              className={`${styles.addColColorPaletteOption} ${isSelected ? styles.addColColorPaletteOptionSelected : ''}`}
                              onClick={() => handleColorSelect(color.value)}
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
                    ) : null}
                  </div>

                  <input
                    ref={inputRef}
                    className={styles.addColInput}
                    placeholder="Nome da lista"
                    value={newColTitle}
                    onChange={(event) => setNewColTitle(event.target.value)}
                    aria-label="Nome da lista"
                    autoComplete="off"
                    tabIndex={addingCol ? 0 : -1}
                    onKeyDown={handleInputKeyDown}
                  />
                </div>

                <div className={styles.addColOptions}>
                  <div className={styles.addColOptionRow}>
                    <span className={styles.addColOptionLabel} id="add-col-status-label">
                      Status
                    </span>
                    <span
                      className={styles.addColOptionPlaceholder}
                      aria-labelledby="add-col-status-label"
                    >
                      Em breve
                    </span>
                  </div>
                </div>

                {errorMessage ? <p className={styles.addColError}>{errorMessage}</p> : null}
              </div>

              <div className={styles.addColFormFooter}>
                <button
                  type="button"
                  className={styles.addColSubmit}
                  onClick={addColumn}
                  disabled={!newColTitle.trim()}
                  tabIndex={addingCol ? 0 : -1}
                >
                  Adicionar lista
                </button>
                <button
                  type="button"
                  className={styles.addColDismiss}
                  onClick={dismissForm}
                  aria-label="Cancelar nova lista"
                  tabIndex={addingCol ? 0 : -1}
                >
                  <X size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
