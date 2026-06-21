import { useCallback, useMemo, useRef, useState } from 'react'
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import {
  findCardIndex,
  findColumnIdForItem,
  KANBAN_INBOX_DROP_ID,
  moveCardToIndex,
  reorderCardWithinColumn,
  resolveOverIndex,
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
  const columnsRef = useRef(columns)
  const dragStartSnapshotRef = useRef(null)

  columnsRef.current = columns

  const columnIds = useMemo(() => columns.map((column) => column.id), [columns])

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

    for (const column of columns) {
      const card = column.cards.find((item) => item.id === activeCardId)
      if (card) {
        return { card, columnId: column.id, columnTitle: column.title }
      }
    }

    return null
  }, [activeCardId, columns])

  const handleDragStart = useCallback(({ active }) => {
    dragStartSnapshotRef.current = columnsRef.current
    setActiveCardId(String(active.id))
    setIsInboxDropActive(false)
  }, [])

  const handleDragOver = useCallback(({ active, over }) => {
    if (!over) {
      setIsInboxDropActive(false)
      return
    }

    if (over.id === KANBAN_INBOX_DROP_ID) {
      setIsInboxDropActive(true)
      return
    }

    setIsInboxDropActive(false)

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId === overId) {
      return
    }

    const currentColumns = columnsRef.current
    const activeColumnId = findColumnIdForItem(currentColumns, activeId)
    const overColumnId = findColumnIdForItem(currentColumns, overId)

    if (!activeColumnId || !overColumnId) {
      return
    }

    const activeIndex = findCardIndex(currentColumns, activeColumnId, activeId)
    if (activeIndex === -1) {
      return
    }

    const overIndex = resolveOverIndex(currentColumns, columnIds, overId, overColumnId)
    if (overIndex === -1) {
      return
    }

    updateColumns((previousColumns) => {
      const previousActiveIndex = findCardIndex(previousColumns, activeColumnId, activeId)
      if (previousActiveIndex === -1) {
        return previousColumns
      }

      const previousOverIndex = resolveOverIndex(previousColumns, columnIds, overId, overColumnId)
      if (previousOverIndex === -1) {
        return previousColumns
      }

      if (activeColumnId === overColumnId) {
        if (previousActiveIndex === previousOverIndex) {
          return previousColumns
        }

        return reorderCardWithinColumn(
          previousColumns,
          activeColumnId,
          previousActiveIndex,
          previousOverIndex,
        )
      }

      if (
        previousColumns === currentColumns
        && previousActiveIndex === activeIndex
        && previousOverIndex === overIndex
      ) {
        const destinationColumn = previousColumns.find((column) => column.id === overColumnId)
        const alreadyPlaced = destinationColumn?.cards[overIndex]?.id === activeId
        if (alreadyPlaced) {
          return previousColumns
        }
      }

      return moveCardToIndex(
        previousColumns,
        activeId,
        activeColumnId,
        overColumnId,
        overIndex,
      )
    })
  }, [columnIds, updateColumns])

  const handleDragCancel = useCallback(() => {
    const snapshot = dragStartSnapshotRef.current
    if (snapshot) {
      updateColumns(() => snapshot)
    }

    dragStartSnapshotRef.current = null
    setActiveCardId(null)
    setIsInboxDropActive(false)
  }, [updateColumns])

  const handleDragEnd = useCallback(async ({ active, over }) => {
    const cardId = String(active.id)
    const snapshot = dragStartSnapshotRef.current
    dragStartSnapshotRef.current = null
    setActiveCardId(null)
    setIsInboxDropActive(false)

    if (!over) {
      if (snapshot) {
        updateColumns(() => snapshot)
      }
      return
    }

    if (over.id === KANBAN_INBOX_DROP_ID) {
      if (snapshot) {
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
        updateColumns(() => snapshot)
      }
      return
    }

    const targetPosition = findCardIndex(finalColumns, targetColumnId, cardId)
    if (targetPosition === -1) {
      if (snapshot) {
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
      updateColumns(() => snapshot ?? previousColumns)
      onMoveError?.(error)
    }
  }, [activePlanId, isBackendDriven, moveCard, onInboxDrop, onMoveError, updateColumns])

  return {
    sensors,
    activeCardId,
    activeDragCard: activeCard,
    isInboxDropActive,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  }
}
