import { useCallback, useMemo } from 'react'
import { ApiClientError, apiRequest } from '../../../shared/api/apiClient.js'
import { buildBoardCardPayload, mapBoardCard } from '../../../shared/contracts/backendAdapters.js'

const uid = () => Math.random().toString(36).slice(2, 9)

function mapBoardComment(comment) {
  const author = comment.author ?? null

  return {
    id: comment.id,
    author: comment.authorName,
    authorId: author?.id ?? null,
    authorName: comment.authorName,
    authorAvatarUrl: author?.avatarUrl ?? null,
    text: comment.message,
    time: comment.createdAt?.text ?? 'Agora',
  }
}

function insertCardInOrder(cards, nextCard) {
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

function replaceCardInColumns(columns, nextCard) {
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

function appendCommentToCard(columns, cardId, nextComment) {
  if (!Array.isArray(columns) || !cardId || !nextComment?.id) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    let columnChanged = false

    const nextCards = column.cards.map((card) => {
      if (card.id !== cardId) {
        return card
      }

      if (card.comments.some((comment) => comment.id === nextComment.id)) {
        return card
      }

      columnChanged = true
      hasChanges = true
      return {
        ...card,
        comments: [...card.comments, nextComment],
      }
    })

    return columnChanged ? { ...column, cards: nextCards } : column
  })

  return hasChanges ? nextColumns : columns
}

function insertCardIntoColumn(columns, targetColumnId, nextCard) {
  if (!Array.isArray(columns) || !targetColumnId || !nextCard?.id) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    if (column.id === targetColumnId) {
      hasChanges = true
      return {
        ...column,
        cards: insertCardInOrder(column.cards, nextCard),
      }
    }

    const nextCards = column.cards.filter((card) => card.id !== nextCard.id)
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

function removeCardFromColumns(columns, cardId) {
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

function removeColumnFromColumns(columns, columnId) {
  if (!Array.isArray(columns) || !columnId) {
    return columns
  }

  return columns.filter((column) => column.id !== columnId)
}

function findColumnById(columns, columnId) {
  if (!Array.isArray(columns) || !columnId) {
    return null
  }

  return columns.find((column) => column.id === columnId) ?? null
}

function replaceColumnById(columns, columnId, nextColumn) {
  if (!Array.isArray(columns) || !columnId || !nextColumn) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    if (column.id !== columnId) {
      return column
    }

    const normalizedColumn = nextColumn.id === columnId
      ? nextColumn
      : { ...nextColumn, cards: Array.isArray(nextColumn.cards) ? nextColumn.cards : column.cards }

    const columnChanged = normalizedColumn !== column
      && (
        normalizedColumn.id !== column.id
        || normalizedColumn.title !== column.title
        || normalizedColumn.color !== column.color
        || normalizedColumn.cards !== column.cards
      )

    if (!columnChanged) {
      return column
    }

    hasChanges = true
    return normalizedColumn
  })

  return hasChanges ? nextColumns : columns
}

function replaceChecklistInCard(card, nextChecklist) {
  if (!card || !nextChecklist?.id) {
    return card
  }

  const currentChecklists = Array.isArray(card.checklists) ? card.checklists : []
  const existingChecklistIndex = currentChecklists.findIndex((checklist) => checklist.id === nextChecklist.id)
  const nextChecklists = existingChecklistIndex >= 0
    ? currentChecklists.map((checklist) => (checklist.id === nextChecklist.id ? nextChecklist : checklist))
    : [...currentChecklists, nextChecklist]

  return {
    ...card,
    checklists: nextChecklists,
  }
}

function addChecklistToCard(columns, cardId, nextChecklist) {
  if (!Array.isArray(columns) || !cardId || !nextChecklist?.id) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    let columnChanged = false

    const nextCards = column.cards.map((card) => {
      if (card.id !== cardId) {
        return card
      }

      const nextCard = replaceChecklistInCard(card, nextChecklist)
      if (nextCard !== card) {
        columnChanged = true
        hasChanges = true
      }
      return nextCard
    })

    return columnChanged ? { ...column, cards: nextCards } : column
  })

  return hasChanges ? nextColumns : columns
}

function replaceChecklistByIdInColumns(columns, checklistId, nextChecklist) {
  if (!Array.isArray(columns) || !checklistId || !nextChecklist?.id) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    let columnChanged = false

    const nextCards = column.cards.map((card) => {
      let cardChanged = false
      const currentChecklists = Array.isArray(card.checklists) ? card.checklists : []
      const nextChecklists = currentChecklists.map((checklist) => {
        if (checklist.id !== checklistId) {
          return checklist
        }

        cardChanged = true
        columnChanged = true
        hasChanges = true
        return nextChecklist
      })

      return cardChanged
        ? {
            ...card,
            checklists: nextChecklists,
          }
        : card
    })

    return columnChanged ? { ...column, cards: nextCards } : column
  })

  return hasChanges ? nextColumns : columns
}

function replaceCardByIdInColumns(columns, cardId, nextCard) {
  if (!Array.isArray(columns) || !cardId || !nextCard?.id) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    let columnChanged = false

    const nextCards = column.cards.map((card) => {
      if (card.id !== cardId) {
        return card
      }

      columnChanged = true
      hasChanges = true
      return nextCard
    })

    return columnChanged ? { ...column, cards: nextCards } : column
  })

  return hasChanges ? nextColumns : columns
}

function removeChecklistFromColumns(columns, checklistId) {
  if (!Array.isArray(columns) || !checklistId) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    let columnChanged = false

    const nextCards = column.cards.map((card) => {
      const currentChecklists = Array.isArray(card.checklists) ? card.checklists : []
      const nextChecklists = currentChecklists.filter((checklist) => checklist.id !== checklistId)
      if (nextChecklists.length === currentChecklists.length) {
        return card
      }

      columnChanged = true
      hasChanges = true
      return {
        ...card,
        checklists: nextChecklists,
      }
    })

    return columnChanged ? { ...column, cards: nextCards } : column
  })

  return hasChanges ? nextColumns : columns
}

function appendChecklistItemToColumns(columns, checklistId, nextItem) {
  if (!Array.isArray(columns) || !checklistId || !nextItem?.id) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    let columnChanged = false

    const nextCards = column.cards.map((card) => {
      let cardChanged = false
      const nextChecklists = (Array.isArray(card.checklists) ? card.checklists : []).map((checklist) => {
        if (checklist.id !== checklistId) {
          return checklist
        }

        cardChanged = true
        hasChanges = true
        return {
          ...checklist,
          items: [...(Array.isArray(checklist.items) ? checklist.items : []), nextItem],
        }
      })

      if (!cardChanged) {
        return card
      }

      columnChanged = true
      return {
        ...card,
        checklists: nextChecklists,
      }
    })

    return columnChanged ? { ...column, cards: nextCards } : column
  })

  return hasChanges ? nextColumns : columns
}

function replaceChecklistItemInColumns(columns, nextItem) {
  if (!Array.isArray(columns) || !nextItem?.id) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    let columnChanged = false

    const nextCards = column.cards.map((card) => {
      let cardChanged = false
      const nextChecklists = (Array.isArray(card.checklists) ? card.checklists : []).map((checklist) => {
        let checklistChanged = false
        const nextItems = (Array.isArray(checklist.items) ? checklist.items : []).map((item) => {
          if (item.id !== nextItem.id) {
            return item
          }

          checklistChanged = true
          cardChanged = true
          columnChanged = true
          hasChanges = true
          return nextItem
        })

        return checklistChanged
          ? {
              ...checklist,
              items: nextItems,
            }
          : checklist
      })

      return cardChanged
        ? {
            ...card,
            checklists: nextChecklists,
          }
        : card
    })

    return columnChanged ? { ...column, cards: nextCards } : column
  })

  return hasChanges ? nextColumns : columns
}

function replaceChecklistItemByIdInColumns(columns, itemId, nextItem) {
  if (!Array.isArray(columns) || !itemId || !nextItem?.id) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    let columnChanged = false

    const nextCards = column.cards.map((card) => {
      let cardChanged = false
      const nextChecklists = (Array.isArray(card.checklists) ? card.checklists : []).map((checklist) => {
        let checklistChanged = false
        const nextItems = (Array.isArray(checklist.items) ? checklist.items : []).map((item) => {
          if (item.id !== itemId) {
            return item
          }

          checklistChanged = true
          cardChanged = true
          columnChanged = true
          hasChanges = true
          return nextItem
        })

        return checklistChanged
          ? {
              ...checklist,
              items: nextItems,
            }
          : checklist
      })

      return cardChanged
        ? {
            ...card,
            checklists: nextChecklists,
          }
        : card
    })

    return columnChanged ? { ...column, cards: nextCards } : column
  })

  return hasChanges ? nextColumns : columns
}

export function useBoardColumns({
  activePlanId,
  boardColumns,
  updatePlanBoard,
  isBackendDriven = false,
  accessToken = null,
  applyBoardView,
  loadPlanBoard,
  timeZone = 'America/Sao_Paulo',
  dateFormat = 'dd/MM/yyyy',
}) {
  const columns = boardColumns ?? []

  const updateColumns = useCallback((updater) => {
    if (!activePlanId) return
    updatePlanBoard(activePlanId, updater)
  }, [activePlanId, updatePlanBoard])

  const createColumn = useCallback(async (title) => {
    const nextTitle = title.trim()

    if (!nextTitle || !activePlanId) {
      return false
    }

    if (!isBackendDriven) {
      updateColumns((prev) => [
        ...prev,
        { id: uid(), title: nextTitle, color: '', cards: [] },
      ])
      return true
    }

    const previousColumns = columns
    const previousColumnIds = new Set(previousColumns.map((column) => column.id))
    const optimisticColumn = {
      id: `temp-column-${uid()}`,
      title: nextTitle,
      color: '',
      cards: [],
    }

    updateColumns((prev) => [...prev, optimisticColumn])

    try {
      const boardView = await apiRequest(`/api/plans/${activePlanId}/board/columns`, {
        method: 'POST',
        token: accessToken,
        body: {
          title: nextTitle,
          color: '',
        },
      })

      const persistedColumnView = Array.isArray(boardView?.columns)
        ? (
            boardView.columns.find((column) => !previousColumnIds.has(column.id))
            ?? boardView.columns.find((column) => (
              (column.title ?? '').trim() === nextTitle
              && (column.color ?? '') === ''
            ))
          )
        : null

      if (persistedColumnView?.id) {
        updateColumns((prev) => replaceColumnById(prev, optimisticColumn.id, {
          id: persistedColumnView.id,
          title: persistedColumnView.title ?? optimisticColumn.title,
          color: persistedColumnView.color ?? optimisticColumn.color,
          cards: [],
        }))
      } else {
        applyBoardView(activePlanId, boardView)
      }

      return true
    } catch (error) {
      updateColumns(() => previousColumns)
      throw error
    }
  }, [accessToken, activePlanId, applyBoardView, columns, isBackendDriven, updateColumns])

  const deleteColumn = useCallback(async (colId) => {
    if (!activePlanId) return

    if (!isBackendDriven) {
      updateColumns((prev) => removeColumnFromColumns(prev, colId))
      return
    }

    const previousColumns = columns
    updateColumns((prev) => removeColumnFromColumns(prev, colId))

    try {
      await apiRequest(`/api/plans/${activePlanId}/board/columns/${colId}`, {
        method: 'DELETE',
        token: accessToken,
      })
    } catch (error) {
      updateColumns(() => previousColumns)
      throw error
    }
  }, [accessToken, activePlanId, columns, isBackendDriven, updateColumns])

  const renameColumn = useCallback(async (colId, title) => {
    if (!activePlanId) return

    if (!isBackendDriven) {
      updateColumns((prev) => prev.map((column) => (
        column.id === colId ? { ...column, title } : column
      )))
      return true
    }

    const previousColumns = columns
    const currentColumn = findColumnById(previousColumns, colId)
    const nextTitle = title.trim()

    updateColumns((prev) => replaceColumnById(prev, colId, {
      ...(findColumnById(prev, colId) ?? currentColumn),
      id: colId,
      title: nextTitle,
      color: currentColumn?.color ?? '',
      cards: findColumnById(prev, colId)?.cards ?? currentColumn?.cards ?? [],
    }))

    try {
      const boardView = await apiRequest(`/api/plans/${activePlanId}/board/columns/${colId}`, {
        method: 'PATCH',
        token: accessToken,
        body: {
          title: nextTitle,
          color: currentColumn?.color ?? '',
        },
      })

      const persistedColumnView = Array.isArray(boardView?.columns)
        ? boardView.columns.find((column) => column.id === colId)
        : null

      if (persistedColumnView) {
        updateColumns((prev) => replaceColumnById(prev, colId, {
          ...(findColumnById(prev, colId) ?? currentColumn),
          id: persistedColumnView.id,
          title: persistedColumnView.title ?? nextTitle,
          color: persistedColumnView.color ?? currentColumn?.color ?? '',
          cards: findColumnById(prev, colId)?.cards ?? currentColumn?.cards ?? [],
        }))
      } else {
        applyBoardView(activePlanId, boardView)
      }

      return true
    } catch (error) {
      updateColumns(() => previousColumns)
      throw error
    }
  }, [accessToken, activePlanId, applyBoardView, columns, isBackendDriven, updateColumns])

  const changeColColor = useCallback(async (colId, color) => {
    if (!activePlanId) return

    if (!isBackendDriven) {
      updateColumns((prev) => prev.map((column) => (
        column.id === colId ? { ...column, color } : column
      )))
      return
    }

    const previousColumns = columns
    const currentColumn = findColumnById(previousColumns, colId)

    updateColumns((prev) => replaceColumnById(prev, colId, {
      ...(findColumnById(prev, colId) ?? currentColumn),
      id: colId,
      title: currentColumn?.title ?? findColumnById(prev, colId)?.title ?? 'Nova coluna',
      color,
      cards: findColumnById(prev, colId)?.cards ?? currentColumn?.cards ?? [],
    }))

    try {
      const boardView = await apiRequest(`/api/plans/${activePlanId}/board/columns/${colId}`, {
        method: 'PATCH',
        token: accessToken,
        body: {
          title: currentColumn?.title ?? 'Nova coluna',
          color,
        },
      })

      const persistedColumnView = Array.isArray(boardView?.columns)
        ? boardView.columns.find((column) => column.id === colId)
        : null

      if (persistedColumnView) {
        updateColumns((prev) => replaceColumnById(prev, colId, {
          ...(findColumnById(prev, colId) ?? currentColumn),
          id: persistedColumnView.id,
          title: persistedColumnView.title ?? currentColumn?.title ?? 'Nova coluna',
          color: persistedColumnView.color ?? color,
          cards: findColumnById(prev, colId)?.cards ?? currentColumn?.cards ?? [],
        }))
      } else {
        applyBoardView(activePlanId, boardView)
      }
    } catch (error) {
      updateColumns(() => previousColumns)
      throw error
    }
  }, [accessToken, activePlanId, applyBoardView, columns, isBackendDriven, updateColumns])

  const addCard = useCallback(async (colId, title) => {
    if (!activePlanId) return

    if (!isBackendDriven) {
      const card = {
        id: uid(),
        columnId: colId,
        title,
        description: '',
        isCompleted: false,
        labelId: null,
        memberIds: [],
        dueDate: '',
        comments: [],
      }

      updateColumns((prev) => prev.map((column) => (
        column.id === colId ? { ...column, cards: [...column.cards, card] } : column
      )))
      return true
    }

    const previousColumns = columns
    const targetColumn = findColumnById(previousColumns, colId)
    const optimisticCard = {
      id: `temp-card-${uid()}`,
      columnId: colId,
      position: targetColumn?.cards?.length ?? 0,
      title,
      description: '',
      isCompleted: false,
      starred: false,
      labelId: null,
      memberIds: [],
      dueDate: '',
      startAt: null,
      dueAt: null,
      comments: [],
      attachments: [],
      checklists: [],
      kind: 'CARTAO',
      schedule: {
        selectedCalendarDay: 7,
        startEnabled: false,
        startDateValue: '',
        dueEnabled: false,
        dueDateValue: '',
        dueTimeValue: '',
        displayLabel: '',
        preserveDisplayLabel: false,
      },
    }

    updateColumns((prev) => insertCardIntoColumn(prev, colId, optimisticCard))

    try {
      const createdCardView = await apiRequest(`/api/plans/${activePlanId}/board/cards`, {
        method: 'POST',
        token: accessToken,
        body: {
          columnId: colId,
          title,
          description: '',
          labelId: null,
          assigneeIds: [],
          startAt: null,
          dueAt: null,
        },
      })

      const createdCard = mapBoardCard(createdCardView, {
        timeZone,
        dateFormat,
      })

      updateColumns((prev) => replaceCardByIdInColumns(prev, optimisticCard.id, createdCard))
      return createdCard
    } catch (error) {
      updateColumns(() => previousColumns)
      throw error
    }
  }, [accessToken, activePlanId, columns, dateFormat, isBackendDriven, timeZone, updateColumns])

  const updateCard = useCallback(async (updatedCard) => {
    if (!activePlanId) return false

    if (!isBackendDriven) {
      updateColumns((prev) => replaceCardInColumns(prev, updatedCard))
      return updatedCard
    }

    const previousCard = columns.flatMap((column) => column.cards).find((card) => card.id === updatedCard.id)
    const previousCommentIds = new Set(previousCard?.comments?.map((comment) => comment.id) ?? [])
    const newComments = (updatedCard.comments ?? []).filter((comment) => !previousCommentIds.has(comment.id))
    let persistedCard = null

    try {
      const cardView = await apiRequest(`/api/plans/${activePlanId}/board/cards/${updatedCard.id}`, {
        method: 'PATCH',
        token: accessToken,
        body: buildBoardCardPayload(updatedCard, {
          timeZone,
          dateFormat,
        }),
      })
      persistedCard = mapBoardCard(cardView, {
        timeZone,
        dateFormat,
      })

      updateColumns((prev) => replaceCardInColumns(prev, persistedCard))

      if (newComments.length) {
        const createdComments = []

        for (const comment of newComments) {
          const createdComment = await apiRequest(
            `/api/plans/${activePlanId}/board/cards/${updatedCard.id}/comments`,
            {
              method: 'POST',
              token: accessToken,
              body: {
                message: comment.text,
              },
            },
          )

          const mappedComment = mapBoardComment(createdComment)
          createdComments.push(mappedComment)
          updateColumns((prev) => appendCommentToCard(prev, updatedCard.id, mappedComment))
        }

        if (createdComments.length) {
          persistedCard = {
            ...persistedCard,
            comments: [...persistedCard.comments, ...createdComments],
          }
        }
      }

      return persistedCard
    } catch (error) {
      if (persistedCard) {
        throw new ApiClientError(
          'Os dados do cartão foram salvos, mas não foi possível concluir o envio dos comentários.',
          {
            code: 'ATUALIZACAO_PARCIAL_CARTAO',
            status: error?.status ?? 500,
          },
        )
      }

      throw error
    }
  }, [accessToken, activePlanId, columns, dateFormat, isBackendDriven, timeZone, updateColumns])

  const deleteCard = useCallback(async (cardId) => {
    if (!activePlanId) return false

    if (!isBackendDriven) {
      updateColumns((prev) => removeCardFromColumns(prev, cardId))
      return true
    }

    const previousColumns = columns
    updateColumns((prev) => removeCardFromColumns(prev, cardId))

    try {
      await apiRequest(`/api/plans/${activePlanId}/board/cards/${cardId}`, {
        method: 'DELETE',
        token: accessToken,
      })
      return true
    } catch (error) {
      updateColumns(() => previousColumns)
      throw error
    }
  }, [accessToken, activePlanId, columns, isBackendDriven, updateColumns])

  const addCardComment = useCallback(async (cardId, message) => {
    if (!activePlanId || !isBackendDriven) return null

    const createdComment = await apiRequest(`/api/plans/${activePlanId}/board/cards/${cardId}/comments`, {
      method: 'POST',
      token: accessToken,
      body: {
        message,
      },
    })

    const mappedComment = mapBoardComment(createdComment)
    updateColumns((prev) => appendCommentToCard(prev, cardId, mappedComment))
    return mappedComment
  }, [accessToken, activePlanId, isBackendDriven, updateColumns])

  const moveCard = useCallback(async (cardId, targetColumnId, targetPosition) => {
    if (!activePlanId) return

    if (!isBackendDriven) {
      return
    }

    const boardView = await apiRequest(`/api/plans/${activePlanId}/board/cards/${cardId}/move`, {
      method: 'PUT',
      token: accessToken,
      body: {
        targetColumnId,
        targetPosition,
      },
    })

    applyBoardView(activePlanId, boardView)
    return true
  }, [accessToken, activePlanId, applyBoardView, isBackendDriven])

  const createChecklist = useCallback(async (cardId, title) => {
    if (!activePlanId || !isBackendDriven) return null

    const previousColumns = columns
    const optimisticChecklist = {
      id: `temp-checklist-${uid()}`,
      title,
      position: 0,
      items: [],
    }

    updateColumns((prev) => addChecklistToCard(prev, cardId, optimisticChecklist))

    try {
      const checklist = await apiRequest(`/api/plans/${activePlanId}/board/cards/${cardId}/checklists`, {
        method: 'POST',
        token: accessToken,
        body: {
          title,
        },
      })

      updateColumns((prev) => replaceChecklistByIdInColumns(prev, optimisticChecklist.id, checklist))
      return checklist
    } catch (error) {
      updateColumns(() => previousColumns)
      throw error
    }
  }, [accessToken, activePlanId, columns, isBackendDriven, updateColumns])

  const deleteChecklist = useCallback(async (checklistId) => {
    if (!activePlanId || !isBackendDriven) return false

    const previousColumns = columns
    updateColumns((prev) => removeChecklistFromColumns(prev, checklistId))

    try {
      await apiRequest(`/api/plans/${activePlanId}/board/checklists/${checklistId}`, {
        method: 'DELETE',
        token: accessToken,
      })

      return true
    } catch (error) {
      updateColumns(() => previousColumns)
      throw error
    }
  }, [accessToken, activePlanId, columns, isBackendDriven, updateColumns])

  const createChecklistItem = useCallback(async (checklistId, item) => {
    if (!activePlanId || !isBackendDriven) return null

    const previousColumns = columns
    const optimisticItem = {
      id: `temp-checklist-item-${uid()}`,
      title: item.title ?? item.text ?? '',
      text: item.title ?? item.text ?? '',
      completed: false,
      checked: false,
      assigneeUserId: item.assigneeUserId ?? null,
      assignee: null,
      startAt: item.startAt ?? null,
      dueAt: item.dueAt ?? null,
      position: 0,
    }

    updateColumns((prev) => appendChecklistItemToColumns(prev, checklistId, optimisticItem))

    try {
      const createdItem = await apiRequest(`/api/plans/${activePlanId}/board/checklists/${checklistId}/items`, {
        method: 'POST',
        token: accessToken,
        body: {
          title: item.title ?? item.text ?? '',
          assigneeUserId: item.assigneeUserId ?? null,
          startAt: item.startAt ?? null,
          dueAt: item.dueAt ?? null,
        },
      })

      updateColumns((prev) => replaceChecklistItemByIdInColumns(prev, optimisticItem.id, createdItem))
      return createdItem
    } catch (error) {
      updateColumns(() => previousColumns)
      throw error
    }
  }, [accessToken, activePlanId, columns, isBackendDriven, updateColumns])

  const updateChecklistItem = useCallback(async (item) => {
    if (!activePlanId || !isBackendDriven) return null

    const previousColumns = columns
    updateColumns((prev) => replaceChecklistItemInColumns(prev, item))

    try {
      const updatedItem = await apiRequest(`/api/plans/${activePlanId}/board/checklists/items/${item.id}`, {
        method: 'PATCH',
        token: accessToken,
        body: {
          title: item.title ?? item.text ?? '',
          completed: Boolean(item.completed ?? item.checked),
          assigneeUserId: item.assigneeUserId ?? null,
          startAt: item.startAt ?? null,
          dueAt: item.dueAt ?? null,
        },
      })

      updateColumns((prev) => replaceChecklistItemInColumns(prev, updatedItem))
      return updatedItem
    } catch (error) {
      updateColumns(() => previousColumns)
      throw error
    }
  }, [accessToken, activePlanId, columns, isBackendDriven, updateColumns])

  const totalCards = useMemo(
    () => columns.reduce((sum, column) => sum + column.cards.length, 0),
    [columns],
  )

  return {
    columns,
    totalCards,
    updateColumns,
    createColumn,
    deleteColumn,
    renameColumn,
    changeColColor,
    addCard,
    updateCard,
    deleteCard,
    addCardComment,
    moveCard,
    createChecklist,
    deleteChecklist,
    createChecklistItem,
    updateChecklistItem,
  }
}
