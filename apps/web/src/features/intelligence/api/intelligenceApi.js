import { apiRequest } from '../../../shared/api/apiClient.js'

function normalizeScopeType(scope = {}) {
  if (scope?.cardId) return 'CARD'
  if (scope?.planId) return 'PLAN'
  return 'WORKSPACE'
}

export function createIntelligenceConversation({ token, scope = {}, title = null } = {}) {
  return apiRequest('/api/intelligence/conversations', {
    method: 'POST',
    token,
    body: {
      planId: scope.planId ?? null,
      cardId: scope.cardId ?? null,
      scopeType: normalizeScopeType(scope),
      title: title ?? null,
    },
  })
}

export function getIntelligenceConversation(conversationId, { token } = {}) {
  return apiRequest(`/api/intelligence/conversations/${conversationId}`, {
    token,
  })
}

export function listIntelligenceMessages(conversationId, { token } = {}) {
  return apiRequest(`/api/intelligence/conversations/${conversationId}/messages`, {
    token,
  })
}

export function createIntelligenceMessage(conversationId, payload, { token } = {}) {
  return apiRequest(`/api/intelligence/conversations/${conversationId}/messages`, {
    method: 'POST',
    token,
    body: payload,
  })
}

export function listIntelligenceConversations({
  token,
  planId = null,
  cardId = null,
  status = 'ACTIVE',
  limit = 30,
} = {}) {
  const params = new URLSearchParams()
  if (planId) params.set('planId', planId)
  if (cardId) params.set('cardId', cardId)
  if (status) params.set('status', status)
  if (limit) params.set('limit', String(limit))

  const query = params.toString()
  const path = query
    ? `/api/intelligence/conversations?${query}`
    : '/api/intelligence/conversations'

  return apiRequest(path, { token })
}

export function updateIntelligenceConversation(conversationId, payload, { token } = {}) {
  return apiRequest(`/api/intelligence/conversations/${conversationId}`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export function cancelIntelligenceMessage(conversationId, messageId, { token } = {}) {
  return apiRequest(
    `/api/intelligence/conversations/${conversationId}/messages/${messageId}/cancel`,
    {
      method: 'POST',
      token,
    },
  )
}
