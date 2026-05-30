// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  AI_BLOCK_TYPES,
  AI_MESSAGE_ROLES,
  AI_MESSAGE_STATUSES,
  buildCreateMessagePayload,
  createCompletedAssistantMessage,
  createOptimisticAssistantPlaceholder,
  createOptimisticUserMessage,
  mapApiMessageToThreadMessage,
  mapThreadMessageToApiShape,
  normalizeAiMessageBlock,
  normalizeContextSnapshot,
  normalizeStructuredAssistantResponse,
  serializeContextSnapshotForApi,
  structuredResponseToThreadBlocks,
  assistantMessageHasRenderableContent,
  toApiRole,
  toUiRole,
} from './intelligenceContracts.js'

describe('intelligenceContracts roles', () => {
  it('maps API roles to UI roles and back', () => {
    expect(toUiRole('USER')).toBe('user')
    expect(toUiRole('ASSISTANT')).toBe('assistant')
    expect(toApiRole('user')).toBe(AI_MESSAGE_ROLES.USER)
    expect(toApiRole('assistant')).toBe(AI_MESSAGE_ROLES.ASSISTANT)
  })
})

describe('normalizeContextSnapshot', () => {
  it('preserves ChipIcon on inline chips for UI rendering', () => {
    const ChipIcon = () => null
    const snapshot = normalizeContextSnapshot({
      imageAttachments: [{ id: '1', kind: 'file', type: 'f', label: 'a.png', isImage: true, ChipIcon }],
      fileAttachments: [],
      contextChips: [{ id: '2', kind: 'plan', type: 'p', label: 'Plan', ChipIcon }],
    })

    expect(snapshot.imageAttachments[0]).not.toHaveProperty('ChipIcon')
    expect(snapshot.contextChips[0].ChipIcon).toBe(ChipIcon)
    expect(snapshot.imageAttachments[0].label).toBe('a.png')
  })

  it('returns empty arrays for invalid snapshot input', () => {
    expect(normalizeContextSnapshot(null)).toEqual({
      imageAttachments: [],
      fileAttachments: [],
      contextChips: [],
    })
  })
})

describe('serializeContextSnapshotForApi', () => {
  it('returns null when snapshot has no context', () => {
    expect(serializeContextSnapshotForApi({
      imageAttachments: [],
      fileAttachments: [],
      contextChips: [],
    })).toBeNull()
  })

  it('serializes snapshot with version for future persistence', () => {
    const serialized = serializeContextSnapshotForApi({
      imageAttachments: [],
      fileAttachments: [{ id: '1', kind: 'file', type: 'f', label: 'doc.pdf', isImage: false }],
      contextChips: [],
    })

    expect(serialized).toEqual({
      version: 1,
      imageAttachments: [],
      fileAttachments: [expect.objectContaining({ label: 'doc.pdf' })],
      contextChips: [],
    })
  })

  it('strips ChipIcon from context chips in API serialization', () => {
    const ChipIcon = () => null
    const serialized = serializeContextSnapshotForApi({
      imageAttachments: [],
      fileAttachments: [],
      contextChips: [{ id: '1', kind: 'plan', type: 'plan-1', label: 'Plano', ChipIcon }],
    })

    expect(serialized.contextChips[0]).not.toHaveProperty('ChipIcon')
    expect(serialized.contextChips[0].label).toBe('Plano')
  })
})

describe('normalizeAiMessageBlock', () => {
  it('parses payload and snapshot JSON from API blocks', () => {
    const block = normalizeAiMessageBlock({
      id: 'block-1',
      blockType: 'MARKDOWN',
      position: 0,
      title: null,
      payloadJson: '{"markdown":"Hello"}',
      snapshotJson: '{"column":"Doing"}',
    })

    expect(block).toMatchObject({
      type: 'MARKDOWN',
      payload: { markdown: 'Hello' },
      snapshot: { column: 'Doing' },
    })
  })

  it('falls back to empty payload when JSON is invalid', () => {
    const block = normalizeAiMessageBlock({
      blockType: 'MARKDOWN',
      payloadJson: '{invalid',
    })

    expect(block.payload).toEqual({})
  })
})

describe('mapApiMessageToThreadMessage', () => {
  it('maps backend message fields to canonical thread shape', () => {
    const threadMessage = mapApiMessageToThreadMessage({
      id: 'msg-1',
      conversationId: 'conv-1',
      role: 'USER',
      status: 'COMPLETED',
      contentText: 'Priorizar planos',
      blocks: [],
      createdAt: { iso: '2026-05-30T12:00:00Z' },
    })

    expect(threadMessage).toMatchObject({
      id: 'msg-1',
      role: 'user',
      status: 'COMPLETED',
      text: 'Priorizar planos',
      contentText: 'Priorizar planos',
      blocks: [],
    })
  })

  it('derives assistant text from MARKDOWN block when contentText is empty', () => {
    const threadMessage = mapApiMessageToThreadMessage({
      id: 'msg-2',
      role: 'ASSISTANT',
      status: 'COMPLETED',
      contentText: '',
      blocks: [{
        id: 'b1',
        blockType: 'MARKDOWN',
        position: 0,
        payloadJson: '{"markdown":"Resposta em bloco"}',
      }],
    })

    expect(threadMessage.text).toBe('Resposta em bloco')
  })
})

describe('optimistic thread messages', () => {
  it('creates user and assistant placeholders with canonical fields', () => {
    const userMessage = createOptimisticUserMessage({
      id: 'user-1',
      text: 'Olá',
      contextSnapshot: {
        imageAttachments: [],
        fileAttachments: [],
        contextChips: [{ id: 'c1', kind: 'connector', type: 'github', label: 'GitHub' }],
      },
    })

    expect(userMessage).toMatchObject({
      id: 'user-1',
      role: 'user',
      status: AI_MESSAGE_STATUSES.COMPLETED,
      text: 'Olá',
      blocks: [],
    })
    expect(userMessage.contextSnapshot.contextChips).toHaveLength(1)

    const assistantPlaceholder = createOptimisticAssistantPlaceholder({ id: 'asst-1' })
    expect(assistantPlaceholder).toMatchObject({
      id: 'asst-1',
      role: 'assistant',
      status: AI_MESSAGE_STATUSES.PENDING,
      text: '',
      blocks: [],
    })

    const assistantDone = createCompletedAssistantMessage({
      id: 'asst-2',
      text: 'Pronto',
    })
    expect(assistantDone.status).toBe(AI_MESSAGE_STATUSES.COMPLETED)
    expect(assistantDone.text).toBe('Pronto')
  })
})

describe('buildCreateMessagePayload', () => {
  it('sends content only when there is no snapshot context', () => {
    expect(buildCreateMessagePayload({ text: 'Oi' })).toEqual({ content: 'Oi' })
  })

  it('includes serialized contextSnapshot when chips or attachments exist', () => {
    const payload = buildCreateMessagePayload({
      text: 'Com contexto',
      contextSnapshot: {
        imageAttachments: [],
        fileAttachments: [],
        contextChips: [{ id: '1', kind: 'plan', type: 'plan-1', label: 'Plano A' }],
      },
    })

    expect(payload.content).toBe('Com contexto')
    expect(payload.contextSnapshot).toMatchObject({
      version: 1,
      contextChips: [expect.objectContaining({ label: 'Plano A' })],
    })
  })
})

describe('normalizeStructuredAssistantResponse', () => {
  it('requires summary, blocks and memoryCandidates shape', () => {
    const normalized = normalizeStructuredAssistantResponse({
      summary: 'Resumo',
      blocks: [{ type: 'markdown', title: null, payload: { markdown: 'Texto' } }],
      memoryCandidates: [' prefere sprints '],
    })

    expect(normalized).toEqual({
      summary: 'Resumo',
      blocks: [{
        type: 'MARKDOWN',
        title: null,
        payload: { markdown: 'Texto' },
        position: 0,
      }],
      memoryCandidates: ['prefere sprints'],
    })
  })

  it('converts structured blocks to thread blocks', () => {
    const threadBlocks = structuredResponseToThreadBlocks({
      summary: 'Resumo',
      blocks: [{ type: 'MARKDOWN', title: null, payload: { markdown: 'Olá' } }],
      memoryCandidates: [],
    })

    expect(threadBlocks[0]).toMatchObject({
      type: 'MARKDOWN',
      payload: { markdown: 'Olá' },
    })
  })
})

describe('mapThreadMessageToApiShape', () => {
  it('round-trips user messages through API shape', () => {
    const userMessage = createOptimisticUserMessage({
      id: 'user-1',
      text: 'Teste',
      contextSnapshot: {
        imageAttachments: [],
        fileAttachments: [],
        contextChips: [{ id: '1', kind: 'plan', type: 'plan-1', label: 'Plano' }],
      },
    })

    const apiShape = mapThreadMessageToApiShape(userMessage)
    const restored = mapApiMessageToThreadMessage({
      ...apiShape,
      id: userMessage.id,
      contextSnapshot: apiShape.contextSnapshot,
    })

    expect(restored).toMatchObject({
      id: 'user-1',
      role: 'user',
      text: 'Teste',
    })
    expect(restored.contextSnapshot.contextChips).toHaveLength(1)
  })
})

describe('AI_BLOCK_TYPES', () => {
  it('lists every backend block type used in phase 0.5', () => {
    expect(AI_BLOCK_TYPES).toContain('MARKDOWN')
    expect(AI_BLOCK_TYPES).toContain('PLAN_REFERENCE')
    expect(AI_BLOCK_TYPES).toHaveLength(14)
  })
})

describe('assistantMessageHasRenderableContent', () => {
  it('returns true for pending assistant placeholders and block replies', () => {
    expect(assistantMessageHasRenderableContent({
      role: 'assistant',
      status: AI_MESSAGE_STATUSES.PENDING,
      text: '',
      blocks: [],
    })).toBe(true)

    expect(assistantMessageHasRenderableContent({
      role: 'assistant',
      status: AI_MESSAGE_STATUSES.COMPLETED,
      text: '',
      blocks: [{ id: 'b1', type: 'MARKDOWN', position: 0, payload: { markdown: 'Oi' } }],
    })).toBe(true)
  })
})
