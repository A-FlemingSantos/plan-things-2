import { memo, useRef, useState } from 'react'
import { Ellipsis, Plus, X } from 'lucide-react'
import ColMenu from '../ColMenu/ColMenu.jsx'
import KanbanCard from '../KanbanCard/KanbanCard.jsx'

const ICON_SIZE = 13
const ICON_SIZE_MD = 14
const ICON_STROKE = 1.75

function KanbanColumn({
  col,
  dragState,
  dropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onAddCard,
  onDeleteCol,
  onRenameCol,
  onChangeColColor,
  onCardClick,
  onToggleCardCompleted,
  labels,
  members,
  colorOptions,
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
    const nextTitle = renameVal.trim()

    if (nextTitle) {
      setRenameError(null)
      setRenaming(false)

      try {
        await onRenameCol(col.id, nextTitle)
      } catch (error) {
        setRenameVal(nextTitle)
        setRenameError(error?.message ?? 'Nao foi possivel renomear esta coluna.')
        setRenaming(true)
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
      className={`${styles.column} ${isColDropTarget ? styles.columnDropTarget : ''} ${hasColumnColor ? styles.columnColored : ''}`}
      style={hasColumnColor ? { '--column-color': col.color } : undefined}
      onDragOver={(event) => {
        event.preventDefault()
        onDragOver({ type: 'col', colId: col.id })
      }}
      onDrop={(event) => {
        event.preventDefault()
        onDrop({ type: 'col', colId: col.id })
      }}
    >
      <div className={styles.colHeader}>
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
          <div className={styles.colMenuWrap}>
            <button
              type="button"
              className={styles.colActionBtn}
              onClick={() => setShowMenu((value) => !value)}
              title="Opções da coluna"
              aria-expanded={showMenu}
              aria-haspopup="menu"
            >
              <Ellipsis size={ICON_SIZE_MD} strokeWidth={ICON_STROKE} aria-hidden="true" />
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
                styles={styles}
              />
            ) : null}
          </div>

          <button
            type="button"
            className={styles.colActionBtn}
            onClick={startAddingCard}
            disabled={isAddingCard}
            title="Adicionar cartão"
          >
            <Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </button>
        </div>
      </div>
      {renaming && renameError ? <p className={styles.inlineComposerError}>{renameError}</p> : null}

      <div className={`${styles.colCards} ${isEmptyColumn ? styles.colCardsEmpty : ''}`}>
        {col.cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            colId={col.id}
            colTitle={col.title}
            isDragging={dragState?.cardId === card.id}
            isDropTarget={dropTarget?.type === 'card' && dropTarget.cardId === card.id}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            onClick={onCardClick}
            isConfirmed={Boolean(card.isCompleted)}
            onToggleConfirmed={onToggleCardCompleted}
            labels={labels}
            members={members}
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
                <X size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
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
          <Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
          Adicionar cartão
        </button>
      ) : null}
    </div>
  )
}

function areKanbanColumnPropsEqual(prevProps, nextProps) {
  return prevProps.col === nextProps.col
    && prevProps.dragState === nextProps.dragState
    && prevProps.dropTarget === nextProps.dropTarget
    && prevProps.labels === nextProps.labels
    && prevProps.members === nextProps.members
    && prevProps.colorOptions === nextProps.colorOptions
    && prevProps.styles === nextProps.styles
}

export default memo(KanbanColumn, areKanbanColumnPropsEqual)
