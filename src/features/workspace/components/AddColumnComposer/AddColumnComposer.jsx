export default function AddColumnComposer({
  addingCol,
  newColTitle,
  setNewColTitle,
  setAddingCol,
  addColumn,
  PlusIcon,
  XIcon,
  styles,
}) {
  return (
    <div className={styles.addColWrap}>
      {addingCol ? (
        <div className={styles.addColForm}>
          <input
            className={styles.addColInput}
            placeholder="List name…"
            value={newColTitle}
            onChange={(event) => setNewColTitle(event.target.value)}
            aria-label="List name"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') addColumn()
              if (event.key === 'Escape') {
                setAddingCol(false)
                setNewColTitle('')
              }
            }}
          />
          <div className={styles.addColActions}>
            <button type="button" className={styles.addColSubmit} onClick={addColumn} disabled={!newColTitle.trim()}>
              Add list
            </button>
            <button type="button" className={styles.addColCancel} onClick={() => { setAddingCol(false); setNewColTitle('') }} aria-label="Cancel new list">
              <XIcon />
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.addColBtn} onClick={() => setAddingCol(true)}>
          <PlusIcon />
          Add list
        </button>
      )}
    </div>
  )
}
