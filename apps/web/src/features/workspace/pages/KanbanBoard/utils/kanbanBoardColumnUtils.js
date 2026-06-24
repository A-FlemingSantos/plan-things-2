export function insertCardInOrder(cards, nextCard) {
  const cardsWithoutCurrent = cards.filter((card) => card.id !== nextCard.id)
  const rawPosition = nextCard.position

  if (!Number.isFinite(rawPosition)) {
    return [...cardsWithoutCurrent, nextCard]
  }

  const insertionIndex = Math.max(0, Math.min(rawPosition, cardsWithoutCurrent.length))
  return [
    ...cardsWithoutCurrent.slice(0, insertionIndex),
    nextCard,
    ...cardsWithoutCurrent.slice(insertionIndex),
  ]
}

export function appendAttachmentToColumns(columns, cardId, nextAttachment) {
  if (!Array.isArray(columns) || !cardId || !nextAttachment?.id) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    let columnChanged = false
    const nextCards = column.cards.map((card) => {
      if (card.id !== cardId) {
        return card
      }

      const currentAttachments = Array.isArray(card.attachments) ? card.attachments : []
      const existingIndex = currentAttachments.findIndex((attachment) => (
        attachment.id === nextAttachment.id || attachment.fileId === nextAttachment.fileId
      ))
      const nextAttachments = existingIndex >= 0
        ? currentAttachments.map((attachment, index) => (
            index === existingIndex ? { ...attachment, ...nextAttachment } : attachment
          ))
        : [...currentAttachments, nextAttachment]

      const attachmentsChanged = nextAttachments.length !== currentAttachments.length
        || nextAttachments.some((attachment, index) => attachment !== currentAttachments[index])

      if (!attachmentsChanged) {
        return card
      }

      columnChanged = true
      hasChanges = true
      return {
        ...card,
        attachments: nextAttachments,
      }
    })

    return columnChanged ? { ...column, cards: nextCards } : column
  })

  return hasChanges ? nextColumns : columns
}

export function removeAttachmentFromColumns(columns, attachmentId) {
  if (!Array.isArray(columns) || !attachmentId) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    let columnChanged = false
    const nextCards = column.cards.map((card) => {
      const currentAttachments = Array.isArray(card.attachments) ? card.attachments : []
      const nextAttachments = currentAttachments.filter((attachment) => attachment.id !== attachmentId)
      if (nextAttachments.length === currentAttachments.length) {
        return card
      }

      columnChanged = true
      hasChanges = true
      return {
        ...card,
        attachments: nextAttachments,
      }
    })

    return columnChanged ? { ...column, cards: nextCards } : column
  })

  return hasChanges ? nextColumns : columns
}

export function replaceCardInColumns(columns, nextCard) {
  if (!Array.isArray(columns) || !nextCard?.id) {
    return columns
  }

  const inferredColumnId = nextCard.columnId
    ?? columns.find((column) => column.cards.some((card) => card.id === nextCard.id))?.id
  if (!inferredColumnId) {
    return columns
  }

  const cardForColumns = nextCard.columnId === inferredColumnId
    ? nextCard
    : { ...nextCard, columnId: inferredColumnId }
  const hasTargetColumn = columns.some((column) => column.id === inferredColumnId)
  if (!hasTargetColumn) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    const hasCard = column.cards.some((card) => card.id === nextCard.id)

    if (column.id === inferredColumnId) {
      const nextCards = hasCard
        ? column.cards.map((card) => (card.id === cardForColumns.id ? cardForColumns : card))
        : insertCardInOrder(column.cards, cardForColumns)
      const cardsChanged = nextCards.length !== column.cards.length
        || nextCards.some((card, index) => card !== column.cards[index])

      if (!cardsChanged) {
        return column
      }

      hasChanges = true
      return {
        ...column,
        cards: nextCards,
      }
    }

    if (!hasCard) {
      return column
    }

    hasChanges = true
    return {
      ...column,
      cards: column.cards.filter((card) => card.id !== nextCard.id),
    }
  })

  return hasChanges ? nextColumns : columns
}

export function removeCardFromColumns(columns, cardId) {
  if (!Array.isArray(columns) || !cardId) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    const nextCards = column.cards.filter((card) => card.id !== cardId)
    if (nextCards.length === column.cards.length) {
      return column
    }

    hasChanges = true
    return {
      ...column,
      cards: nextCards,
    }
  })

  return hasChanges ? nextColumns : columns
}

export function findCardInColumns(columns, cardId) {
  if (!Array.isArray(columns) || !cardId) {
    return null
  }

  return columns.flatMap((column) => column.cards).find((card) => card.id === cardId) ?? null
}

function normalizeCardDateLike(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.iso ?? value.text ?? ''
}

function buildCardPersistenceSignature(card) {
  if (!card) {
    return null
  }

  return JSON.stringify({
    id: card.id ?? null,
    columnId: card.columnId ?? null,
    position: Number.isFinite(card.position) ? card.position : null,
    title: card.title ?? '',
    description: card.description ?? '',
    isCompleted: Boolean(card.isCompleted),
    starred: Boolean(card.starred),
    labelId: card.labelId ?? '',
    memberIds: Array.isArray(card.memberIds) ? card.memberIds : [],
    dueDate: card.dueDate ?? '',
    startAt: normalizeCardDateLike(card.startAt),
    dueAt: normalizeCardDateLike(card.dueAt),
    comments: Array.isArray(card.comments)
      ? card.comments.map((comment) => ({
          id: comment.id ?? null,
          text: comment.text ?? '',
          kind: comment.kind ?? '',
          createdAtIso: comment.createdAtIso ?? '',
        }))
      : [],
    attachments: Array.isArray(card.attachments)
      ? card.attachments.map((attachment) => ({
          id: attachment.id ?? null,
          fileId: attachment.fileId ?? null,
          name: attachment.name ?? '',
          size: attachment.size ?? 0,
        }))
      : [],
  })
}

export function areCardsEquivalentForPersistence(leftCard, rightCard) {
  if (leftCard === rightCard) {
    return true
  }
  if (!leftCard || !rightCard) {
    return false
  }
  return buildCardPersistenceSignature(leftCard) === buildCardPersistenceSignature(rightCard)
}
