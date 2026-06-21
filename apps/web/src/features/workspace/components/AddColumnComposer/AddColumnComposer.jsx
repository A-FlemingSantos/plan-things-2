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
  Plus,
  X,
} from 'lucide-react'

const ICON_SIZE = 13
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

export default function AddColumnComposer({
  addingCol,
  newColTitle,
  setNewColTitle,
  newColColor,
  setNewColColor,
  colorOptions,
  newColStatus,
  setNewColStatus,
  statusOptions,
  defaultColumnStatus,
  setAddingCol,
  addColumn,
  errorMessage,
  styles,
}) {
  const inputRef = useRef(null)
  const colorFieldRef = useRef(null)
  const statusFieldRef = useRef(null)
  const [isColorPaletteOpen, setIsColorPaletteOpen] = useState(false)
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false)

  const selectedColorLabel = colorOptions.find((color) => color.value === newColColor)?.label ?? 'Sem cor'
  const selectedStatus = statusOptions.find((status) => status.id === newColStatus)
    ?? statusOptions.find((status) => status.id === '')
    ?? statusOptions[0]

  const dismissForm = () => {
    setIsColorPaletteOpen(false)
    setIsStatusMenuOpen(false)
    setAddingCol(false)
    setNewColTitle('')
    setNewColColor('')
    setNewColStatus(defaultColumnStatus)
  }

  useEffect(() => {
    if (addingCol) {
      inputRef.current?.focus()
    } else {
      setIsColorPaletteOpen(false)
      setIsStatusMenuOpen(false)
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

  useEffect(() => {
    if (!isStatusMenuOpen) return undefined

    const handlePointerDown = (event) => {
      if (!statusFieldRef.current?.contains(event.target)) {
        setIsStatusMenuOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsStatusMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isStatusMenuOpen])

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

      if (isStatusMenuOpen) {
        event.preventDefault()
        setIsStatusMenuOpen(false)
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

  const handleStatusSelect = (statusId) => {
    setNewColStatus(statusId)
    setIsStatusMenuOpen(false)
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
                      onClick={() => {
                        setIsStatusMenuOpen(false)
                        setIsColorPaletteOpen((open) => !open)
                      }}
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

                    <div className={styles.addColStatusField} ref={statusFieldRef}>
                      <button
                        type="button"
                        className={styles.addColStatusTrigger}
                        onClick={() => {
                          setIsColorPaletteOpen(false)
                          setIsStatusMenuOpen((open) => !open)
                        }}
                        aria-labelledby="add-col-status-label"
                        aria-label={`Status da lista: ${selectedStatus.label}`}
                        aria-expanded={isStatusMenuOpen}
                        aria-haspopup="listbox"
                        tabIndex={addingCol ? 0 : -1}
                      >
                        <ColumnStatusIcon option={selectedStatus} />
                        <span className={styles.addColStatusTriggerLabel}>{selectedStatus.label}</span>
                      </button>

                      {isStatusMenuOpen ? (
                        <div className={styles.addColStatusMenu} role="listbox" aria-label="Status da lista">
                          {statusOptions.map((status) => {
                            const isSelected = newColStatus === status.id

                            return (
                              <button
                                key={status.id || 'none'}
                                type="button"
                                className={`${styles.addColStatusMenuOption} ${isSelected ? styles.addColStatusMenuOptionSelected : ''}`}
                                onClick={() => handleStatusSelect(status.id)}
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
