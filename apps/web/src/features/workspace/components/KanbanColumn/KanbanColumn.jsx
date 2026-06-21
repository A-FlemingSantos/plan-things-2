import { memo, useRef, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  CircleAlert,
  CircleCheckBig,
  CircleDashed,
  CircleDotDashed,
  CircleX,
  Ellipsis,
  Loader,
  Plus,
} from 'lucide-react'
import AddCardComposer from '../AddCardComposer/AddCardComposer.jsx'
import ColMenu from '../ColMenu/ColMenu.jsx'
import KanbanCard from '../KanbanCard/KanbanCard.jsx'
import { resolveKanbanColumnStatus } from '../../data/kanbanColumnStatusOptions.js'

const ICON_SIZE = 13
const ICON_SIZE_MD = 14
const ICON_STROKE = 1.75

const STATUS_ICONS = {
  CircleDashed,
  CircleDotDashed,
  Loader,
  CircleAlert,
  CircleCheckBig,
  CircleX,
}

function ColumnStatusIcon({ option, className }) {
  const Icon = STATUS_ICONS[option.icon]

  if (!Icon) {
    return null
  }

  return (
    <Icon
      size={ICON_SIZE_MD}
      strokeWidth={ICON_STROKE}
      className={className}
      style={{ color: option.color }}
      aria-hidden="true"
    />
  )
}

function KanbanColumn({
  col,
  isDropTarget = false,
  onAddCard,
  onDeleteCol,
  onRenameCol,
  onChangeColColor,
  onChangeColStatus,
  statusOptions,
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
  const renameRef = useRef(null)
  const menuAnchorRef = useRef(null)
  const isEmptyColumn = col.cards.length === 0 && !addingCard && !isAddingCard
  const hasColumnColor = Boolean(col.color?.trim())
  const cardIds = col.cards.map((card) => card.id)

  const { setNodeRef: setColumnDropRef } = useDroppable({
    id: col.id,
    data: {
      type: 'column',
      columnId: col.id,
    },
  })

  const columnStatus = resolveKanbanColumnStatus(col.status)
  const showColumnStatusIcon = Boolean(col.status)

  const submitCard = async () => {
    if (!newCardText.trim() || isAddingCard) return
    const nextCardTitle = newCardText.trim()

    try {
      setIsAddingCard(true)
      setAddingCard(false)
      setNewCardText('')
      setCardError(null)
      await onAddCard(col.id, nextCardTitle)
      setAddingCard(false)
    } catch (error) {
      setAddingCard(true)
      setNewCardText(nextCardTitle)
      setCardError(error?.message ?? 'Nao foi possivel criar o cartao nesta coluna.')
    } finally {
      setIsAddingCard(false)
    }
  }

  const startAddingCard = () => {
    if (isAddingCard) return
    setAddingCard(true)
    setCardError(null)
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
      ref={setColumnDropRef}
      className={`${styles.column} ${isDropTarget ? styles.columnDropTarget : ''} ${hasColumnColor ? styles.columnColored : ''}`}
      style={hasColumnColor ? { '--column-color': col.color } : undefined}
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
            <>
              {showColumnStatusIcon ? (
                <ColumnStatusIcon option={columnStatus} className={styles.colStatusIcon} />
              ) : null}
              <span className={styles.colTitle}>{col.title}</span>
            </>
          )}
          <span className={styles.colCount}>{col.cards.length}</span>
        </div>

        <div className={styles.colHeaderRight}>
          <div className={styles.colMenuWrap}>
            <button
              ref={menuAnchorRef}
              type="button"
              className={styles.colActionBtn}
              onClick={() => setShowMenu((value) => !value)}
              title="Opções da lista"
              aria-expanded={showMenu}
              aria-haspopup="menu"
            >
              <Ellipsis size={ICON_SIZE_MD} strokeWidth={ICON_STROKE} aria-hidden="true" />
            </button>

            {showMenu ? (
              <ColMenu
                anchorRef={menuAnchorRef}
                currentColor={col.color ?? ''}
                currentStatus={col.status ?? ''}
                onRename={() => {
                  setRenaming(true)
                  setRenameVal(col.title)
                  setRenameError(null)
                }}
                onDelete={() => onDeleteCol(col.id)}
                onChangeColor={(color) => onChangeColColor(col.id, color)}
                onChangeStatus={(status) => onChangeColStatus(col.id, status)}
                onClose={() => setShowMenu(false)}
                colorOptions={colorOptions}
                statusOptions={statusOptions}
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

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className={`${styles.colCards} ${isEmptyColumn ? styles.colCardsEmpty : ''}`}>
          {col.cards.map((card) => (
            <KanbanCard
              key={card.uiKey ?? card.id}
              card={card}
              colId={col.id}
              colTitle={col.title}
              onClick={onCardClick}
              isConfirmed={Boolean(card.isCompleted)}
              onToggleConfirmed={onToggleCardCompleted}
              labels={labels}
              members={members}
              styles={styles}
            />
          ))}
        </div>
      </SortableContext>

      <AddCardComposer
        addingCard={addingCard}
        setAddingCard={setAddingCard}
        newCardText={newCardText}
        setNewCardText={setNewCardText}
        onSubmit={submitCard}
        onDismiss={cancelAddingCard}
        errorMessage={cardError}
        isSubmitting={isAddingCard}
        styles={styles}
      />
    </div>
  )
}

function areKanbanColumnPropsEqual(prevProps, nextProps) {
  return prevProps.col === nextProps.col
    && prevProps.isDropTarget === nextProps.isDropTarget
    && prevProps.labels === nextProps.labels
    && prevProps.members === nextProps.members
    && prevProps.colorOptions === nextProps.colorOptions
    && prevProps.statusOptions === nextProps.statusOptions
    && prevProps.styles === nextProps.styles
}

export default memo(KanbanColumn, areKanbanColumnPropsEqual)
