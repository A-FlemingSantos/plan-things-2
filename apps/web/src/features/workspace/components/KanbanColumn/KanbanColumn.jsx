import { memo, useRef, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
import KanbanCard, { KanbanCardView } from '../KanbanCard/KanbanCard.jsx'
import { resolveKanbanColumnStatus } from '../../data/kanbanColumnStatusOptions.js'
import { columnCardStackDropId } from '../../hooks/boardDnDUtils.js'

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

export function KanbanColumnView({
  col,
  isDropTarget = false,
  isDragging = false,
  isDragOverlay = false,
  isCompact = false,
  onAddCard,
  onDeleteCol,
  onRenameCol,
  onChangeColColor,
  onChangeColStatus,
  onToggleCompactView,
  statusOptions,
  onCardClick,
  onToggleCardCompleted,
  labels,
  members,
  colorOptions,
  styles,
  setNodeRef,
  style,
  dragHandleAttributes = {},
  dragHandleListeners = {},
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

  const { setNodeRef: setCardStackDropRef } = useDroppable({
    id: columnCardStackDropId(col.id),
    data: {
      type: 'card-stack',
      columnId: col.id,
    },
    disabled: isDragOverlay,
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
    if (isAddingCard || isDragOverlay) return
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
      ref={setNodeRef}
      className={`
        ${styles.column}
        ${isDropTarget ? styles.columnDropTarget : ''}
        ${hasColumnColor ? styles.columnColored : ''}
        ${isDragging ? styles.columnDragging : ''}
        ${isDragOverlay ? styles.columnDragOverlay : ''}
        ${isCompact ? styles.columnCompact : ''}
      `}
      data-column-id={col.id}
      style={{
        ...(hasColumnColor ? { '--column-color': col.color } : {}),
        ...style,
      }}
    >
      <div
        className={`
          ${styles.colHeader}
          ${!isDragOverlay && !renaming ? styles.colHeaderDraggable : ''}
        `}
        title={!isDragOverlay && !renaming ? 'Arrastar lista' : undefined}
        aria-label={!isDragOverlay && !renaming ? `Arrastar lista ${col.title}` : undefined}
        {...(!isDragOverlay && !renaming ? dragHandleAttributes : {})}
        {...(!isDragOverlay && !renaming ? dragHandleListeners : {})}
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
            <>
              {showColumnStatusIcon ? (
                <ColumnStatusIcon option={columnStatus} className={styles.colStatusIcon} />
              ) : null}
              <span className={styles.colTitle}>{col.title}</span>
            </>
          )}
          <span className={styles.colCount}>{col.cards.length}</span>
        </div>

        {!isDragOverlay ? (
          <div
            className={styles.colHeaderRight}
            onPointerDown={(event) => event.stopPropagation()}
          >
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
                  isCompact={isCompact}
                  onToggleCompactView={() => {
                    onToggleCompactView?.(col.id)
                    setAddingCard(false)
                    setCardError(null)
                  }}
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
              onClick={() => {
                if (isCompact) {
                  onToggleCompactView?.(col.id)
                }
                startAddingCard()
              }}
              disabled={isAddingCard}
              title="Adicionar cartão"
            >
              <Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
      {!isCompact && renaming && renameError ? <p className={styles.inlineComposerError}>{renameError}</p> : null}

      {!isCompact && isDragOverlay ? (
        <div
          className={`${styles.colCards} ${col.cards.length === 0 ? styles.colCardsEmpty : ''}`}
        >
          {col.cards.map((card) => (
            <KanbanCardView
              key={card.uiKey ?? card.id}
              card={card}
              colTitle={col.title}
              isConfirmed={Boolean(card.isCompleted)}
              labels={labels}
              members={members}
              styles={styles}
            />
          ))}
        </div>
      ) : !isCompact ? (
        <>
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            <div
              ref={setCardStackDropRef}
              className={`${styles.colCards} ${isEmptyColumn ? styles.colCardsEmpty : ''}`}
            >
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
        </>
      ) : null}
    </div>
  )
}

function SortableKanbanColumn(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.col.id,
    data: {
      type: 'column',
      columnId: props.col.id,
    },
  })

  return (
    <KanbanColumnView
      {...props}
      setNodeRef={setNodeRef}
      isDragging={isDragging}
      dragHandleAttributes={attributes}
      dragHandleListeners={listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    />
  )
}

function KanbanColumn({
  isDragOverlay = false,
  ...props
}) {
  if (isDragOverlay) {
    return <KanbanColumnView {...props} isDragOverlay />
  }

  return <SortableKanbanColumn {...props} />
}

function areKanbanColumnPropsEqual(prevProps, nextProps) {
  return prevProps.col === nextProps.col
    && prevProps.isDropTarget === nextProps.isDropTarget
    && prevProps.isDragOverlay === nextProps.isDragOverlay
    && prevProps.isCompact === nextProps.isCompact
    && prevProps.onToggleCompactView === nextProps.onToggleCompactView
    && prevProps.labels === nextProps.labels
    && prevProps.members === nextProps.members
    && prevProps.colorOptions === nextProps.colorOptions
    && prevProps.statusOptions === nextProps.statusOptions
    && prevProps.styles === nextProps.styles
}

export default memo(KanbanColumn, areKanbanColumnPropsEqual)
