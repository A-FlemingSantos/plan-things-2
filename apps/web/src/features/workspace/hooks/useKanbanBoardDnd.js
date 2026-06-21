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
  applyDragOverToColumns,
  findCardIndex,
  findColumnIdForItem,
  KANBAN_INBOX_DROP_ID,
  reorderColumnsByDrag,
} from './boardDnDUtils.js'

const DRAG_TYPE_CARD = 'card'
const DRAG_TYPE_COLUMN = 'column'

function getDragType(active) {
  return active?.data?.current?.type ?? DRAG_TYPE_CARD
}

function haveSameColumnOrder(leftColumns = [], rightColumns = []) {
  if (leftColumns.length !== rightColumns.length) {
    return false
  }

  return leftColumns.every((column, index) => column.id === rightColumns[index]?.id)
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
  const columnsRef = useRef(columns)
  const dragColumnsRef = useRef(columns)
  const dragStartSnapshotRef = useRef(null)
  const dragCollisionStateRef = useRef(createBoardDragCollisionState())

  columnsRef.current = columns

  useEffect(() => {
    if (!activeCardId && !activeColumnId) {
      dragColumnsRef.current = columns
      columnsRef.current = columns
    }
  }, [activeCardId, activeColumnId, columns])

  const columnIds = useMemo(() => columns.map((column) => column.id), [columns])

  const collisionDetection = useMemo(
    () => createBoardCollisionDetection(columnIds, dragCollisionStateRef.current),
    [columnIds],
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
    dragCollisionStateRef.current.reset()

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

  const handleColumnDragOver = useCallback(({ active, over }) => {
    if (!over) {
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)
    const { columns: nextColumns, changed } = reorderColumnsByDrag(
      dragColumnsRef.current,
      activeId,
      overId,
    )

    if (!changed) {
      return
    }

    dragColumnsRef.current = nextColumns
    columnsRef.current = nextColumns
    updateColumns(() => nextColumns)
  }, [updateColumns])

  const handleCardDragOver = useCallback(({ active, over }) => {
    const pointerColumnId = dragCollisionStateRef.current.getPointerColumnId()

    if (!over) {
      setIsInboxDropActive(false)
      setDragOverColumnId(pointerColumnId)
      return
    }

    if (over.id === KANBAN_INBOX_DROP_ID) {
      setIsInboxDropActive(true)
      setDragOverColumnId(null)
      return
    }

    setIsInboxDropActive(false)
    setDragOverColumnId(pointerColumnId)

    const activeId = String(active.id)
    const overId = String(over.id)
    const { columns: nextColumns, changed } = applyDragOverToColumns(
      dragColumnsRef.current,
      columnIds,
      activeId,
      overId,
    )

    if (!changed) {
      return
    }

    dragColumnsRef.current = nextColumns
    columnsRef.current = nextColumns
    updateColumns(() => nextColumns)
  }, [columnIds, updateColumns])

  const handleDragOver = useCallback((event) => {
    if (getDragType(event.active) === DRAG_TYPE_COLUMN) {
      handleColumnDragOver(event)
      return
    }

    handleCardDragOver(event)
  }, [handleCardDragOver, handleColumnDragOver])

  const resetDragState = useCallback(() => {
    dragStartSnapshotRef.current = null
    resetDragCollisionState()
    setActiveCardId(null)
    setActiveColumnId(null)
    setIsInboxDropActive(false)
    setDragOverColumnId(null)
  }, [resetDragCollisionState])

  const handleDragCancel = useCallback(() => {
    restoreDragSnapshot()
    resetDragState()
  }, [resetDragState, restoreDragSnapshot])

  const handleColumnDragEnd = useCallback(async (snapshot) => {
    const finalColumns = columnsRef.current
    const orderedColumnIds = finalColumns.map((column) => column.id)

    if (!activePlanId || haveSameColumnOrder(snapshot, finalColumns)) {
      return
    }

    if (!isBackendDriven) {
      return
    }

    try {
      await reorderColumns(orderedColumnIds)
    } catch (error) {
      if (snapshot) {
        dragColumnsRef.current = snapshot
        columnsRef.current = snapshot
        updateColumns(() => snapshot)
      }
      onReorderError?.(error)
    }
  }, [activePlanId, isBackendDriven, onReorderError, reorderColumns, updateColumns])

  const handleCardDragEnd = useCallback(async ({ active, over }, snapshot) => {
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
    const targetColumnId = findColumnIdForItem(finalColumns, String(over.id))

    if (!targetColumnId) {
      if (snapshot) {
        dragColumnsRef.current = snapshot
        columnsRef.current = snapshot
        updateColumns(() => snapshot)
      }
      return
    }

    const targetPosition = findCardIndex(finalColumns, targetColumnId, cardId)
    if (targetPosition === -1) {
      if (snapshot) {
        dragColumnsRef.current = snapshot
        columnsRef.current = snapshot
        updateColumns(() => snapshot)
      }
      return
    }

    const sourceColumnId = snapshot
      ? findColumnIdForItem(snapshot, cardId)
      : findColumnIdForItem(finalColumns, cardId)
    const sourcePosition = snapshot && sourceColumnId
      ? findCardIndex(snapshot, sourceColumnId, cardId)
      : -1

    const movedBetweenColumns = sourceColumnId && sourceColumnId !== targetColumnId
    const changedPosition = sourcePosition !== targetPosition

    if (!movedBetweenColumns && !changedPosition) {
      return
    }

    if (!isBackendDriven) {
      return
    }

    const previousColumns = finalColumns

    try {
      await moveCard(cardId, targetColumnId, targetPosition)
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
    dragStartSnapshotRef.current = null
    resetDragCollisionState()
    setActiveCardId(null)
    setActiveColumnId(null)
    setIsInboxDropActive(false)
    setDragOverColumnId(null)

    if (dragType === DRAG_TYPE_COLUMN) {
      await handleColumnDragEnd(snapshot)
      return
    }

    await handleCardDragEnd(event, snapshot)
  }, [handleCardDragEnd, handleColumnDragEnd, resetDragCollisionState])

  return {
    sensors,
    collisionDetection,
    activeCardId,
    activeColumnId,
    activeDragCard: activeCard,
    activeDragColumn,
    dragOverColumnId,
    isInboxDropActive,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  }
}
