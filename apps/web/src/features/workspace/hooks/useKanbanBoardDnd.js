import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import {
  createBoardCollisionDetection,
  createBoardDragCollisionState,
} from './boardCollisionDetection.js'
import {
  applyCardDropToColumns,
  applyDragOverToColumns,
  findCardIndex,
  findColumnIdForItem,
  isColumnId,
  KANBAN_INBOX_DROP_ID,
  reorderColumnsByDrag,
  resolveOverIndex,
} from './boardDnDUtils.js'

const DRAG_TYPE_CARD = 'card'
const DRAG_TYPE_COLUMN = 'column'

function getDragType(active) {
  return active?.data?.current?.type ?? DRAG_TYPE_CARD
}

function getCardGroupId(columns, cardId) {
  for (const column of columns) {
    const cardIndex = column.cards.findIndex((card) => card.id === cardId)
    if (cardIndex < 0) {
      continue
    }

    const group = (column.groups ?? []).find((item) => {
      if (Array.isArray(item.cardIds) && item.cardIds.length) {
        return item.cardIds.includes(cardId)
      }

      const startIndex = column.cards.findIndex((card) => card.id === item.startCardId)
      if (startIndex < 0) {
        return false
      }
      const endIndex = column.cards.findIndex((card) => card.id === item.endCardId)
      const lastIndex = endIndex < startIndex ? startIndex : endIndex
      return cardIndex >= startIndex && cardIndex <= lastIndex
    })
    return group?.id ?? null
  }

  return null
}

function resolveTargetGroupId(columns, overId, dropIntent, sourceGroupId = null) {
  if (dropIntent?.targetGroupId) {
    return dropIntent.targetGroupId
  }

  const overGroupId = getCardGroupId(columns, overId)
  if (!sourceGroupId && overGroupId && dropIntent?.kind !== 'before-group') {
    return overGroupId
  }
  if (!dropIntent) {
    return overGroupId
  }
  return null
}

export function useKanbanBoardDnd({
  activePlanId,
  columns = [],
  updateColumns,
  moveCard,
  reorderColumns,
  isBackendDriven = false,
  onMoveError,
  onReorderError,
  onInboxDrop,
}) {
  const [activeCardId, setActiveCardId] = useState(null)
  const [activeColumnId, setActiveColumnId] = useState(null)
  const [isInboxDropActive, setIsInboxDropActive] = useState(false)
  const [dragOverColumnId, setDragOverColumnId] = useState(null)
  const [groupDropPreview, setGroupDropPreview] = useState(null)
  const [dragPreviewCardIdsByColumn, setDragPreviewCardIdsByColumn] = useState(null)
  const columnsRef = useRef(columns)
  const dragColumnsRef = useRef(columns)
  const dragStartSnapshotRef = useRef(null)
  const dragPreviewSignatureRef = useRef(null)
  const dragTargetRef = useRef(null)
  const dragCollisionStateRef = useRef(createBoardDragCollisionState())

  columnsRef.current = columns

  useEffect(() => {
    if (!activeCardId && !activeColumnId) {
      dragColumnsRef.current = columns
      columnsRef.current = columns
    }
  }, [activeCardId, activeColumnId, columns])

  const columnIds = useMemo(() => columns.map((column) => column.id), [columns])
  const columnIdsRef = useRef(columnIds)
  columnIdsRef.current = columnIds

  const collisionDetection = useMemo(
    () => createBoardCollisionDetection(
      () => columnIdsRef.current,
      dragCollisionStateRef.current,
    ),
    [],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const activeCard = useMemo(() => {
    if (!activeCardId) return null

    const sourceColumns = dragColumnsRef.current

    for (const column of sourceColumns) {
      const card = column.cards.find((item) => item.id === activeCardId)
      if (card) {
        return { card, columnId: column.id, columnTitle: column.title }
      }
    }

    return null
  }, [activeCardId, columns])

  const activeDragColumn = useMemo(() => {
    if (!activeColumnId) return null

    return dragColumnsRef.current.find((column) => column.id === activeColumnId) ?? null
  }, [activeColumnId, columns])

  const resetDragCollisionState = useCallback(() => {
    dragCollisionStateRef.current.reset()
  }, [])

  const restoreDragSnapshot = useCallback(() => {
    const snapshot = dragStartSnapshotRef.current
    if (!snapshot) {
      return
    }

    dragColumnsRef.current = snapshot
    columnsRef.current = snapshot
    updateColumns(() => snapshot)
  }, [updateColumns])

  const handleDragStart = useCallback(({ active }) => {
    const dragType = getDragType(active)

    dragStartSnapshotRef.current = columnsRef.current
    dragColumnsRef.current = columnsRef.current
    dragPreviewSignatureRef.current = null
    dragTargetRef.current = null
    dragCollisionStateRef.current.reset()
    setGroupDropPreview(null)
    setDragPreviewCardIdsByColumn(null)

    if (dragType === DRAG_TYPE_COLUMN) {
      setActiveColumnId(String(active.id))
      setActiveCardId(null)
      setIsInboxDropActive(false)
      setDragOverColumnId(null)
      return
    }

    const sourceColumnId = findColumnIdForItem(columnsRef.current, String(active.id))

    if (sourceColumnId) {
      dragCollisionStateRef.current.setStickyColumnId(sourceColumnId)
      dragCollisionStateRef.current.setPointerColumnId(sourceColumnId)
    }

    setActiveCardId(String(active.id))
    setActiveColumnId(null)
    setIsInboxDropActive(false)
    setDragOverColumnId(sourceColumnId)
  }, [])

  const handleCardDragOver = useCallback(({ active, over }) => {
    const pointerColumnId = dragCollisionStateRef.current.getPointerColumnId()

    if (!over) {
      setIsInboxDropActive(false)
      setDragOverColumnId(pointerColumnId)
      setGroupDropPreview(null)
      dragPreviewSignatureRef.current = null
      dragTargetRef.current = null
      setDragPreviewCardIdsByColumn(null)
      return
    }

    if (over.id === KANBAN_INBOX_DROP_ID) {
      setIsInboxDropActive(true)
      setDragOverColumnId(null)
      setGroupDropPreview(null)
      dragPreviewSignatureRef.current = null
      dragTargetRef.current = null
      setDragPreviewCardIdsByColumn(null)
      return
    }

    setIsInboxDropActive(false)
    setDragOverColumnId(pointerColumnId)

    const activeId = String(active.id)
    const overId = String(over.id)
    const dropIntent = dragCollisionStateRef.current.getDropIntent()
    const sourceColumns = dragStartSnapshotRef.current ?? dragColumnsRef.current
    const sourceGroupId = getCardGroupId(sourceColumns, activeId)
    const previewGroupId = getCardGroupId(dragColumnsRef.current, activeId)
    const sourceColumnId = findColumnIdForItem(sourceColumns, activeId)
    const resolvedTargetGroupId = resolveTargetGroupId(
      sourceColumns,
      overId,
      dropIntent,
      sourceGroupId,
    )
    const targetGroupId = resolvedTargetGroupId
      ?? (overId === activeId ? dragTargetRef.current?.groupId : null)
    const targetColumnId = findColumnIdForItem(sourceColumns, overId)
    setGroupDropPreview(null)
    if (overId === activeId && dragTargetRef.current?.groupId) {
      return
    }

    const isGroupTransaction = Boolean(
      sourceGroupId || previewGroupId || targetGroupId || dropIntent?.kind === 'before-group',
    )
    if (isGroupTransaction) {
      const targetPosition = targetColumnId
        ? resolveOverIndex(sourceColumns, columnIds, overId, targetColumnId)
        : -1
      if (!sourceColumnId || targetPosition < 0) {
        return
      }
      if (targetGroupId) {
        dragTargetRef.current = {
          groupId: targetGroupId,
          columnId: targetColumnId,
          position: targetPosition,
        }
      } else if (overId !== activeId) {
        dragTargetRef.current = null
      }

      const projectedColumns = applyCardDropToColumns(
        sourceColumns,
        activeId,
        sourceColumnId,
        targetColumnId,
        targetPosition,
        targetGroupId,
      )
      const previewSignature = projectedColumns
        .map((column) => [
          `${column.id}:${column.cards.map((card) => card.id).join(',')}`,
          (column.groups ?? [])
            .map((group) => `${group.id}:${(group.cardIds ?? []).join(',')}`)
            .join(';'),
        ].join('/'))
        .join('|')
      if (dragPreviewSignatureRef.current === previewSignature) {
        return
      }

      dragPreviewSignatureRef.current = previewSignature
      dragColumnsRef.current = projectedColumns
      columnsRef.current = projectedColumns
      updateColumns(() => projectedColumns)
      setDragPreviewCardIdsByColumn(null)
      return
    }

    dragPreviewSignatureRef.current = null
    setDragPreviewCardIdsByColumn(null)
    const { columns: reorderedColumns, changed } = applyDragOverToColumns(
      dragColumnsRef.current,
      columnIds,
      activeId,
      overId,
    )

    if (!changed) {
      return
    }

    dragColumnsRef.current = reorderedColumns
    columnsRef.current = reorderedColumns
    updateColumns(() => reorderedColumns)
  }, [columnIds, updateColumns])

  const handleDragOver = useCallback((event) => {
    if (getDragType(event.active) === DRAG_TYPE_COLUMN) {
      return
    }

    handleCardDragOver(event)
  }, [handleCardDragOver])

  const resetDragState = useCallback(() => {
    dragStartSnapshotRef.current = null
    dragPreviewSignatureRef.current = null
    dragTargetRef.current = null
    resetDragCollisionState()
    setActiveCardId(null)
    setActiveColumnId(null)
    setIsInboxDropActive(false)
    setDragOverColumnId(null)
    setGroupDropPreview(null)
    setDragPreviewCardIdsByColumn(null)
  }, [resetDragCollisionState])

  const handleDragCancel = useCallback(() => {
    restoreDragSnapshot()
    resetDragState()
  }, [resetDragState, restoreDragSnapshot])

  const handleColumnDragEnd = useCallback(async ({ active, over }, snapshot) => {
    if (!snapshot) {
      return
    }

    const overId = over && isColumnId(snapshot, String(over.id))
      ? String(over.id)
      : null
    const { columns: nextColumns, changed } = reorderColumnsByDrag(
      snapshot,
      String(active.id),
      overId,
    )

    if (!changed) {
      return
    }

    dragColumnsRef.current = nextColumns
    columnsRef.current = nextColumns
    updateColumns(() => nextColumns)

    if (!activePlanId || !isBackendDriven) {
      return
    }

    try {
      await reorderColumns(nextColumns.map((column) => column.id))
    } catch (error) {
      dragColumnsRef.current = snapshot
      columnsRef.current = snapshot
      updateColumns(() => snapshot)
      onReorderError?.(error)
    }
  }, [activePlanId, isBackendDriven, onReorderError, reorderColumns, updateColumns])

  const handleCardDragEnd = useCallback(async (
    { active, over },
    snapshot,
    dropIntent,
    targetHint,
  ) => {
    const cardId = String(active.id)

    if (!over) {
      if (snapshot) {
        dragColumnsRef.current = snapshot
        columnsRef.current = snapshot
        updateColumns(() => snapshot)
      }
      return
    }

    if (over.id === KANBAN_INBOX_DROP_ID) {
      if (snapshot) {
        dragColumnsRef.current = snapshot
        columnsRef.current = snapshot
        updateColumns(() => snapshot)
      }
      onInboxDrop?.(cardId)
      return
    }

    if (!activePlanId) {
      return
    }

    const finalColumns = columnsRef.current
    const sourceColumns = snapshot ?? finalColumns
    const sourceGroupId = getCardGroupId(sourceColumns, cardId)
    const targetGroupId = resolveTargetGroupId(
      sourceColumns,
      String(over.id),
      dropIntent,
      sourceGroupId,
    ) ?? targetHint?.groupId ?? null
    const isGroupTransaction = Boolean(sourceGroupId || targetGroupId)
    const targetColumns = isGroupTransaction ? sourceColumns : finalColumns
    const targetColumnId = targetGroupId && targetHint?.groupId === targetGroupId
      ? targetHint.columnId
      : findColumnIdForItem(targetColumns, String(over.id))

    if (!targetColumnId) {
      if (snapshot) {
        dragColumnsRef.current = snapshot
        columnsRef.current = snapshot
        updateColumns(() => snapshot)
      }
      return
    }

    const targetPosition = targetGroupId && targetHint?.groupId === targetGroupId
      ? targetHint.position
      : isGroupTransaction
        ? resolveOverIndex(targetColumns, columnIds, String(over.id), targetColumnId)
      : findCardIndex(finalColumns, targetColumnId, cardId)
    if (targetPosition === -1) {
      if (snapshot) {
        dragColumnsRef.current = snapshot
        columnsRef.current = snapshot
        updateColumns(() => snapshot)
      }
      return
    }

    const sourceColumnId = findColumnIdForItem(sourceColumns, cardId)
    const sourcePosition = snapshot && sourceColumnId
      ? findCardIndex(snapshot, sourceColumnId, cardId)
      : -1

    const movedBetweenColumns = sourceColumnId && sourceColumnId !== targetColumnId
    const changedPosition = sourcePosition !== targetPosition
    const changedMembership = sourceGroupId !== targetGroupId

    if (!movedBetweenColumns && !changedPosition && !changedMembership) {
      return
    }

    if (!isBackendDriven) {
      return
    }

    const previousColumns = finalColumns
    if (isGroupTransaction) {
      const optimisticColumns = applyCardDropToColumns(
        sourceColumns,
        cardId,
        sourceColumnId,
        targetColumnId,
        targetPosition,
        targetGroupId,
      )
      dragColumnsRef.current = optimisticColumns
      columnsRef.current = optimisticColumns
      updateColumns(() => optimisticColumns)
    }

    try {
      await moveCard(cardId, targetColumnId, targetPosition, targetGroupId)
    } catch (error) {
      const rollbackColumns = snapshot ?? previousColumns
      dragColumnsRef.current = rollbackColumns
      columnsRef.current = rollbackColumns
      updateColumns(() => rollbackColumns)
      onMoveError?.(error)
    }
  }, [activePlanId, isBackendDriven, moveCard, onInboxDrop, onMoveError, updateColumns])

  const handleDragEnd = useCallback(async (event) => {
    const dragType = getDragType(event.active)
    const snapshot = dragStartSnapshotRef.current
    const dropIntent = dragCollisionStateRef.current.getDropIntent()
    const targetHint = dragTargetRef.current
    dragStartSnapshotRef.current = null
    dragPreviewSignatureRef.current = null
    dragTargetRef.current = null
    resetDragCollisionState()
    setActiveCardId(null)
    setActiveColumnId(null)
    setIsInboxDropActive(false)
    setDragOverColumnId(null)
    setGroupDropPreview(null)
    setDragPreviewCardIdsByColumn(null)

    if (dragType === DRAG_TYPE_COLUMN) {
      await handleColumnDragEnd(event, snapshot)
      return
    }

    await handleCardDragEnd(event, snapshot, dropIntent, targetHint)
  }, [handleCardDragEnd, handleColumnDragEnd, resetDragCollisionState])

  return {
    sensors,
    collisionDetection,
    activeCardId,
    activeColumnId,
    activeDragCard: activeCard,
    activeDragColumn,
    dragOverColumnId,
    groupDropPreview,
    dragPreviewCardIdsByColumn,
    isInboxDropActive,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  }
}
