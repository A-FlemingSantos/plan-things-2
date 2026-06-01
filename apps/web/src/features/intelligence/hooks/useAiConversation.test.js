import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AI_MESSAGE_STATUSES } from '../../../shared/contracts/intelligenceContracts.js'
import { useAiConversation } from './useAiConversation.js'

const apiMocks = vi.hoisted(() => ({
  createConversation: vi.fn(),
  createMessage: vi.fn(),
  listMessages: vi.fn(),
}))

const streamState = vi.hoisted(() => ({
  options: null,
}))

vi.mock('../api/intelligenceApi.js', () => ({
  createIntelligenceConversation: (...args) => apiMocks.createConversation(...args),
  createIntelligenceMessage: (...args) => apiMocks.createMessage(...args),
  listIntelligenceMessages: (...args) => apiMocks.listMessages(...args),
}))

vi.mock('./useAiStream.js', () => ({
  useAiStream: (options) => {
    streamState.options = options
  },
}))

describe('useAiConversation', () => {
  beforeEach(() => {
    apiMocks.createConversation.mockReset()
    apiMocks.createMessage.mockReset()
    apiMocks.listMessages.mockReset()
    streamState.options = null
  })

  it('creates a real conversation, submits the message, and keeps only inline context chips in the composer', async () => {
    const setAiChips = vi.fn()
    const chips = [
      { id: 'file-1', kind: 'file', type: 'file-upload', label: 'brief.pdf' },
      { id: 'connector-1', kind: 'connector', type: 'github', label: 'GitHub' },
    ]

    apiMocks.createConversation.mockResolvedValue({ id: 'conv-1' })
    apiMocks.createMessage.mockResolvedValue({
      conversationId: 'conv-1',
      userMessageId: 'user-1',
      assistantMessageId: 'asst-1',
      assistantStatus: 'PENDING',
    })

    const { result } = renderHook(() => useAiConversation({
      accessToken: 'token-1',
      enabled: true,
      scope: { planId: 'plan-1' },
      aiChips: chips,
      setAiChips,
    }))

    await waitFor(() => {
      expect(apiMocks.createConversation).toHaveBeenCalled()
    })

    let submitted = false
    await act(async () => {
      submitted = await result.current.submitMessage('Olá', chips)
    })

    expect(submitted).toBe(true)
    expect(apiMocks.createMessage).toHaveBeenCalledWith(
      'conv-1',
      expect.objectContaining({ content: 'Olá' }),
      { token: 'token-1' },
    )
    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0]).toMatchObject({
      id: 'user-1',
      role: 'user',
      status: AI_MESSAGE_STATUSES.COMPLETED,
      text: 'Olá',
    })
    expect(result.current.messages[1]).toMatchObject({
      id: 'asst-1',
      role: 'assistant',
      status: AI_MESSAGE_STATUSES.PENDING,
    })
    expect(setAiChips).toHaveBeenCalledWith([
      expect.objectContaining({ kind: 'connector', label: 'GitHub' }),
    ])
    expect(result.current.isThinking).toBe(true)
  })

  it('does not create a conversation on mount when autoCreateOnMount is false', async () => {
    const { result } = renderHook(() => useAiConversation({
      accessToken: 'token-1',
      enabled: true,
      autoCreateOnMount: false,
    }))

    await act(async () => {})

    expect(apiMocks.createConversation).not.toHaveBeenCalled()
    expect(result.current.conversationId).toBe(null)
    expect(result.current.hasConversation).toBe(false)
  })

  it('hydrates an initial conversation without creating a new one', async () => {
    apiMocks.listMessages.mockResolvedValue([
      {
        id: 'user-1',
        conversationId: 'conv-1',
        role: 'USER',
        status: 'COMPLETED',
        contentText: 'Mensagem salva',
        blocks: [],
      },
    ])

    const { result } = renderHook(() => useAiConversation({
      accessToken: 'token-1',
      enabled: true,
      initialConversationId: 'conv-1',
      autoCreateOnMount: false,
    }))

    await waitFor(() => {
      expect(apiMocks.listMessages).toHaveBeenCalledWith('conv-1', { token: 'token-1' })
    })

    await waitFor(() => {
      expect(result.current.messages[0]).toMatchObject({
        id: 'user-1',
        text: 'Mensagem salva',
      })
    })

    expect(apiMocks.createConversation).not.toHaveBeenCalled()
    expect(result.current.conversationId).toBe('conv-1')
  })

  it('creates the first conversation on submit and reports the created id', async () => {
    const onConversationCreated = vi.fn()
    apiMocks.createConversation.mockResolvedValue({ id: 'conv-1' })
    apiMocks.createMessage.mockResolvedValue({
      conversationId: 'conv-1',
      userMessageId: 'user-1',
      assistantMessageId: 'asst-1',
      assistantStatus: 'PENDING',
    })

    const { result } = renderHook(() => useAiConversation({
      accessToken: 'token-1',
      enabled: true,
      autoCreateOnMount: false,
      onConversationCreated,
    }))

    await act(async () => {
      await result.current.submitMessage('Primeira mensagem')
    })

    expect(apiMocks.createConversation).toHaveBeenCalledTimes(1)
    expect(apiMocks.createMessage).toHaveBeenCalledWith(
      'conv-1',
      expect.objectContaining({ content: 'Primeira mensagem' }),
      { token: 'token-1' },
    )
    expect(onConversationCreated).toHaveBeenCalledWith('conv-1')
  })

  it('clears the current thread and hydrates when initialConversationId changes', async () => {
    apiMocks.listMessages.mockImplementation(async (conversationId) => ([
      {
        id: `user-${conversationId}`,
        conversationId,
        role: 'USER',
        status: 'COMPLETED',
        contentText: `Mensagem ${conversationId}`,
        blocks: [],
      },
    ]))

    const { result, rerender } = renderHook(
      ({ conversationId }) => useAiConversation({
        accessToken: 'token-1',
        enabled: true,
        initialConversationId: conversationId,
        autoCreateOnMount: false,
      }),
      { initialProps: { conversationId: 'conv-1' } },
    )

    await waitFor(() => {
      expect(result.current.messages[0]?.text).toBe('Mensagem conv-1')
    })

    rerender({ conversationId: 'conv-2' })

    await waitFor(() => {
      expect(result.current.messages[0]?.text).toBe('Mensagem conv-2')
    })

    expect(result.current.conversationId).toBe('conv-2')
    expect(apiMocks.listMessages).toHaveBeenCalledWith('conv-2', { token: 'token-1' })
  })

  it('hydrates the completed assistant message from the backend after assistant.completed', async () => {
    apiMocks.createConversation.mockResolvedValue({ id: 'conv-1' })
    apiMocks.createMessage.mockResolvedValue({
      conversationId: 'conv-1',
      userMessageId: 'user-1',
      assistantMessageId: 'asst-1',
      assistantStatus: 'PENDING',
    })
    apiMocks.listMessages.mockResolvedValue([
      {
        id: 'user-1',
        conversationId: 'conv-1',
        role: 'USER',
        status: 'COMPLETED',
        contentText: 'Analise isso',
        blocks: [],
      },
      {
        id: 'asst-1',
        conversationId: 'conv-1',
        role: 'ASSISTANT',
        status: 'COMPLETED',
        contentText: 'Resumo final',
        blocks: [
          {
            id: 'block-1',
            blockType: 'MARKDOWN',
            position: 0,
            payloadJson: JSON.stringify({ markdown: 'Resumo final' }),
          },
        ],
      },
    ])

    const { result } = renderHook(() => useAiConversation({
      accessToken: 'token-1',
      enabled: true,
    }))

    await waitFor(() => {
      expect(apiMocks.createConversation).toHaveBeenCalled()
    })

    await act(async () => {
      await result.current.submitMessage('Analise isso')
    })

    await act(async () => {
      streamState.options.onEvent({
        event: 'assistant.completed',
        data: {
          conversationId: 'conv-1',
          messageId: 'asst-1',
        },
      })
    })

    await waitFor(() => {
      expect(result.current.messages[1]?.status).toBe(AI_MESSAGE_STATUSES.COMPLETED)
    })

    expect(result.current.messages[1]).toMatchObject({
      id: 'asst-1',
      role: 'assistant',
      status: AI_MESSAGE_STATUSES.COMPLETED,
      text: 'Resumo final',
    })
    expect(result.current.messages[1].blocks).toHaveLength(1)
    expect(result.current.isThinking).toBe(false)
  })

  it('preserves local context snapshots when backend messages are reloaded', async () => {
    const chips = [
      { id: 'img-1', kind: 'file', type: 'image', label: 'preview.png', isImage: true, previewUrl: 'blob:preview' },
    ]

    apiMocks.createConversation.mockResolvedValue({ id: 'conv-1' })
    apiMocks.createMessage.mockResolvedValue({
      conversationId: 'conv-1',
      userMessageId: 'user-1',
      assistantMessageId: 'asst-1',
      assistantStatus: 'PENDING',
    })
    apiMocks.listMessages.mockResolvedValue([
      {
        id: 'user-1',
        conversationId: 'conv-1',
        role: 'USER',
        status: 'COMPLETED',
        contentText: 'Use a imagem',
        blocks: [],
      },
      {
        id: 'asst-1',
        conversationId: 'conv-1',
        role: 'ASSISTANT',
        status: 'FAILED',
        contentText: 'Nao foi possivel obter resposta da IA agora.',
        blocks: [],
      },
    ])

    const { result } = renderHook(() => useAiConversation({
      accessToken: 'token-1',
      enabled: true,
      aiChips: chips,
    }))

    await waitFor(() => {
      expect(apiMocks.createConversation).toHaveBeenCalled()
    })

    await act(async () => {
      await result.current.submitMessage('Use a imagem', chips)
    })

    await act(async () => {
      streamState.options.onEvent({
        event: 'assistant.completed',
        data: {
          conversationId: 'conv-1',
          messageId: 'asst-1',
        },
      })
    })

    await waitFor(() => {
      expect(result.current.messages[0]?.contextSnapshot?.imageAttachments).toHaveLength(1)
    })
  })

  it('keeps streamed delta text during polling until backend persists final content', async () => {
    apiMocks.createConversation.mockResolvedValue({ id: 'conv-1' })
    apiMocks.createMessage.mockResolvedValue({
      conversationId: 'conv-1',
      userMessageId: 'user-1',
      assistantMessageId: 'asst-1',
      assistantStatus: 'PENDING',
    })
    apiMocks.listMessages.mockResolvedValue([
      {
        id: 'user-1',
        conversationId: 'conv-1',
        role: 'USER',
        status: 'COMPLETED',
        contentText: 'Mensagem',
        blocks: [],
      },
      {
        id: 'asst-1',
        conversationId: 'conv-1',
        role: 'ASSISTANT',
        status: 'STREAMING',
        contentText: '',
        blocks: [],
      },
    ])

    const { result } = renderHook(() => useAiConversation({
      accessToken: 'token-1',
      enabled: true,
    }))

    await waitFor(() => {
      expect(apiMocks.createConversation).toHaveBeenCalled()
    })

    await act(async () => {
      await result.current.submitMessage('Mensagem')
    })

    await act(async () => {
      streamState.options.onEvent({
        event: 'assistant.delta',
        data: {
          conversationId: 'conv-1',
          messageId: 'asst-1',
          delta: 'Parte parcial',
        },
      })
    })

    await act(async () => {
      await result.current.refreshMessages('conv-1')
    })

    expect(result.current.messages[1]).toMatchObject({
      id: 'asst-1',
      role: 'assistant',
      status: AI_MESSAGE_STATUSES.STREAMING,
      text: 'Parte parcial',
    })
  })
})
