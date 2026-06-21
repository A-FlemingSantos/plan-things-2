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
  const dismissForm = () => {
    setAddingCol(false)
    setNewColTitle('')
  }

  return (
    <div className={styles.addColWrap}>
      {addingCol ? (
        <div className={styles.addColForm}>
          <div className={styles.addColFormBody}>
            <input
              className={styles.addColInput}
              placeholder="Nome da lista"
              value={newColTitle}
              onChange={(event) => setNewColTitle(event.target.value)}
              aria-label="Nome da lista"
              autoComplete="off"
              autoFocus
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
            >
              Adicionar lista
            </button>
            <button
              type="button"
              className={styles.addColDismiss}
              onClick={dismissForm}
              aria-label="Cancelar nova lista"
            >
              <X size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.addColBtn} onClick={() => setAddingCol(true)}>
          <Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
          Adicionar lista
        </button>
      )}
    </div>
  )
}
