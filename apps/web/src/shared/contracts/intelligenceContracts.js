/** @typedef {'user' | 'assistant' | 'system_event' | 'tool_event' | 'action_event'} UiMessageRole */

/**
 * @typedef {Object} ContextSnapshotAttachment
 * @property {string} id
 * @property {string} type
 * @property {string} kind
 * @property {string} label
 * @property {boolean} [isImage]
 * @property {string|null} [previewUrl]
 * @property {string|null} [mimeType]
 * @property {boolean} [isMock]
 */

/**
 * @typedef {Object} ContextSnapshotInlineChip
 * @property {string} id
 * @property {string} type
 * @property {string} kind
 * @property {string} label
 */

/**
 * @typedef {Object} ContextSnapshot
 * @property {ContextSnapshotAttachment[]} imageAttachments
 * @property {ContextSnapshotAttachment[]} fileAttachments
 * @property {ContextSnapshotInlineChip[]} contextChips
 */

/**
 * @typedef {Object} ThreadMessageBlock
 * @property {string} id
 * @property {string} type
 * @property {number} position
 * @property {string|null} title
 * @property {string|null} href
 * @property {string|null} entityType
 * @property {string|null} entityId
 * @property {Record<string, unknown>} payload
 * @property {Record<string, unknown>|null} snapshot
 */

/**
 * @typedef {Object} ThreadMessage
 * @property {string} id
 * @property {UiMessageRole} role
 * @property {string} status
 * @property {string} text
 * @property {string} contentText
 * @property {ContextSnapshot|null} [contextSnapshot]
 * @property {ThreadMessageBlock[]} blocks
 * @property {string|null} [errorCode]
 * @property {unknown} [createdAt]
 * @property {string|null} [conversationId]
 * @property {string|null} [openaiResponseId]
 */

/**
 * @typedef {Object} StructuredAssistantResponse
 * @property {string} summary
 * @property {Array<{ type: string, title: string|null, payload: Record<string, unknown> }>} blocks
 * @property {string[]} memoryCandidates
 */

export const CONTEXT_SNAPSHOT_VERSION = 1

export const AI_MESSAGE_ROLES = Object.freeze({
  USER: 'USER',
  ASSISTANT: 'ASSISTANT',
  SYSTEM_EVENT: 'SYSTEM_EVENT',
  TOOL_EVENT: 'TOOL_EVENT',
  ACTION_EVENT: 'ACTION_EVENT',
})

export const AI_MESSAGE_STATUSES = Object.freeze({
  PENDING: 'PENDING',
  STREAMING: 'STREAMING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
})

/** Keep in sync with com.planthings.api.intelligence.model.AiMessageBlockType */
export const AI_BLOCK_TYPES = Object.freeze([
  'MARKDOWN',
  'QUESTION',
  'PLAN_PROPOSAL',
  'CARD_BATCH_PROPOSAL',
  'MEMBER_INVITE_PROPOSAL',
  'FILE_ATTACH_PROPOSAL',
  'PLAN_REFERENCE',
  'CARD_REFERENCE',
  'FILE_REFERENCE',
  'MEMBER_REFERENCE',
  'INBOX_REFERENCE',
  'GITHUB_COMMIT_REFERENCE',
  'GITHUB_PULL_REQUEST_REFERENCE',
  'TOOL_RUN_SUMMARY',
])

const UI_ROLE_BY_API_ROLE = Object.freeze({
  [AI_MESSAGE_ROLES.USER]: 'user',
  [AI_MESSAGE_ROLES.ASSISTANT]: 'assistant',
  [AI_MESSAGE_ROLES.SYSTEM_EVENT]: 'system_event',
  [AI_MESSAGE_ROLES.TOOL_EVENT]: 'tool_event',
  [AI_MESSAGE_ROLES.ACTION_EVENT]: 'action_event',
})

const API_ROLE_BY_UI_ROLE = Object.freeze({
  user: AI_MESSAGE_ROLES.USER,
  assistant: AI_MESSAGE_ROLES.ASSISTANT,
  system_event: AI_MESSAGE_ROLES.SYSTEM_EVENT,
  tool_event: AI_MESSAGE_ROLES.TOOL_EVENT,
  action_event: AI_MESSAGE_ROLES.ACTION_EVENT,
})

const EMPTY_CONTEXT_SNAPSHOT = Object.freeze({
  imageAttachments: [],
  fileAttachments: [],
  contextChips: [],
})

export const BLOCK_PAYLOAD_HINTS = Object.freeze({
  MARKDOWN: { markdown: 'string' },
  QUESTION: { prompt: 'string', choices: 'string[]' },
  PLAN_PROPOSAL: { actionProposalId: 'string|null', preview: 'object' },
  CARD_BATCH_PROPOSAL: { actionProposalId: 'string|null', preview: 'object' },
  MEMBER_INVITE_PROPOSAL: { actionProposalId: 'string|null', preview: 'object' },
  FILE_ATTACH_PROPOSAL: { actionProposalId: 'string|null', preview: 'object' },
  PLAN_REFERENCE: { entityId: 'string', href: 'string', snapshot: 'object' },
  CARD_REFERENCE: { entityId: 'string', href: 'string', snapshot: 'object' },
  FILE_REFERENCE: { entityId: 'string', href: 'string', snapshot: 'object' },
  MEMBER_REFERENCE: { entityId: 'string', href: 'string', snapshot: 'object' },
  INBOX_REFERENCE: { entityId: 'string', href: 'string', snapshot: 'object' },
  GITHUB_COMMIT_REFERENCE: { externalId: 'string', href: 'string', snapshot: 'object' },
  GITHUB_PULL_REQUEST_REFERENCE: { externalId: 'string', href: 'string', snapshot: 'object' },
  TOOL_RUN_SUMMARY: { toolId: 'string', status: 'string', summary: 'string' },
})

function cloneAttachmentChip(chip = {}) {
  return {
    id: String(chip.id ?? ''),
    type: String(chip.type ?? ''),
    kind: String(chip.kind ?? ''),
    label: String(chip.label ?? ''),
    isImage: Boolean(chip.isImage),
    previewUrl: chip.previewUrl ?? null,
    mimeType: chip.mimeType ?? null,
    isMock: chip.isMock ?? false,
  }
}

function cloneInlineChip(chip = {}) {
  return {
    id: String(chip.id ?? ''),
    type: String(chip.type ?? ''),
    kind: String(chip.kind ?? ''),
    label: String(chip.label ?? ''),
  }
}

function parseJsonObject(value, fallback = {}) {
  const useNullFallback = fallback === null

  if (value == null || value === '') {
    return useNullFallback ? null : { ...fallback }
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return { ...value }
  }
  try {
    const parsed = JSON.parse(String(value))
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed
    }
    return useNullFallback ? null : { ...fallback }
  } catch {
    return useNullFallback ? null : { ...fallback }
  }
}

function hasSerializableContext(snapshot) {
  if (!snapshot) return false
  return (
    snapshot.imageAttachments?.length > 0
    || snapshot.fileAttachments?.length > 0
    || snapshot.contextChips?.length > 0
  )
}

export function createThreadMessageId(role = 'message') {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function toUiRole(apiRole) {
  const normalized = String(apiRole ?? '').trim().toUpperCase()
  return UI_ROLE_BY_API_ROLE[normalized] ?? 'assistant'
}

export function toApiRole(uiRole) {
  const normalized = String(uiRole ?? '').trim().toLowerCase()
  return API_ROLE_BY_UI_ROLE[normalized] ?? AI_MESSAGE_ROLES.ASSISTANT
}

export function normalizeContextSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return {
      imageAttachments: [],
      fileAttachments: [],
      contextChips: [],
    }
  }

  return {
    imageAttachments: Array.isArray(snapshot.imageAttachments)
      ? snapshot.imageAttachments.map(cloneAttachmentChip)
      : [],
    fileAttachments: Array.isArray(snapshot.fileAttachments)
      ? snapshot.fileAttachments.map(cloneAttachmentChip)
      : [],
    contextChips: Array.isArray(snapshot.contextChips)
      ? snapshot.contextChips.map(cloneInlineChip)
      : [],
  }
}

/**
 * Wire format for future ai_context_snapshots.context_json (Fase 1.5).
 */
export function serializeContextSnapshotForApi(snapshot) {
  const normalized = normalizeContextSnapshot(snapshot)
  if (!hasSerializableContext(normalized)) {
    return null
  }

  return {
    version: CONTEXT_SNAPSHOT_VERSION,
    imageAttachments: normalized.imageAttachments,
    fileAttachments: normalized.fileAttachments,
    contextChips: normalized.contextChips,
  }
}

export function normalizeAiMessageBlock(block = {}) {
  const blockType = String(block.blockType ?? block.type ?? '').trim().toUpperCase()

  return {
    id: String(block.id ?? ''),
    type: blockType,
    position: Number.isFinite(block.position) ? block.position : 0,
    title: block.title ?? null,
    href: block.href ?? null,
    entityType: block.entityType ?? null,
    entityId: block.entityId != null ? String(block.entityId) : null,
    payload: parseJsonObject(block.payloadJson ?? block.payload),
    snapshot: block.snapshotJson != null || block.snapshot != null
      ? parseJsonObject(block.snapshotJson ?? block.snapshot, null)
      : null,
  }
}

function resolveThreadText(contentText, blocks = []) {
  const text = String(contentText ?? '').trim()
  if (text) return text

  const markdownBlock = blocks.find((block) => block.type === 'MARKDOWN')
  const markdown = markdownBlock?.payload?.markdown
  return typeof markdown === 'string' ? markdown.trim() : ''
}

/**
 * @param {Record<string, unknown>} apiMessage
 * @returns {ThreadMessage}
 */
export function mapApiMessageToThreadMessage(apiMessage = {}) {
  const blocks = (Array.isArray(apiMessage.blocks) ? apiMessage.blocks : [])
    .map(normalizeAiMessageBlock)
    .sort((left, right) => left.position - right.position)

  const contentText = String(apiMessage.contentText ?? '')
  const text = resolveThreadText(contentText, blocks)

  return {
    id: String(apiMessage.id ?? ''),
    conversationId: apiMessage.conversationId != null ? String(apiMessage.conversationId) : null,
    role: toUiRole(apiMessage.role),
    status: String(apiMessage.status ?? AI_MESSAGE_STATUSES.COMPLETED).toUpperCase(),
    text,
    contentText,
    contextSnapshot: apiMessage.contextSnapshot
      ? normalizeContextSnapshot(apiMessage.contextSnapshot)
      : null,
    blocks,
    errorCode: apiMessage.errorCode ?? null,
    openaiResponseId: apiMessage.openaiResponseId ?? null,
    createdAt: apiMessage.createdAt ?? null,
  }
}

/**
 * @param {ThreadMessage} message
 * @returns {Record<string, unknown>}
 */
export function mapThreadMessageToApiShape(message = {}) {
  const contentText = String(message.contentText ?? message.text ?? '').trim()

  return {
    id: message.id,
    conversationId: message.conversationId ?? null,
    role: toApiRole(message.role),
    status: String(message.status ?? AI_MESSAGE_STATUSES.COMPLETED).toUpperCase(),
    contentText,
    contextSnapshot: message.contextSnapshot
      ? serializeContextSnapshotForApi(message.contextSnapshot)
      : null,
    blocks: (message.blocks ?? []).map((block, index) => ({
      id: block.id,
      blockType: block.type,
      position: Number.isFinite(block.position) ? block.position : index,
      title: block.title ?? null,
      href: block.href ?? null,
      entityType: block.entityType ?? null,
      entityId: block.entityId ?? null,
      payloadJson: JSON.stringify(block.payload ?? {}),
      snapshotJson: block.snapshot ? JSON.stringify(block.snapshot) : null,
    })),
    errorCode: message.errorCode ?? null,
    openaiResponseId: message.openaiResponseId ?? null,
    createdAt: message.createdAt ?? null,
  }
}

function buildThreadMessage({
  id = createThreadMessageId('message'),
  role,
  status,
  text,
  contextSnapshot = null,
  blocks = [],
  errorCode = null,
  createdAt = null,
  conversationId = null,
  openaiResponseId = null,
}) {
  const contentText = String(text ?? '').trim()

  return {
    id,
    conversationId,
    role,
    status,
    text: contentText,
    contentText,
    contextSnapshot: contextSnapshot ? normalizeContextSnapshot(contextSnapshot) : null,
    blocks: Array.isArray(blocks) ? blocks.map(normalizeAiMessageBlock) : [],
    errorCode,
    openaiResponseId,
    createdAt,
  }
}

export function createOptimisticUserMessage({
  id = createThreadMessageId('user'),
  text = '',
  contextSnapshot = EMPTY_CONTEXT_SNAPSHOT,
} = {}) {
  return buildThreadMessage({
    id,
    role: 'user',
    status: AI_MESSAGE_STATUSES.COMPLETED,
    text,
    contextSnapshot,
    blocks: [],
  })
}

export function createOptimisticAssistantPlaceholder({
  id = createThreadMessageId('assistant'),
} = {}) {
  return buildThreadMessage({
    id,
    role: 'assistant',
    status: AI_MESSAGE_STATUSES.PENDING,
    text: '',
    blocks: [],
  })
}

export function createCompletedAssistantMessage({
  id = createThreadMessageId('assistant'),
  text = '',
  blocks = [],
} = {}) {
  return buildThreadMessage({
    id,
    role: 'assistant',
    status: AI_MESSAGE_STATUSES.COMPLETED,
    text,
    blocks,
  })
}

export function buildCreateMessagePayload({ text = '', contextSnapshot = null } = {}) {
  const content = String(text ?? '').trim()
  const payload = { content }

  const serializedSnapshot = serializeContextSnapshotForApi(contextSnapshot)
  if (serializedSnapshot) {
    payload.contextSnapshot = serializedSnapshot
  }

  return payload
}

export function normalizeStructuredAssistantResponse(response = {}) {
  const summary = String(response.summary ?? '').trim()
  const rawBlocks = Array.isArray(response.blocks) ? response.blocks : []
  const memoryCandidates = Array.isArray(response.memoryCandidates)
    ? response.memoryCandidates.map((item) => String(item ?? '').trim()).filter(Boolean)
    : []

  const blocks = rawBlocks.map((block, index) => {
    const type = String(block?.type ?? '').trim().toUpperCase()
    const payload = parseJsonObject(block?.payload)

    return {
      type,
      title: block?.title ?? null,
      payload,
      position: index,
    }
  })

  return {
    summary,
    blocks,
    memoryCandidates,
  }
}

export function structuredResponseToThreadBlocks(structuredResponse) {
  const normalized = normalizeStructuredAssistantResponse(structuredResponse)

  return normalized.blocks.map((block, index) => normalizeAiMessageBlock({
    id: `structured-${index}`,
    blockType: block.type,
    position: block.position ?? index,
    title: block.title,
    payloadJson: block.payload,
    snapshotJson: null,
  }))
}

export function getThreadMessageDisplayText(message = {}) {
  return resolveThreadText(message.contentText ?? message.text, message.blocks ?? [])
}

export function isAssistantMessagePending(message = {}) {
  if (message.role !== 'assistant') return false
  const status = String(message.status ?? '').toUpperCase()
  return status === AI_MESSAGE_STATUSES.PENDING || status === AI_MESSAGE_STATUSES.STREAMING
}

export function isThreadMessageThinking(messages = []) {
  return messages.some(isAssistantMessagePending)
}
