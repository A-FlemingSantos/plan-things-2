import { pointerWithin } from '@dnd-kit/core'
import { columnCardStackDropId } from './boardDnDUtils.js'

const CARD_TYPE = 'card'

function getContainerType(droppableContainers, id) {
  const container = droppableContainers.find((item) => item.id === id)
  return container?.data?.current?.type ?? null
}

function getCardColumnId(droppableContainers, id) {
  const container = droppableContainers.find((item) => item.id === id)
  return container?.data?.current?.columnId ?? null
}

function isPointerInsideColumnHorizontally(pointerX, rect) {
  return pointerX >= rect.left && pointerX <= rect.right
}

function getColumnsByPointerX(columnIds, pointerX, droppableRects) {
  return columnIds.filter((columnId) => {
    const rect = droppableRects.get(columnId)
    return rect && isPointerInsideColumnHorizontally(pointerX, rect)
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

function isPointerBelowCardStack(pointerY, columnId, droppableRects) {
  const cardStackRect = droppableRects.get(columnCardStackDropId(columnId))
  if (!cardStackRect) {
    return false
  }

  return pointerY > cardStackRect.bottom
}

function pickClosestCardCollisionInColumn(
  columnId,
  pointerCoordinates,
  droppableContainers,
  droppableRects,
) {
  if (!pointerCoordinates) {
    return []
  }

  let bestCollision = null
  let bestDistance = Infinity

  for (const container of droppableContainers) {
    if (getContainerType(droppableContainers, container.id) !== CARD_TYPE) {
      continue
    }

    if (getCardColumnId(droppableContainers, container.id) !== columnId) {
      continue
    }

    const rect = droppableRects.get(container.id)
    if (!rect) {
      continue
    }

    const centerY = rect.top + rect.height / 2
    const distance = Math.abs(pointerCoordinates.y - centerY)

    if (distance < bestDistance) {
      bestDistance = distance
      bestCollision = { id: container.id }
    }
  }

  return bestCollision ? [bestCollision] : []
}

export function createBoardCollisionDetection(columnIds, dragState) {
  const columnIdSet = new Set(columnIds.map(String))

  return function boardCollisionDetection(args) {
    const { droppableContainers, droppableRects, pointerCoordinates } = args
    const stickyColumnId = dragState.getStickyColumnId()

    if (!stickyColumnId || !pointerCoordinates) {
      return []
    }

    const columnsUnderPointerX = getColumnsByPointerX(
      columnIds,
      pointerCoordinates.x,
      droppableRects,
    )

    let pointerColumnId = null

    if (columnsUnderPointerX.length === 1) {
      pointerColumnId = columnsUnderPointerX[0]
      dragState.setStickyColumnId(pointerColumnId)
    } else if (columnsUnderPointerX.length > 1) {
      pointerColumnId = pickClosestColumnByPointer(
        columnsUnderPointerX,
        pointerCoordinates,
        droppableRects,
      )
      dragState.setStickyColumnId(pointerColumnId)
    }

    const activeColumnId = pointerColumnId ?? stickyColumnId
    const isBelowActiveCardStack = isPointerBelowCardStack(
      pointerCoordinates.y,
      activeColumnId,
      droppableRects,
    )

    dragState.setPointerColumnId(
      pointerColumnId && isPointerBelowCardStack(pointerCoordinates.y, pointerColumnId, droppableRects)
        ? pointerColumnId
        : null,
    )

    const cardPointerCollisions = pointerWithin(args).filter((collision) => {
      if (getContainerType(droppableContainers, collision.id) !== CARD_TYPE) {
        return false
      }

      return getCardColumnId(droppableContainers, collision.id) === activeColumnId
    })

    if (cardPointerCollisions.length > 0) {
      return cardPointerCollisions
    }

    if (!isBelowActiveCardStack) {
      return pickClosestCardCollisionInColumn(
        activeColumnId,
        pointerCoordinates,
        droppableContainers,
        droppableRects,
      )
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
