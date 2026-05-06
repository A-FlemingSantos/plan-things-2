import { useRef, useState } from 'react'
import ColMenu from '../ColMenu/ColMenu.jsx'
import KanbanCard from '../KanbanCard/KanbanCard.jsx'

export default function KanbanColumn({
  col,
  dragState,
  dropTarget,
  draggedFile,
  fileDropTargetCardId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onFileDragOver,
  onFileDrop,
  onAddCard,
  onDeleteCol,
  onRenameCol,
  onChangeColColor,
  onCardClick,
  labels,
  members,
  colorOptions,
  icons,
  styles,
}) {
  const [addingCard, setAddingCard] = useState(false)
  const [newCardText, setNewCardText] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(col.title)
  const [renameError, setRenameError] = useState(null)
  const [cardError, setCardError] = useState(null)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const addInputRef = useRef(null)
  const renameRef = useRef(null)

  const isColDropTarget = dropTarget?.type === 'col' && dropTarget.colId === col.id
  const getCardHasDraggedFile = (card) => {
    if (!draggedFile?.id) return false
    return (card.attachments ?? []).some((attachment) => (
      (attachment.fileId ?? attachment.id) === draggedFile.id
    ))
  }

  const submitCard = async () => {
    if (!newCardText.trim() || isAddingCard) return

    try {
      setIsAddingCard(true)
      await onAddCard(col.id, newCardText.trim())
      setNewCardText('')
      setAddingCard(false)
      setCardError(null)
    } catch (error) {
      setCardError(error?.message ?? 'Nao foi possivel criar o cartao nesta coluna.')
      setTimeout(() => addInputRef.current?.focus(), 0)
    } finally {
      setIsAddingCard(false)
    }
  }

  const submitRename = async () => {
    if (renameVal.trim()) {
      try {
        await onRenameCol(col.id, renameVal.trim())
        setRenameError(null)
        setRenaming(false)
      } catch (error) {
        setRenameError(error?.message ?? 'Nao foi possivel renomear esta coluna.')
        setTimeout(() => renameRef.current?.focus(), 0)
      }
      return
    }

    setRenameVal(col.title)
    setRenameError(null)
    setRenaming(false)
  }

  return (
    <div
      className={`${styles.column} ${isColDropTarget ? styles.columnDropTarget : ''}`}
      onDragOver={(event) => {
        if (draggedFile) {
          event.preventDefault()
          event.dataTransfer.dropEffect = 'none'
          onFileDragOver?.(null)
          return
        }

        event.preventDefault()
        onDragOver({ type: 'col', colId: col.id })
      }}
      onDrop={(event) => {
        if (draggedFile) {
          event.preventDefault()
          onFileDrop?.(draggedFile, null)
          return
        }

        event.preventDefault()
        onDrop({ type: 'col', colId: col.id })
      }}
    >
      <div className={styles.colHeader}>
        <div className={styles.colHeaderLeft}>
          <span className={styles.colDot} style={{ background: col.color }} />
          {renaming ? (
            <input
              ref={renameRef}
              className={styles.colRenameInput}
              value={renameVal}
              onChange={(event) => setRenameVal(event.target.value)}
              aria-label="Nome da coluna"
              onBlur={submitRename}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitRename()
                if (event.key === 'Escape') {
                  setRenameVal(col.title)
                  setRenameError(null)
                  setRenaming(false)
                }
              }}
              autoFocus
            />
          ) : (
            <span className={styles.colTitle}>{col.title}</span>
          )}
          <span className={styles.colCount}>{col.cards.length}</span>
        </div>

        <div className={styles.colHeaderRight}>
          <button
            type="button"
            className={styles.colActionBtn}
            onClick={() => {
              setAddingCard(true)
              setTimeout(() => addInputRef.current?.focus(), 50)
            }}
            title="Adicionar cartão"
          >
            <icons.Plus />
          </button>

          <div className={styles.colMenuWrap}>
            <button
              type="button"
              className={styles.colActionBtn}
              onClick={() => setShowMenu((value) => !value)}
              title="Opções da coluna"
              aria-expanded={showMenu}
              aria-haspopup="menu"
            >
              <icons.More />
            </button>

            {showMenu ? (
              <ColMenu
                onRename={() => {
                  setRenaming(true)
                  setRenameVal(col.title)
                  setRenameError(null)
                }}
                onDelete={() => onDeleteCol(col.id)}
                onChangeColor={(color) => onChangeColColor(col.id, color)}
                onClose={() => setShowMenu(false)}
                colorOptions={colorOptions}
                EditIcon={icons.Edit}
                TrashIcon={icons.Trash}
                styles={styles}
              />
            ) : null}
          </div>
        </div>
      </div>
      {renaming && renameError ? <p className={styles.inlineComposerError}>{renameError}</p> : null}

      <div className={styles.colCards}>
        {col.cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            colId={col.id}
            isDragging={dragState?.cardId === card.id}
            isDropTarget={dropTarget?.type === 'card' && dropTarget.cardId === card.id}
            draggedFile={draggedFile}
            isFileDropTarget={fileDropTargetCardId === card.id && !getCardHasDraggedFile(card)}
            isFileDropDisabled={Boolean(draggedFile) && getCardHasDraggedFile(card)}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            onFileDragOver={onFileDragOver}
            onFileDrop={onFileDrop}
            onClick={() => onCardClick(card, col.title)}
            labels={labels}
            members={members}
            CommentIcon={icons.Comment}
            ClockIcon={icons.Clock}
            styles={styles}
          />
        ))}

        {addingCard ? (
          <div className={styles.addCardForm}>
            <textarea
              ref={addInputRef}
              className={styles.addCardInput}
              placeholder="Título do cartão..."
              value={newCardText}
              onChange={(event) => setNewCardText(event.target.value)}
              aria-label="Título do cartão"
              rows={2}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  submitCard()
                }
                if (event.key === 'Escape') {
                  setAddingCard(false)
                  setNewCardText('')
                  setCardError(null)
                }
              }}
            />
            {cardError ? <p className={styles.inlineComposerError}>{cardError}</p> : null}

            <div className={styles.addCardActions}>
              <button type="button" className={styles.addCardSubmit} onClick={submitCard} disabled={!newCardText.trim() || isAddingCard}>
                {isAddingCard ? 'Adicionando...' : 'Adicionar cartão'}
              </button>
              <button
                type="button"
                className={styles.addCardCancel}
                onClick={() => {
                  setAddingCard(false)
                  setNewCardText('')
                  setCardError(null)
                }}
                aria-label="Cancelar novo cartão"
              >
                <icons.X />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {!addingCard ? (
        <button
          type="button"
          className={styles.colAddBtn}
          onClick={() => {
            setAddingCard(true)
            setCardError(null)
            setTimeout(() => addInputRef.current?.focus(), 50)
          }}
        >
          <icons.Plus />
          Adicionar cartão
        </button>
      ) : null}
    </div>
  )
}
