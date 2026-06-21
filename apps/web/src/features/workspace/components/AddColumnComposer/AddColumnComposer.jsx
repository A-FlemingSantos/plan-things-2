import { useEffect, useRef } from 'react'
import { Plus, X } from 'lucide-react'

const ICON_SIZE = 13
const ICON_STROKE = 1.75

export default function AddColumnComposer({
  addingCol,
  newColTitle,
  setNewColTitle,
  setAddingCol,
  addColumn,
  errorMessage,
  styles,
}) {
  const inputRef = useRef(null)

  const dismissForm = () => {
    setAddingCol(false)
    setNewColTitle('')
  }

  useEffect(() => {
    if (addingCol) {
      inputRef.current?.focus()
    }
  }, [addingCol])

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
                <input
                  ref={inputRef}
                  className={styles.addColInput}
                  placeholder="Nome da lista"
                  value={newColTitle}
                  onChange={(event) => setNewColTitle(event.target.value)}
                  aria-label="Nome da lista"
                  autoComplete="off"
                  tabIndex={addingCol ? 0 : -1}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') addColumn()
                    if (event.key === 'Escape') dismissForm()
                  }}
                />
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
