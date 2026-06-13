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
  return (
    <div className={styles.addColWrap}>
      {addingCol ? (
        <div className={styles.addColForm}>
          <input
            className={styles.addColInput}
            placeholder="Nome da lista..."
            value={newColTitle}
            onChange={(event) => setNewColTitle(event.target.value)}
            aria-label="Nome da lista"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') addColumn()
              if (event.key === 'Escape') {
                setAddingCol(false)
                setNewColTitle('')
              }
            }}
          />
          {errorMessage && <p className={styles.inlineComposerError}>{errorMessage}</p>}
          <div className={styles.addColActions}>
            <button type="button" className={styles.addColSubmit} onClick={addColumn} disabled={!newColTitle.trim()}>
              Adicionar lista
            </button>
            <button type="button" className={styles.addColCancel} onClick={() => { setAddingCol(false); setNewColTitle('') }} aria-label="Cancelar nova lista">
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
