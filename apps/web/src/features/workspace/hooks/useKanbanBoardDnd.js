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
} from './boardDnDUtils.js'

export function useKanbanBoardDnd({
  activePlanId,
  columns = [],
  updateColumns,
  moveCard,
  isBackendDriven = false,
  onMoveError,
  onInboxDrop,
}) {
  const [activeCardId, setActiveCardId] = useState(null)
  const [isInboxDropActive, setIsInboxDropActive] = useState(false)
  const [dragOverColumnId, setDragOverColumnId] = useState(null)
  const columnsRef = useRef(columns)
  const dragColumnsRef = useRef(columns)
  const dragStartSnapshotRef = useRef(null)
  const dragCollisionStateRef = useRef(createBoardDragCollisionState())

  columnsRef.current = columns

  useEffect(() => {
    if (!activeCardId) {
      dragColumnsRef.current = columns
      columnsRef.current = columns
    }
  }, [activeCardId, columns])

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

  const resetDragCollisionState = useCallback(() => {
    dragCollisionStateRef.current.reset()
  }, [])

  const handleDragStart = useCallback(({ active }) => {
    const sourceColumnId = findColumnIdForItem(columnsRef.current, String(active.id))

    dragStartSnapshotRef.current = columnsRef.current
    dragColumnsRef.current = columnsRef.current
    dragCollisionStateRef.current.reset()

    if (sourceColumnId) {
      dragCollisionStateRef.current.setStickyColumnId(sourceColumnId)
      dragCollisionStateRef.current.setPointerColumnId(sourceColumnId)
    }

    setActiveCardId(String(active.id))
    setIsInboxDropActive(false)
    setDragOverColumnId(sourceColumnId)
  }, [])

  const handleDragOver = useCallback(({ active, over }) => {
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

  const handleDragCancel = useCallback(() => {
    const snapshot = dragStartSnapshotRef.current
    if (snapshot) {
      dragColumnsRef.current = snapshot
      columnsRef.current = snapshot
      updateColumns(() => snapshot)
    }

    dragStartSnapshotRef.current = null
    resetDragCollisionState()
    setActiveCardId(null)
    setIsInboxDropActive(false)
    setDragOverColumnId(null)
  }, [resetDragCollisionState, updateColumns])

  const handleDragEnd = useCallback(async ({ active, over }) => {
    const cardId = String(active.id)
    const snapshot = dragStartSnapshotRef.current
    dragStartSnapshotRef.current = null
    resetDragCollisionState()
    setActiveCardId(null)
    setIsInboxDropActive(false)
    setDragOverColumnId(null)

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
  }, [activePlanId, isBackendDriven, moveCard, onInboxDrop, onMoveError, resetDragCollisionState, updateColumns])

  return {
    sensors,
    collisionDetection,
    activeCardId,
    activeDragCard: activeCard,
    dragOverColumnId,
    isInboxDropActive,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  }
}
