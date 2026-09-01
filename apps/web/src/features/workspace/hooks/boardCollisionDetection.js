import { closestCenter, closestCorners, pointerWithin } from '@dnd-kit/core'
import { columnCardStackDropId, KANBAN_INBOX_DROP_ID } from './boardDnDUtils.js'

const CARD_TYPE = 'card'
const COLUMN_TYPE = 'column'
const INBOX_TYPE = 'inbox'
const GROUP_BEFORE_TYPE = 'group-before'

function getContainerType(droppableContainers, id) {
  const container = droppableContainers.find((item) => item.id === id)
  return container?.data?.current?.type ?? null
}

function getCardColumnId(droppableContainers, id) {
  const container = droppableContainers.find((item) => item.id === id)
  return container?.data?.current?.columnId ?? null
}

function getContainerData(droppableContainers, id) {
  return droppableContainers.find((item) => item.id === id)?.data?.current ?? null
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
  activeId,
) {
  if (!pointerCoordinates) {
    return []
  }

  let bestCollision = null
  let bestDistance = Infinity

  for (const container of droppableContainers) {
    if (String(container.id) === String(activeId)) {
      continue
    }
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

function getPointerX(args) {
  if (Number.isFinite(args.pointerCoordinates?.x)) {
    return args.pointerCoordinates.x
  }

  const rect = args.collisionRect
  if (rect && Number.isFinite(rect.left) && Number.isFinite(rect.width)) {
    return rect.left + rect.width / 2
  }

  return null
}

export function pickHorizontalColumnOverId(pointerX, columnRects, activeId) {
  if (pointerX == null || columnRects.length === 0) {
    return null
  }

  const sorted = [...columnRects].sort((left, right) => left.left - right.left)
  const activeKey = activeId == null ? null : String(activeId)
  const others = sorted.filter((column) => String(column.id) !== activeKey)

  let insertIndex = 0
  for (const column of others) {
    const centerX = column.left + column.width / 2
    if (pointerX > centerX) {
      insertIndex += 1
    }
  }

  return String((sorted[insertIndex] ?? sorted[sorted.length - 1]).id)
}

function getColumnCollisions(args) {
  const columnRects = []

  for (const container of args.droppableContainers) {
    if (getContainerType(args.droppableContainers, container.id) !== COLUMN_TYPE) {
      continue
    }

    const rect = args.droppableRects.get(container.id)
    if (!rect) {
      continue
    }

    columnRects.push({
      id: container.id,
      left: rect.left,
      width: rect.width,
    })
  }

  if (columnRects.length === 0) {
    return []
  }

  const pointerX = getPointerX(args)
  if (pointerX == null) {
    const columnContainers = args.droppableContainers.filter((container) => (
      getContainerType(args.droppableContainers, container.id) === COLUMN_TYPE
    ))

    return closestCenter({
      ...args,
      droppableContainers: columnContainers,
    })
  }

  const overId = pickHorizontalColumnOverId(pointerX, columnRects, args.active?.id)
  return overId ? [{ id: overId }] : []
}

export function createBoardCollisionDetection(columnIds, dragState) {
  const resolveColumnIds = () => (
    typeof columnIds === 'function' ? columnIds() : columnIds
  )

  return function boardCollisionDetection(args) {
    const activeType = args.active?.data?.current?.type

    if (activeType === COLUMN_TYPE) {
      return getColumnCollisions(args)
    }

    const resolvedColumnIds = resolveColumnIds()
    const columnIdSet = new Set(resolvedColumnIds.map(String))

    const { droppableContainers, droppableRects, pointerCoordinates } = args
    const stickyColumnId = dragState.getStickyColumnId()

    if (!stickyColumnId) {
      return []
    }

    if (!pointerCoordinates) {
      return closestCorners(args)
    }

    const pointerCollisions = pointerWithin(args)
    const inboxCollision = pointerCollisions.find((collision) => {
      const type = getContainerType(droppableContainers, collision.id)
      return type === INBOX_TYPE || String(collision.id) === KANBAN_INBOX_DROP_ID
    })
    if (inboxCollision) {
      dragState.setPointerColumnId(null)
      dragState.setDropIntent(null)
      return [inboxCollision]
    }

    const columnsUnderPointerX = getColumnsByPointerX(
      resolvedColumnIds,
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

    const groupBeforeCollision = pointerCollisions.find((collision) => {
      const data = getContainerData(droppableContainers, collision.id)
      return data?.type === GROUP_BEFORE_TYPE && data.columnId === activeColumnId
    })
    if (groupBeforeCollision) {
      const data = getContainerData(droppableContainers, groupBeforeCollision.id)
      dragState.setDropIntent({
        targetGroupId: null,
        beforeGroupId: String(data.groupId),
        kind: 'before-group',
      })
      return [groupBeforeCollision]
    }

    if (!isBelowActiveCardStack) {
      const cardCollision = pickClosestCardCollisionInColumn(
        activeColumnId,
        pointerCoordinates,
        droppableContainers,
        droppableRects,
        args.active?.id,
      )
      const collision = cardCollision[0]
      if (collision) {
        const data = getContainerData(droppableContainers, collision.id)
        const rect = droppableRects.get(collision.id)
        const isBeforeFirstMember = Boolean(
          data?.groupId
          && data?.isFirstGroupCard
          && rect
          && pointerCoordinates.y <= rect.top + rect.height / 2
        )
        const isAboveFirstMember = Boolean(
          data?.groupId
          && data?.isFirstGroupCard
          && rect
          && pointerCoordinates.y < rect.top
        )
        const isBelowLastMember = Boolean(
          data?.groupId
          && data?.isLastGroupCard
          && rect
          && pointerCoordinates.y > rect.bottom
        )
        const isReorderingWithinSameGroup = Boolean(
          data?.groupId
          && String(args.active?.data?.current?.groupId) === String(data.groupId)
          && !isAboveFirstMember
          && !isBelowLastMember
        )
        const isLeavingOwnGroup = Boolean(
          isBelowLastMember
          && String(args.active?.data?.current?.groupId) === String(data.groupId)
        )
        if (
          data?.groupId
          && !isLeavingOwnGroup
          && (!isBeforeFirstMember || isReorderingWithinSameGroup)
        ) {
          dragState.setDropIntent({ targetGroupId: String(data.groupId), kind: 'group-interior' })
        } else {
          dragState.setDropIntent({
            targetGroupId: null,
            beforeGroupId: isBeforeFirstMember ? String(data.groupId) : null,
            kind: isBeforeFirstMember ? 'before-group' : 'loose-card',
          })
        }
      } else {
        dragState.setDropIntent(null)
      }
      return cardCollision
    }

    if (columnIdSet.has(String(activeColumnId))) {
      dragState.setDropIntent({ targetGroupId: null, kind: 'column-end' })
      return [{ id: activeColumnId }]
    }

    dragState.setDropIntent(null)
    return []
  }
}

export function createBoardDragCollisionState() {
  let stickyColumnId = null
  let pointerColumnId = null
  let dropIntent = null

  return {
    getStickyColumnId: () => stickyColumnId,
    setStickyColumnId: (columnId) => {
      stickyColumnId = columnId
    },
    getPointerColumnId: () => pointerColumnId,
    setPointerColumnId: (columnId) => {
      pointerColumnId = columnId
    },
    getDropIntent: () => dropIntent,
    setDropIntent: (nextDropIntent) => {
      dropIntent = nextDropIntent
    },
    reset: () => {
      stickyColumnId = null
      pointerColumnId = null
      dropIntent = null
    },
  }
}
