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
  onToggleCardCompleted,
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
  const isEmptyColumn = col.cards.length === 0 && !addingCard && !isAddingCard
  const hasColumnColor = Boolean(col.color?.trim())

  const isColDropTarget = dropTarget?.type === 'col' && dropTarget.colId === col.id
  const getCardHasDraggedFile = (card) => {
    if (!draggedFile?.id) return false
    return (card.attachments ?? []).some((attachment) => (
      (attachment.fileId ?? attachment.id) === draggedFile.id
    ))
  }

  const submitCard = async () => {
    if (!newCardText.trim() || isAddingCard) return
    const nextCardTitle = newCardText.trim()

    try {
      setIsAddingCard(true)
      setNewCardText('')
      setCardError(null)
      await onAddCard(col.id, nextCardTitle)
      setAddingCard(false)
    } catch (error) {
      setAddingCard(true)
      setNewCardText(nextCardTitle)
      setCardError(error?.message ?? 'Nao foi possivel criar o cartao nesta coluna.')
      setTimeout(() => addInputRef.current?.focus(), 0)
    } finally {
      setIsAddingCard(false)
    }
  }

  const startAddingCard = () => {
    if (isAddingCard) return
    setAddingCard(true)
    setCardError(null)
    setTimeout(() => addInputRef.current?.focus(), 50)
  }

  const cancelAddingCard = () => {
    if (isAddingCard) return
    setAddingCard(false)
    setNewCardText('')
    setCardError(null)
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
      <div
        className={`${styles.colHeader} ${hasColumnColor ? styles.colHeaderColored : ''}`}
        style={hasColumnColor ? { '--column-header-color': col.color } : undefined}
      >
        <div className={styles.colHeaderLeft}>
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
            onClick={startAddingCard}
            disabled={isAddingCard}
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

      <div className={`${styles.colCards} ${isEmptyColumn ? styles.colCardsEmpty : ''}`}>
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
            isConfirmed={Boolean(card.isCompleted)}
            onToggleConfirmed={onToggleCardCompleted}
            labels={labels}
            members={members}
            CheckIcon={icons.Check}
            CommentIcon={icons.Comment}
            ClockIcon={icons.Calendar}
            styles={styles}
          />
        ))}

        {addingCard && !isAddingCard ? (
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
                  cancelAddingCard()
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
                onClick={cancelAddingCard}
                disabled={isAddingCard}
                aria-label="Cancelar novo cartão"
              >
                <icons.X />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {!addingCard && !isAddingCard ? (
        <button
          type="button"
          className={styles.colAddBtn}
          onClick={startAddingCard}
          disabled={isAddingCard}
        >
          <icons.Plus />
          Adicionar cartão
        </button>
      ) : null}
    </div>
  )
}
