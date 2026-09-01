import { memo, useLayoutEffect, useRef, useState } from 'react'
import { defaultDropAnimationSideEffects, useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  CircleDashed,
  CircleDotDashed,
  CircleX,
  Ellipsis,
  Loader,
  Minus,
  Plus,
} from 'lucide-react'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import AddCardComposer from '../AddCardComposer/AddCardComposer.jsx'
import ColMenu from '../ColMenu/ColMenu.jsx'
import KanbanCard, { KanbanCardView } from '../KanbanCard/KanbanCard.jsx'
import { resolveKanbanColumnStatus } from '../../data/kanbanColumnStatusOptions.js'
import { columnCardStackDropId, columnGroupBeforeDropId } from '../../hooks/boardDnDUtils.js'
import {
  buildColumnListSegments,
  canInsertColumnGroupAfter,
  collapsedCardIdsFromGroups,
  nextCardIdAfter,
  normalizeColumnGroups,
} from '../../utils/columnCardGroups.js'

const ICON_SIZE = 13
const ICON_SIZE_MD = 14
const ICON_STROKE = 1.75
const COLUMN_DRAG_OVERLAY_MAX_HEIGHT_FALLBACK_PX = 320
export const COLUMN_DRAG_OVERLAY_HEIGHT_MS = 300
const CARD_DRAG_OVERLAY_DROP_MS = 180
const columnDragOverlayHeightById = new Map()

function groupKeysFromGroups(groups) {
  return new Set(
    (Array.isArray(groups) ? groups : [])
      .map((group) => group?.uiKey ?? group?.id)
      .filter(Boolean),
  )
}

function sameKeySet(left, right) {
  if (left.size !== right.size) {
    return false
  }
  for (const key of left) {
    if (!right.has(key)) {
      return false
    }
  }
  return true
}

function useEnteringColumnGroupKeys(groups, enabled) {
  const currentKeys = groupKeysFromGroups(groups)
  const [prevKeys, setPrevKeys] = useState(currentKeys)
  const [enteringKeys, setEnteringKeys] = useState(() => new Set())

  const freshKeys = []
  if (enabled) {
    for (const key of currentKeys) {
      if (!prevKeys.has(key)) {
        freshKeys.push(key)
      }
    }
  }

  if (!sameKeySet(prevKeys, currentKeys)) {
    setPrevKeys(currentKeys)
    if (enabled && freshKeys.length) {
      const nextEntering = new Set(enteringKeys)
      for (const key of freshKeys) {
        nextEntering.add(key)
      }
      setEnteringKeys(nextEntering)
    }
  }

  const visibleEntering = new Set(enteringKeys)
  for (const key of freshKeys) {
    visibleEntering.add(key)
  }

  const clearEnteringKey = (key) => {
    if (!key) {
      return
    }
    setEnteringKeys((prev) => {
      if (!prev.has(key)) {
        return prev
      }
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }

  return [visibleEntering, clearEnteringKey]
}

function readColumnDragOverlayMaxHeightPx(columnNode) {
  const probe = document.createElement('div')
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;height:var(--kanban-column-drag-max-height)'
  columnNode.appendChild(probe)
  const height = probe.getBoundingClientRect().height
  probe.remove()
  return height > 0 ? height : COLUMN_DRAG_OVERLAY_MAX_HEIGHT_FALLBACK_PX
}

function findColumnDragOverlayNode(overlayRoot) {
  if (!overlayRoot) return null
  if (typeof overlayRoot.getAttribute === 'function' && overlayRoot.getAttribute('data-column-id')) {
    return overlayRoot
  }
  return overlayRoot.querySelector?.('[data-column-id]') ?? null
}

function readColumnRestingHeightPx(columnId, overlayNode) {
  const nodes = document.querySelectorAll(`[data-column-id="${columnId}"]`)
  for (const node of nodes) {
    if (node === overlayNode) continue
    const height = node.getBoundingClientRect().height
    if (height > 0) return height
  }
  return overlayNode.getBoundingClientRect().height
}

export function expandColumnDragOverlay(overlayRoot, restingHeightOverride) {
  const column = findColumnDragOverlayNode(overlayRoot)
  if (!column) return false

  const columnId = column.getAttribute('data-column-id')
  const remembered = columnId ? columnDragOverlayHeightById.get(columnId) : null
  const restingHeight = (
    (Number(restingHeightOverride) > 0 ? Number(restingHeightOverride) : 0)
    || remembered?.restingHeight
    || Number(column.dataset.kanbanDragRestingHeight)
  )
  if (!(restingHeight > 0)) return false

  const currentHeight = column.getBoundingClientRect().height
  column.dataset.kanbanDragRestingHeight = String(restingHeight)
  column.dataset.kanbanDragExpanding = 'true'
  column.style.maxHeight = `${restingHeight}px`

  return currentHeight < restingHeight - 1
}

export function forgetColumnDragOverlayHeight(columnId) {
  if (!columnId) return
  columnDragOverlayHeightById.delete(columnId)
}

export function kanbanDropAnimation(args) {
  const dragType = args.active?.data?.current?.type ?? args.active?.data?.type
  const isColumn = dragType === 'column'
  const boardColumnHeight = Number(args.active?.rect?.height)
  const didExpand = isColumn
    ? expandColumnDragOverlay(
      args.dragOverlay.node,
      boardColumnHeight > 0 ? boardColumnHeight : undefined,
    )
    : false
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  const duration = prefersReducedMotion
    ? 0
    : (didExpand ? COLUMN_DRAG_OVERLAY_HEIGHT_MS : CARD_DRAG_OVERLAY_DROP_MS)

  const { transform, active, dragOverlay } = args
  const delta = {
    x: dragOverlay.rect.left - active.rect.left,
    y: dragOverlay.rect.top - active.rect.top,
  }
  const finalTransform = {
    x: transform.x - delta.x,
    y: transform.y - delta.y,
    scaleX: 1,
    scaleY: 1,
  }
  const cleanup = defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0',
      },
    },
  })(args)

  const finish = () => {
    cleanup?.()
    if (isColumn) {
      forgetColumnDragOverlayHeight(String(active.id))
    }
  }

  if (!duration) {
    finish()
    return undefined
  }

  const animation = dragOverlay.node.animate(
    [
      { transform: CSS.Transform.toString(transform) },
      { transform: CSS.Transform.toString(finalTransform) },
    ],
    {
      duration,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    },
  )

  return new Promise((resolve) => {
    animation.onfinish = () => {
      finish()
      resolve()
    }
  })
}

function columnAnimateLayoutChanges() {
  return false
}

const STATUS_ICONS = {
  CircleDashed,
  CircleDotDashed,
  Loader,
  CircleAlert,
  CircleCheckBig,
  CircleX,
}

function ColumnGroupInsertButton({ styles, onClick }) {
  return (
    <button
      type="button"
      className={styles.cardInsertBtn}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onClick?.()
      }}
      aria-label="Criar agrupamento com os cartões abaixo"
    >
      <span className={styles.cardInsertRule} aria-hidden="true" />
      <Plus
        size={10}
        strokeWidth={ICON_STROKE}
        className={styles.cardInsertGlyph}
        aria-hidden="true"
      />
      <span className={styles.cardInsertRule} aria-hidden="true" />
    </button>
  )
}

function ColumnGroupBeforeDropTarget({
  columnId,
  groupId,
  disabled,
  styles,
  children,
}) {
  const { setNodeRef } = useDroppable({
    id: columnGroupBeforeDropId(columnId, groupId),
    data: {
      type: 'group-before',
      columnId,
      groupId,
    },
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      className={styles.columnGroupHeader}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  )
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
  groupDropPreview = null,
  sortableCardIds = null,
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
  onCreateColumnGroup,
  onUpdateColumnGroup,
  onDeleteColumnGroup,
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
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [groupTitleDraft, setGroupTitleDraft] = useState('')
  const renameRef = useRef(null)
  const menuAnchorRef = useRef(null)
  const columnNodeRef = useRef(null)
  const cardSlotNodesRef = useRef(new Map())
  const cardSlotRefCallbacksRef = useRef(new Map())
  const [composerOverlay, setComposerOverlay] = useState(false)

  const setColumnNodeRef = (node) => {
    columnNodeRef.current = node
    setNodeRef?.(node)
  }
  const isEmptyColumn = col.cards.length === 0 && !addingCard && !isAddingCard
  const hasColumnColor = Boolean(col.color?.trim())
  const columnGroups = normalizeColumnGroups(col.groups)
  const [enteringGroupKeys, clearEnteringGroupKey] = useEnteringColumnGroupKeys(
    columnGroups,
    !isDragOverlay,
  )
  const hiddenCardIds = collapsedCardIdsFromGroups(col.cards, columnGroups)
  const listSegments = buildColumnListSegments(col.cards, columnGroups)
  const resolvedSortableCardIds = (sortableCardIds ?? col.cards.map((card) => card.id))
    .filter((cardId) => !hiddenCardIds.has(cardId))
  const groupLayoutKey = columnGroups
    .map((group) => `${group.id}:${group.collapsed}:${group.cardIds.join(',')}`)
    .join('|')

  const getCardSlotRef = (cardId) => {
    if (!cardSlotRefCallbacksRef.current.has(cardId)) {
      cardSlotRefCallbacksRef.current.set(cardId, (node) => {
        if (node) {
          cardSlotNodesRef.current.set(cardId, node)
        } else {
          cardSlotNodesRef.current.delete(cardId)
        }
      })
    }
    return cardSlotRefCallbacksRef.current.get(cardId)
  }

  useLayoutEffect(() => {
    const groupSegments = listSegments.filter((segment) => segment.type === 'group')
    if (!groupSegments.length) {
      return undefined
    }

    const updateGroupChromeHeights = () => {
      for (const segment of groupSegments) {
        const firstNode = cardSlotNodesRef.current.get(segment.cards[0]?.id)
        const lastNode = cardSlotNodesRef.current.get(segment.cards.at(-1)?.id)
        if (!firstNode || !lastNode) {
          continue
        }
        const height = Math.max(
          0,
          lastNode.offsetTop + lastNode.offsetHeight - firstNode.offsetTop,
        )
        firstNode.style.setProperty('--column-group-body-height', `${height}px`)
      }
    }

    updateGroupChromeHeights()
    const frameId = window.requestAnimationFrame(updateGroupChromeHeights)
    const observer = typeof ResizeObserver === 'function'
      ? new ResizeObserver(updateGroupChromeHeights)
      : null
    for (const segment of groupSegments) {
      for (const card of segment.cards) {
        const node = cardSlotNodesRef.current.get(card.id)
        if (node) {
          observer?.observe(node)
        }
      }
    }

    return () => {
      window.cancelAnimationFrame(frameId)
      observer?.disconnect()
    }
  }, [listSegments])

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
      setAddingCard(true)
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

  useLayoutEffect(() => {
    if (isDragOverlay || isCompact || !addingCard) {
      setComposerOverlay(false)
      return undefined
    }

    const column = columnNodeRef.current
    const board = column?.parentElement
    if (!column || !board) return undefined

    const updateOverlay = () => {
      const columnRect = column.getBoundingClientRect()
      const boardRect = board.getBoundingClientRect()
      const paddingBottom = Number.parseFloat(getComputedStyle(board).paddingBottom) || 0
      const roomBelow = boardRect.bottom - paddingBottom - columnRect.bottom
      setComposerOverlay(roomBelow < 8)
    }

    updateOverlay()
    const observer = new ResizeObserver(updateOverlay)
    observer.observe(column)
    return () => observer.disconnect()
  }, [addingCard, isCompact, isDragOverlay])

  useLayoutEffect(() => {
    if (!isDragOverlay || isCompact) return undefined

    const node = columnNodeRef.current
    if (!node) return undefined

    const maxHeight = readColumnDragOverlayMaxHeightPx(node)
    const remembered = columnDragOverlayHeightById.get(col.id)

    if (remembered) {
      node.dataset.kanbanDragRestingHeight = String(remembered.restingHeight)
      node.classList.add(styles.columnDragOverlayCollapsed)
      node.style.maxHeight = `${remembered.collapsedHeight}px`
      return undefined
    }

    const restingHeight = readColumnRestingHeightPx(col.id, node)
    if (!(restingHeight > 0) || restingHeight <= maxHeight + 1) return undefined

    node.dataset.kanbanDragRestingHeight = String(restingHeight)
    node.classList.add(styles.columnDragOverlayCollapsed)
    columnDragOverlayHeightById.set(col.id, {
      restingHeight,
      collapsedHeight: maxHeight,
    })
    node.style.maxHeight = `${restingHeight}px`

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      node.style.maxHeight = `${maxHeight}px`
      return undefined
    }

    let innerFrame = 0
    const outerFrame = window.requestAnimationFrame(() => {
      innerFrame = window.requestAnimationFrame(() => {
        node.style.maxHeight = `${maxHeight}px`
      })
    })

    return () => {
      window.cancelAnimationFrame(outerFrame)
      window.cancelAnimationFrame(innerFrame)
    }
  }, [col.cards.length, col.id, isCompact, isDragOverlay, styles.columnDragOverlayCollapsed])

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

  const beginEditingGroup = (group) => {
    setEditingGroupId(group.id)
    setGroupTitleDraft(group.title ?? '')
  }

  useLayoutEffect(() => {
    const untitled = columnGroups.find((group) => (
      enteringGroupKeys.has(group.uiKey ?? group.id) && !String(group.title ?? '').trim()
    ))
    if (!untitled || editingGroupId === untitled.id) {
      return
    }
    beginEditingGroup(untitled)
  }, [columnGroups, editingGroupId, enteringGroupKeys])

  const submitGroupTitle = async (group) => {
    const nextTitle = groupTitleDraft.trim()
    setEditingGroupId(null)
    if (nextTitle === (group.title ?? '')) {
      return
    }

    try {
      await onUpdateColumnGroup?.(col.id, group.id, { title: nextTitle })
    } catch {
      setEditingGroupId(group.id)
      setGroupTitleDraft(nextTitle)
    }
  }

  const handleCreateGroupAfter = async (afterCardId) => {
    if (isDragOverlay || !canInsertColumnGroupAfter(col.cards, columnGroups, afterCardId)) {
      return
    }

    const startCardId = nextCardIdAfter(col.cards, afterCardId)
    try {
      const created = await onCreateColumnGroup?.(col.id, startCardId)
      if (created?.id) {
        beginEditingGroup(created)
      }
    } catch {
      // O rollback fica a cargo do hook; o controle some se o agrupamento nao persistir.
    }
  }

  const renderCardNode = (
    card,
    group = null,
    isFirstGroupCard = false,
    isLastGroupCard = false,
  ) => {
    if (isDragOverlay) {
      return (
        <KanbanCardView
          key={card.uiKey ?? card.id}
          card={card}
          colTitle={col.title}
          isConfirmed={Boolean(card.isCompleted)}
          labels={labels}
          members={members}
          styles={styles}
          groupId={group?.id ?? null}
          isFirstGroupCard={isFirstGroupCard}
        />
      )
    }

    return (
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
        groupId={group?.id ?? null}
        isFirstGroupCard={isFirstGroupCard}
        isLastGroupCard={isLastGroupCard}
        suppressLayoutAnimation={enteringGroupKeys.size > 0}
      />
    )
  }

  const renderCardSlot = (
    card,
    allowInsert,
    group = null,
    isFirstGroupCard = false,
    isLastGroupCard = false,
    isCollapsedGroup = false,
    isEnteringGroup = false,
  ) => {
    const showInsert = Boolean(
      allowInsert
      && !isDragOverlay
      && canInsertColumnGroupAfter(col.cards, columnGroups, card.id),
    )
    const isDropPreviewTarget = (
      groupDropPreview?.targetColumnId === col.id
      && groupDropPreview.overId === card.id
    )
    const isDropPreviewSource = (
      groupDropPreview?.sourceColumnId === col.id
      && groupDropPreview.cardId === card.id
    )

    return (
      <div
        ref={getCardSlotRef(card.id)}
        key={card.uiKey ?? card.id}
        id={`kanban-card-slot-${col.id}-${card.id}`}
        className={`
          ${styles.cardSlot}
          ${group ? styles.cardSlotGrouped : ''}
          ${isFirstGroupCard ? styles.cardSlotGroupFirst : ''}
          ${isLastGroupCard ? styles.cardSlotGroupLast : ''}
          ${isCollapsedGroup ? styles.cardSlotGroupCollapsed : ''}
          ${isEnteringGroup ? styles.cardSlotGroupEnter : ''}
          ${isDropPreviewTarget ? styles.cardSlotDropPreview : ''}
          ${isDropPreviewSource ? styles.cardSlotDragPreviewSource : ''}
        `}
        aria-hidden={isCollapsedGroup || undefined}
        inert={isCollapsedGroup ? '' : undefined}
      >
        <div className={styles.cardSlotInner}>
          {renderCardNode(card, group, isFirstGroupCard, isLastGroupCard)}
        </div>
        {showInsert ? (
          <ColumnGroupInsertButton
            styles={styles}
            onClick={() => handleCreateGroupAfter(card.id)}
          />
        ) : null}
      </div>
    )
  }

  const renderColumnGroupHeader = (group, cards) => {
    const expanded = !group.collapsed
    const groupTitle = group.title.trim()
    const groupA11yLabel = groupTitle || 'Agrupamento'
    const groupUiKey = group.uiKey ?? group.id
    const isEntering = Boolean(groupUiKey && enteringGroupKeys.has(groupUiKey))
    const isEditingTitle = editingGroupId === group.id || (isEntering && !groupTitle)
    const isGroupPreviewTarget = (
      groupDropPreview?.targetColumnId === col.id
      && groupDropPreview.targetGroupId === group.id
    )
    const isGroupPreviewBefore = (
      groupDropPreview?.targetColumnId === col.id
      && groupDropPreview.beforeGroupId === group.id
    )
    const isGroupPreviewSource = (
      groupDropPreview?.sourceGroupId === group.id
      && groupDropPreview.targetGroupId !== group.id
    )

    return (
      <section
        key={groupUiKey}
        className={`
          ${styles.columnGroup}
          ${expanded ? '' : styles.columnGroupCollapsed}
          ${isEntering ? styles.columnGroupEnter : ''}
          ${isGroupPreviewTarget ? styles.columnGroupDropPreview : ''}
          ${isGroupPreviewBefore ? styles.columnGroupBeforePreview : ''}
          ${isGroupPreviewSource ? styles.columnGroupSourcePreview : ''}
        `}
        aria-label={groupA11yLabel}
        aria-owns={expanded
          ? cards.map((card) => `kanban-card-slot-${col.id}-${card.id}`).join(' ')
          : undefined}
        onAnimationEnd={(event) => {
          if (!isEntering || !String(event.animationName).includes('ChromeEmerge')) {
            return
          }
          clearEnteringGroupKey(groupUiKey)
        }}
      >
        <div className={styles.columnGroupHeaderReveal}>
          <div className={styles.columnGroupHeaderRevealInner}>
            <ColumnGroupBeforeDropTarget
              columnId={col.id}
              groupId={group.id}
              disabled={isDragOverlay}
              styles={styles}
            >
              <button
                type="button"
                className={styles.columnGroupChevronBtn}
                aria-expanded={expanded}
                aria-label={expanded ? `Recolher ${groupA11yLabel}` : `Expandir ${groupA11yLabel}`}
                onClick={() => onUpdateColumnGroup?.(col.id, group.id, (current) => ({
                  collapsed: !current?.collapsed,
                }))}
              >
                <ChevronRight
                  size={ICON_SIZE}
                  strokeWidth={ICON_STROKE}
                  className={styles.columnGroupChevron}
                  aria-hidden="true"
                />
              </button>
              {isEditingTitle && !isDragOverlay ? (
                <input
                  className={styles.columnGroupTitleInput}
                  value={groupTitleDraft}
                  aria-label="Nome do agrupamento"
                  placeholder=""
                  onChange={(event) => setGroupTitleDraft(event.target.value)}
                  onBlur={() => submitGroupTitle(group)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur()
                    }
                    if (event.key === 'Escape') {
                      setEditingGroupId(null)
                      setGroupTitleDraft(group.title ?? '')
                    }
                  }}
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  className={styles.columnGroupTitle}
                  onClick={() => {
                    if (!isDragOverlay) {
                      beginEditingGroup(group)
                    }
                  }}
                >
                  {groupTitle}
                </button>
              )}
              {!isDragOverlay ? (
                <button
                  type="button"
                  className={styles.columnGroupRemoveBtn}
                  aria-label={`Remover ${groupA11yLabel}`}
                  onClick={() => onDeleteColumnGroup?.(col.id, group.id)}
                >
                  <Minus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                </button>
              ) : null}
            </ColumnGroupBeforeDropTarget>
          </div>
        </div>
      </section>
    )
  }

  const renderListItems = (showInserts) => listSegments.flatMap((segment) => {
    if (segment.type === 'loose') {
      return segment.cards.map((card) => renderCardSlot(card, showInserts))
    }

    const group = segment.group
    const collapsed = Boolean(group.collapsed)
    const groupUiKey = group.uiKey ?? group.id
    const isEntering = Boolean(groupUiKey && enteringGroupKeys.has(groupUiKey))
    return [
      renderColumnGroupHeader(group, segment.cards),
      ...segment.cards.map((card, index) => renderCardSlot(
        card,
        false,
        group,
        index === 0,
        index === segment.cards.length - 1,
        collapsed,
        isEntering,
      )),
    ]
  })

  return (
    <div
      ref={setColumnNodeRef}
      className={`
        ${styles.column}
        ${isDropTarget ? styles.columnDropTarget : ''}
        ${hasColumnColor ? styles.columnColored : ''}
        ${isDragging ? styles.columnDragging : ''}
        ${isDragOverlay ? styles.columnDragOverlay : ''}
        ${isCompact ? styles.columnCompact : ''}
        ${composerOverlay ? styles.columnComposerOverlay : ''}
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
                    setComposerOverlay(false)
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
          <SortableContext
            items={resolvedSortableCardIds}
            strategy={verticalListSortingStrategy}
          >
            {renderListItems(false)}
          </SortableContext>
        </div>
      ) : !isCompact ? (
        <>
          <div
            className={`${styles.colCardsScroll} ${isEmptyColumn ? styles.colCardsScrollEmpty : ''}`}
          >
            <CustomScrollArea
              className={styles.colCardsScrollArea}
              viewportClassName={`${styles.colCards} ${isEmptyColumn ? styles.colCardsEmpty : ''}`}
              viewportRef={setCardStackDropRef}
              enabled={col.cards.length > 0}
              refreshKey={`${col.id}:${col.cards.length}:${groupLayoutKey}`}
            >
              <SortableContext
                items={resolvedSortableCardIds}
                strategy={verticalListSortingStrategy}
              >
                {renderListItems(true)}
              </SortableContext>
            </CustomScrollArea>
          </div>

          <AddCardComposer
            addingCard={addingCard}
            setAddingCard={(nextOpen) => {
              if (nextOpen) startAddingCard()
            }}
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
    animateLayoutChanges: columnAnimateLayoutChanges,
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
    && prevProps.groupDropPreview === nextProps.groupDropPreview
    && prevProps.sortableCardIds === nextProps.sortableCardIds
    && prevProps.isDragOverlay === nextProps.isDragOverlay
    && prevProps.isCompact === nextProps.isCompact
    && prevProps.onToggleCompactView === nextProps.onToggleCompactView
    && prevProps.onCreateColumnGroup === nextProps.onCreateColumnGroup
    && prevProps.onUpdateColumnGroup === nextProps.onUpdateColumnGroup
    && prevProps.onDeleteColumnGroup === nextProps.onDeleteColumnGroup
    && prevProps.labels === nextProps.labels
    && prevProps.members === nextProps.members
    && prevProps.colorOptions === nextProps.colorOptions
    && prevProps.statusOptions === nextProps.statusOptions
    && prevProps.styles === nextProps.styles
}

export default memo(KanbanColumn, areKanbanColumnPropsEqual)
