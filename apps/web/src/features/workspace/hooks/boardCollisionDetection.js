import { pointerWithin } from '@dnd-kit/core'

const CARD_TYPE = 'card'

function getContainerType(droppableContainers, id) {
  const container = droppableContainers.find((item) => item.id === id)
  return container?.data?.current?.type ?? null
}

function getCardColumnId(droppableContainers, id) {
  const container = droppableContainers.find((item) => item.id === id)
  return container?.data?.current?.columnId ?? null
}

function isPointerInsideRect(pointerCoordinates, rect) {
  if (!pointerCoordinates || !rect) {
    return false
  }

  return pointerCoordinates.x >= rect.left
    && pointerCoordinates.x <= rect.right
    && pointerCoordinates.y >= rect.top
    && pointerCoordinates.y <= rect.bottom
}

function getColumnsUnderPointer(columnIds, pointerCoordinates, droppableRects) {
  if (!pointerCoordinates) {
    return []
  }

  return columnIds.filter((columnId) => {
    const rect = droppableRects.get(columnId)
    return isPointerInsideRect(pointerCoordinates, rect)
  })
}

function pickClosestColumnByPointer(columnIds, pointerCoordinates, droppableRects) {
  let bestColumnId = columnIds[0] ?? null
  let bestDistance = Infinity

  for (const columnId of columnIds) {
    const rect = droppableRects.get(columnId)
    if (!rect) continue

    const centerX = rect.left + rect.width / 2
    const distance = Math.abs(pointerCoordinates.x - centerX)

    if (distance < bestDistance) {
      bestDistance = distance
      bestColumnId = columnId
    }
  }

  return bestColumnId
}

export function createBoardCollisionDetection(columnIds, dragState) {
  const columnIdSet = new Set(columnIds.map(String))

  return function boardCollisionDetection(args) {
    const { droppableContainers, droppableRects, pointerCoordinates } = args
    const stickyColumnId = dragState.getStickyColumnId()

    if (!stickyColumnId || !pointerCoordinates) {
      return []
    }

    const columnsUnderPointer = getColumnsUnderPointer(columnIds, pointerCoordinates, droppableRects)

    let pointerColumnId = null

    if (columnsUnderPointer.length === 1) {
      pointerColumnId = columnsUnderPointer[0]
      dragState.setStickyColumnId(pointerColumnId)
    } else if (columnsUnderPointer.length > 1) {
      pointerColumnId = pickClosestColumnByPointer(
        columnsUnderPointer,
        pointerCoordinates,
        droppableRects,
      )
      dragState.setStickyColumnId(pointerColumnId)
    }

    dragState.setPointerColumnId(pointerColumnId)

    const activeColumnId = pointerColumnId ?? stickyColumnId

    const cardPointerCollisions = pointerWithin(args).filter((collision) => {
      if (getContainerType(droppableContainers, collision.id) !== CARD_TYPE) {
        return false
      }

      return getCardColumnId(droppableContainers, collision.id) === activeColumnId
    })

    if (cardPointerCollisions.length > 0) {
      return cardPointerCollisions
    }

    if (columnIdSet.has(String(activeColumnId))) {
      return [{ id: activeColumnId }]
    }

    return []
  }
}

export function createBoardDragCollisionState() {
  let stickyColumnId = null
  let pointerColumnId = null

  return {
    getStickyColumnId: () => stickyColumnId,
    setStickyColumnId: (columnId) => {
      stickyColumnId = columnId
    },
    getPointerColumnId: () => pointerColumnId,
    setPointerColumnId: (columnId) => {
      pointerColumnId = columnId
    },
    reset: () => {
      stickyColumnId = null
      pointerColumnId = null
    },
  }
}
