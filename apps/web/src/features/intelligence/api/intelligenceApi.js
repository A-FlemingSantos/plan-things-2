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
