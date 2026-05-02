import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { buildBoardCardPayload, mapBoardCard, mergeBoardIntoPlan } from '@plan-things/shared-client/board'
import { buildPlanCreatePayload, mapPlanSummaryToRecord, mergePlanDetails } from '@plan-things/shared-client/plans'
import { mobileApiRequest } from '../services/api'
import { useAuth } from './AuthProvider'

const PlansContext = createContext(null)

export function PlansProvider({ children }) {
  const { accessToken, currentUser } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)

  const request = useCallback((path, options = {}) => mobileApiRequest(path, {
    ...options,
    token: accessToken,
  }), [accessToken])

  const replacePlan = useCallback((planId, updater) => {
    setPlans((currentPlans) => currentPlans.map((plan) => (
      plan.id === planId ? updater(plan) : plan
    )))
  }, [])

  const loadPlans = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const response = await request('/api/plans')
      setPlans((response ?? []).map(mapPlanSummaryToRecord))
    } finally {
      setLoading(false)
    }
  }, [accessToken, request])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const createPlan = useCallback(async (draft) => {
    const response = await request('/api/plans', {
      method: 'POST',
      body: buildPlanCreatePayload(draft),
    })
    const summary = mapPlanSummaryToRecord(response.plan ?? response, 0)
    const merged = mergePlanDetails(summary, response)
    setPlans((currentPlans) => [merged, ...currentPlans])
    return merged
  }, [request])

  const loadPlan = useCallback(async (planId) => {
    const [details, boardView, members, labels] = await Promise.all([
      request(`/api/plans/${planId}`),
      request(`/api/plans/${planId}/board`),
      request(`/api/plans/${planId}/members`),
      request(`/api/plans/${planId}/labels`),
    ])

    const base = mapPlanSummaryToRecord(details.plan ?? details, 0)
    const withDetails = mergePlanDetails(base, {
      ...details,
      members: members ?? details.members ?? [],
      labels: labels ?? details.labels ?? [],
    })
    const nextPlan = mergeBoardIntoPlan(withDetails, boardView, {
      timeZone: currentUser?.timeZone,
      locale: currentUser?.locale,
    })

    setPlans((currentPlans) => {
      const found = currentPlans.some((plan) => plan.id === planId)
      if (!found) return [nextPlan, ...currentPlans]
      return currentPlans.map((plan) => (plan.id === planId ? nextPlan : plan))
    })

    return nextPlan
  }, [currentUser?.locale, currentUser?.timeZone, request])

  const applyBoardView = useCallback((planId, boardView) => {
    replacePlan(planId, (plan) => mergeBoardIntoPlan(plan, boardView, {
      timeZone: currentUser?.timeZone,
      locale: currentUser?.locale,
    }))
  }, [currentUser?.locale, currentUser?.timeZone, replacePlan])

  const createColumn = useCallback(async (planId, { title, color }) => {
    const boardView = await request(`/api/plans/${planId}/board/columns`, {
      method: 'POST',
      body: { title, color },
    })
    applyBoardView(planId, boardView)
  }, [applyBoardView, request])

  const updateColumn = useCallback(async (planId, column) => {
    const boardView = await request(`/api/plans/${planId}/board/columns/${column.id}`, {
      method: 'PATCH',
      body: { title: column.title, color: column.color },
    })
    applyBoardView(planId, boardView)
  }, [applyBoardView, request])

  const deleteColumn = useCallback(async (planId, columnId) => {
    await request(`/api/plans/${planId}/board/columns/${columnId}`, { method: 'DELETE' })
    await loadPlan(planId)
  }, [loadPlan, request])

  const createCard = useCallback(async (planId, card) => {
    await request(`/api/plans/${planId}/board/cards`, {
      method: 'POST',
      body: buildBoardCardPayload(card, { timeZone: currentUser?.timeZone }),
    })
    await loadPlan(planId)
  }, [currentUser?.timeZone, loadPlan, request])

  const updateCard = useCallback(async (planId, card) => {
    await request(`/api/plans/${planId}/board/cards/${card.id}`, {
      method: 'PATCH',
      body: buildBoardCardPayload(card, { timeZone: currentUser?.timeZone }),
    })
    await loadPlan(planId)
  }, [currentUser?.timeZone, loadPlan, request])

  const deleteCard = useCallback(async (planId, cardId) => {
    await request(`/api/plans/${planId}/board/cards/${cardId}`, { method: 'DELETE' })
    await loadPlan(planId)
  }, [loadPlan, request])

  const moveCard = useCallback(async (planId, cardId, targetColumnId, targetPosition) => {
    const boardView = await request(`/api/plans/${planId}/board/cards/${cardId}/move`, {
      method: 'PUT',
      body: { targetColumnId, targetPosition },
    })
    applyBoardView(planId, boardView)
  }, [applyBoardView, request])

  const addComment = useCallback(async (planId, cardId, message) => {
    await request(`/api/plans/${planId}/board/cards/${cardId}/comments`, {
      method: 'POST',
      body: { message },
    })
    await loadPlan(planId)
  }, [loadPlan, request])

  const createChecklist = useCallback(async (planId, cardId, title) => {
    const checklist = await request(`/api/plans/${planId}/board/cards/${cardId}/checklists`, {
      method: 'POST',
      body: { title },
    })
    await loadPlan(planId)
    return checklist
  }, [loadPlan, request])

  const createChecklistItem = useCallback(async (planId, checklistId, title) => {
    const item = await request(`/api/plans/${planId}/board/checklists/${checklistId}/items`, {
      method: 'POST',
      body: { title },
    })
    await loadPlan(planId)
    return item
  }, [loadPlan, request])

  const updateChecklistItem = useCallback(async (planId, item) => {
    await request(`/api/plans/${planId}/board/checklists/items/${item.id}`, {
      method: 'PATCH',
      body: {
        title: item.title ?? item.text,
        completed: Boolean(item.completed ?? item.checked),
        assigneeUserId: item.assigneeUserId ?? null,
        startAt: item.startAt ?? null,
        dueAt: item.dueAt ?? null,
      },
    })
    await loadPlan(planId)
  }, [loadPlan, request])

  const attachFileToCard = useCallback(async (planId, fileId, cardId) => {
    const response = await request(`/api/files/${fileId}/attach/cards/${cardId}`, { method: 'POST' })
    await loadPlan(planId)
    return response
  }, [loadPlan, request])

  const uploadAndAttachToCard = useCallback(async (planId, file, cardId) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await request(`/api/files/upload/attach/cards/${cardId}`, {
      method: 'POST',
      body: formData,
    })
    await loadPlan(planId)
    return response
  }, [loadPlan, request])

  const removeAttachment = useCallback(async (planId, attachmentId) => {
    const response = await request(`/api/files/attachments/${attachmentId}`, { method: 'DELETE' })
    await loadPlan(planId)
    return response
  }, [loadPlan, request])

  const value = useMemo(() => ({
    plans,
    loading,
    loadPlans,
    createPlan,
    loadPlan,
    createColumn,
    updateColumn,
    deleteColumn,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    addComment,
    createChecklist,
    createChecklistItem,
    updateChecklistItem,
    attachFileToCard,
    uploadAndAttachToCard,
    removeAttachment,
    mapBoardCard,
  }), [addComment, attachFileToCard, createCard, createChecklist, createChecklistItem, createColumn, createPlan, deleteCard, deleteColumn, loadPlan, loadPlans, loading, moveCard, plans, removeAttachment, updateCard, updateChecklistItem, updateColumn, uploadAndAttachToCard])

  return <PlansContext.Provider value={value}>{children}</PlansContext.Provider>
}

export function usePlans() {
  const context = useContext(PlansContext)
  if (!context) {
    throw new Error('usePlans must be used within PlansProvider')
  }
  return context
}
