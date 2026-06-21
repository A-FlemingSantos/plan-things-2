import { useEffect, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import KanbanColumnColorField from '../KanbanColumnColorField/KanbanColumnColorField.jsx'
import KanbanColumnStatusPicker from '../KanbanColumnStatusPicker/KanbanColumnStatusPicker.jsx'

const ICON_SIZE = 13
const ICON_STROKE = 1.75

export default function AddColumnComposer({
  addingCol,
  newColTitle,
  setNewColTitle,
  newColColor,
  setNewColColor,
  colorOptions = [],
  newColStatus,
  setNewColStatus,
  statusOptions = [],
  defaultColumnStatus = '',
  setAddingCol,
  addColumn,
  errorMessage,
  styles,
}) {
  const inputRef = useRef(null)
  const [isColorPaletteOpen, setIsColorPaletteOpen] = useState(false)
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false)
  const statusLabelId = 'add-col-status-label'

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
                  <KanbanColumnColorField
                    value={newColColor}
                    onChange={setNewColColor}
                    colorOptions={colorOptions}
                    styles={styles}
                    tabIndex={addingCol ? 0 : -1}
                    onOpenChange={(open) => {
                      setIsColorPaletteOpen(open)
                      if (open) setIsStatusMenuOpen(false)
                    }}
                  />

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
                    <span className={styles.addColOptionLabel} id={statusLabelId}>
                      Status
                    </span>

                    <KanbanColumnStatusPicker
                      value={newColStatus}
                      onChange={setNewColStatus}
                      statusOptions={statusOptions}
                      styles={styles}
                      labelId={statusLabelId}
                      tabIndex={addingCol ? 0 : -1}
                      onOpenChange={setIsStatusMenuOpen}
                      onBeforeOpen={() => setIsColorPaletteOpen(false)}
                    />
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
