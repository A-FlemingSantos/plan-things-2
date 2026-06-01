import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildCreateMessagePayload,
  createOptimisticAssistantPlaceholder,
  createOptimisticUserMessage,
  isThreadMessageThinking,
  mapApiMessageToThreadMessage,
  normalizeAiMessageBlock,
} from '../../../shared/contracts/intelligenceContracts.js'
import {
  cancelIntelligenceMessage,
  createIntelligenceConversation,
  createIntelligenceMessage,
  listIntelligenceMessages,
} from '../api/intelligenceApi.js'
import {
  hasComposerContext,
  keepComposerInlineChips,
  snapshotComposerContext,
} from '../utils/snapshotComposerContext.js'
import { uploadComposerAttachments } from '../utils/uploadComposerAttachments.js'
import { useAiStream } from './useAiStream.js'

const WORKSPACE_LAYOUT_SUBMIT_DELAY_MS = 480
const STREAM_SYNC_POLL_MS = 900

function mergeMessagesWithLocalContext(nextMessages, currentMessages) {
  const currentById = new Map(currentMessages.map((message) => [message.id, message]))

  return nextMessages.map((message) => {
    if (message.role !== 'user' || message.contextSnapshot) {
      return message
    }

    const localMessage = currentById.get(message.id)
    if (!localMessage?.contextSnapshot) {
      return message
    }

    return {
      ...message,
      contextSnapshot: localMessage.contextSnapshot,
    }
  })
}

function mergeMessagesPreservingStreaming(nextMessages, currentMessages) {
  const currentById = new Map(currentMessages.map((message) => [message.id, message]))

  return nextMessages.map((message) => {
    const localMessage = currentById.get(message.id)
    if (!localMessage) {
      return message
    }

    const localStatus = String(localMessage.status ?? '').toUpperCase()
    const remoteStatus = String(message.status ?? '').toUpperCase()
    const remoteHasText = Boolean(String(message.contentText ?? message.text ?? '').trim())
    const localHasText = Boolean(String(localMessage.contentText ?? localMessage.text ?? '').trim())

    if (localStatus !== 'STREAMING') {
      return message
    }

    // During active stream polling, backend may still return empty/pending content.
    // Keep local delta-rendered text until persisted content becomes available.
    if (remoteStatus === 'COMPLETED' || remoteHasText) {
      return message
    }

    if (!localHasText && (!Array.isArray(localMessage.blocks) || localMessage.blocks.length === 0)) {
      return message
    }

    const remoteBlocks = Array.isArray(message.blocks) ? message.blocks : []
    const localBlocks = Array.isArray(localMessage.blocks) ? localMessage.blocks : []
    const shouldKeepLocalBlocks = localBlocks.length > remoteBlocks.length

    return {
      ...message,
      status: localStatus,
      text: localHasText ? localMessage.text : message.text,
      contentText: localHasText ? localMessage.contentText : message.contentText,
      blocks: shouldKeepLocalBlocks ? localBlocks : message.blocks,
    }
  })
}

export function useAiConversation({
  accessToken = null,
  scope = {},
  enabled = true,
  aiChips = [],
  setAiChips,
  initialConversationId = null,
  autoCreateOnMount = true,
  onConversationCreated = null,
  initialPrompt = null,
  initialSubmitComposer = false,
  initialSubmitDelayMs = initialSubmitComposer ? WORKSPACE_LAYOUT_SUBMIT_DELAY_MS : 0,
} = {}) {
  const normalizedInitialConversationId = String(initialConversationId ?? '').trim() || null
  const sessionScopeKey = `${accessToken ?? 'anonymous'}:${scope?.planId ?? ''}:${scope?.cardId ?? ''}:${normalizedInitialConversationId ?? ''}`
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(normalizedInitialConversationId)
  const [isThinking, setIsThinking] = useState(false)
  const [isHydratingConversation, setIsHydratingConversation] = useState(Boolean(normalizedInitialConversationId))
  const willSubmitOnMount = !normalizedInitialConversationId && Boolean(String(initialPrompt ?? '').trim() || initialSubmitComposer)
  const [isAwaitingInitialSubmit, setIsAwaitingInitialSubmit] = useState(willSubmitOnMount)
  const [streamError, setStreamError] = useState('')
  const conversationPromiseRef = useRef(null)
  const initialPromptProcessedRef = useRef(Boolean(normalizedInitialConversationId))
  const hydratedConversationIdRef = useRef(null)
  const lastSessionScopeKeyRef = useRef(sessionScopeKey)

  useEffect(() => {
    if (lastSessionScopeKeyRef.current === sessionScopeKey) {
      return
    }

    lastSessionScopeKeyRef.current = sessionScopeKey
    conversationPromiseRef.current = null
    hydratedConversationIdRef.current = null
    initialPromptProcessedRef.current = Boolean(normalizedInitialConversationId)

    if (normalizedInitialConversationId && normalizedInitialConversationId === conversationId) {
      setIsAwaitingInitialSubmit(false)
      setIsHydratingConversation(false)
      return
    }

    setConversationId(normalizedInitialConversationId)
    setMessages([])
    setIsThinking(false)
    setStreamError('')
    setIsHydratingConversation(Boolean(normalizedInitialConversationId))
    setIsAwaitingInitialSubmit(willSubmitOnMount)
  }, [conversationId, normalizedInitialConversationId, sessionScopeKey, willSubmitOnMount])

  const refreshMessages = useCallback(async (targetConversationId = conversationId) => {
    if (!accessToken || !targetConversationId) return []

    const apiMessages = await listIntelligenceMessages(targetConversationId, { token: accessToken })
    const normalizedMessages = apiMessages.map(mapApiMessageToThreadMessage)

    setMessages((current) => {
      const withStreamingMerge = mergeMessagesPreservingStreaming(normalizedMessages, current)
      return mergeMessagesWithLocalContext(withStreamingMerge, current)
    })
    setIsThinking(isThreadMessageThinking(normalizedMessages))
    return normalizedMessages
  }, [accessToken, conversationId])

  useEffect(() => {
    if (!enabled || !accessToken || !normalizedInitialConversationId) {
      setIsHydratingConversation(false)
      return undefined
    }

    if (hydratedConversationIdRef.current === normalizedInitialConversationId) {
      setIsHydratingConversation(false)
      return undefined
    }

    if (conversationId !== normalizedInitialConversationId) {
      setConversationId(normalizedInitialConversationId)
      return undefined
    }

    if (messages.length > 0 || isThinking) {
      hydratedConversationIdRef.current = normalizedInitialConversationId
      setIsHydratingConversation(false)
      return undefined
    }

    let cancelled = false
    setIsHydratingConversation(true)

    void refreshMessages(normalizedInitialConversationId)
      .then(() => {
        if (!cancelled) {
          hydratedConversationIdRef.current = normalizedInitialConversationId
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStreamError(error instanceof Error ? error.message : 'Nao foi possivel carregar a conversa.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsHydratingConversation(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    accessToken,
    conversationId,
    enabled,
    isThinking,
    messages.length,
    normalizedInitialConversationId,
    refreshMessages,
  ])

  const ensureConversation = useCallback(async () => {
    if (!accessToken || !enabled) {
      return null
    }
    if (conversationId) {
      return { id: conversationId, created: false }
    }
    if (conversationPromiseRef.current) {
      return conversationPromiseRef.current
    }

    conversationPromiseRef.current = createIntelligenceConversation({
      token: accessToken,
      scope,
    })
      .then((conversation) => {
        const nextConversationId = String(conversation.id)
        setConversationId(nextConversationId)
        return { id: nextConversationId, created: true }
      })
      .finally(() => {
        conversationPromiseRef.current = null
      })

    return conversationPromiseRef.current
  }, [accessToken, conversationId, enabled, scope])

  const handleStreamEvent = useCallback((event) => {
    setStreamError('')

    if (event.event === 'assistant.delta') {
      const messageId = String(event.data?.messageId ?? '')
      const delta = String(event.data?.delta ?? '')
      if (!messageId || !delta) return

      setMessages((current) => current.map((message) => (
        message.id === messageId
          ? {
            ...message,
            status: 'STREAMING',
            text: `${message.text ?? ''}${delta}`,
            contentText: `${message.contentText ?? ''}${delta}`,
          }
          : message
      )))
      setIsThinking(true)
      return
    }

    if (event.event === 'block.created') {
      const messageId = String(event.data?.messageId ?? '')
      const block = normalizeAiMessageBlock(event.data?.block ?? {})
      if (!messageId || !block.type) return

      setMessages((current) => current.map((message) => {
        if (message.id !== messageId) return message

        const existingBlocks = Array.isArray(message.blocks) ? message.blocks : []
        if (existingBlocks.some((item) => item.id === block.id && block.id)) {
          return message
        }

        return {
          ...message,
          blocks: [...existingBlocks, block].sort((left, right) => left.position - right.position),
        }
      }))
      return
    }

    if (event.event === 'assistant.completed') {
      void refreshMessages(String(event.data?.conversationId ?? conversationId ?? '')).catch(() => {})
      return
    }

    if (event.event === 'assistant.cancelled') {
      const messageId = String(event.data?.messageId ?? '')
      setMessages((current) => current.map((message) => (
        message.id === messageId
          ? {
            ...message,
            status: 'CANCELLED',
            text: 'Resposta cancelada.',
            contentText: 'Resposta cancelada.',
            errorCode: 'CANCELLED',
          }
          : message
      )))
      setIsThinking(false)
      return
    }

    if (event.event === 'assistant.failed') {
      const messageId = String(event.data?.messageId ?? '')
      const status = String(event.data?.status ?? '').toUpperCase()
      if (status === 'CANCELLED') {
        setMessages((current) => current.map((message) => (
          message.id === messageId
            ? {
              ...message,
              status: 'CANCELLED',
              text: 'Resposta cancelada.',
              contentText: 'Resposta cancelada.',
              errorCode: 'CANCELLED',
            }
            : message
        )))
        setIsThinking(false)
        return
      }

      const errorMessage = String(event.data?.message ?? 'Nao foi possivel obter resposta da IA agora.')
      setMessages((current) => current.map((message) => (
        message.id === messageId
          ? {
            ...message,
            status: 'FAILED',
            text: errorMessage,
            contentText: errorMessage,
            errorCode: event.data?.errorCode ?? 'OPENAI_FALHA',
          }
          : message
      )))
      setIsThinking(false)
    }
  }, [conversationId, refreshMessages])

  const handleStreamError = useCallback((error) => {
    setStreamError(error instanceof Error ? error.message : 'Nao foi possivel acompanhar a resposta em tempo real.')
  }, [])

  useAiStream({
    conversationId,
    accessToken,
    enabled: enabled && Boolean(conversationId),
    onEvent: handleStreamEvent,
    onError: handleStreamError,
  })

  useEffect(() => {
    if (!enabled || !accessToken) return
    if (!autoCreateOnMount || normalizedInitialConversationId) return
    void ensureConversation().catch((error) => {
      setStreamError(error instanceof Error ? error.message : 'Nao foi possivel iniciar a conversa.')
    })
  }, [accessToken, autoCreateOnMount, enabled, ensureConversation, normalizedInitialConversationId])

  const submitMessage = useCallback(async (rawText, chips = aiChips, options = {}) => {
    const { allowWhileAwaiting = false } = options
    const text = String(rawText ?? '').trim()

    if (!enabled || !accessToken) return false
    if (isHydratingConversation) return false
    if (isAwaitingInitialSubmit && !allowWhileAwaiting) return false
    if (isThinking) return false
    if (!text && !hasComposerContext(chips)) return false

    const localSnapshot = snapshotComposerContext(chips)
    try {
      const ensuredConversation = await ensureConversation()
      const targetConversationId = ensuredConversation?.id
      if (!targetConversationId) return false

      const contextSnapshot = await uploadComposerAttachments(localSnapshot, chips, {
        token: accessToken,
      })

      const acceptedMessage = await createIntelligenceMessage(
        targetConversationId,
        buildCreateMessagePayload({ text, contextSnapshot }),
        { token: accessToken },
      )

      setMessages((current) => [
        ...current,
        createOptimisticUserMessage({
          id: acceptedMessage.userMessageId,
          text,
          contextSnapshot,
        }),
        createOptimisticAssistantPlaceholder({
          id: acceptedMessage.assistantMessageId,
        }),
      ])

      if (typeof setAiChips === 'function') {
        setAiChips(keepComposerInlineChips(chips))
      }

      setIsThinking(true)
      setStreamError('')
      if (ensuredConversation.created && typeof onConversationCreated === 'function') {
        onConversationCreated(targetConversationId)
      }
      return true
    } catch (error) {
      setStreamError(error instanceof Error ? error.message : 'Nao foi possivel enviar a mensagem agora.')
      return false
    }
  }, [
    accessToken,
    aiChips,
    enabled,
    ensureConversation,
    isHydratingConversation,
    isAwaitingInitialSubmit,
    isThinking,
    onConversationCreated,
    setAiChips,
  ])

  useEffect(() => {
    if (initialPromptProcessedRef.current) return
    if (!enabled) return
    if (normalizedInitialConversationId) {
      initialPromptProcessedRef.current = true
      setIsAwaitingInitialSubmit(false)
      return undefined
    }

    const prompt = String(initialPrompt ?? '').trim()
    const shouldSubmitComposer = Boolean(initialSubmitComposer)
    if (!prompt && !shouldSubmitComposer) {
      setIsAwaitingInitialSubmit(false)
      return undefined
    }

    setIsAwaitingInitialSubmit(true)

    const timer = setTimeout(() => {
      if (initialPromptProcessedRef.current) return
      void submitMessage(prompt, aiChips, { allowWhileAwaiting: true }).then((didSubmit) => {
        if (didSubmit) {
          initialPromptProcessedRef.current = true
          setIsAwaitingInitialSubmit(false)
          return
        }
        if (isThinking) return
        initialPromptProcessedRef.current = true
        setIsAwaitingInitialSubmit(false)
      })
    }, Math.max(0, initialSubmitDelayMs))

    return () => {
      clearTimeout(timer)
    }
  }, [
    aiChips,
    enabled,
    initialPrompt,
    initialSubmitComposer,
    initialSubmitDelayMs,
    isThinking,
    normalizedInitialConversationId,
    submitMessage,
  ])

  useEffect(() => {
    if (!conversationId || !accessToken || !isThinking) return undefined

    const timer = setInterval(() => {
      void refreshMessages(conversationId)
    }, STREAM_SYNC_POLL_MS)

    return () => {
      clearInterval(timer)
    }
  }, [accessToken, conversationId, isThinking, refreshMessages])

  const selectConversation = useCallback(async (targetConversationId) => {
    if (!accessToken || !targetConversationId) return false
    if (isThinking) return false

    const normalizedId = String(targetConversationId)
    if (normalizedId === conversationId) {
      return true
    }

    conversationPromiseRef.current = null
    hydratedConversationIdRef.current = normalizedId
    initialPromptProcessedRef.current = true
    setConversationId(normalizedId)
    setMessages([])
    setIsThinking(false)
    setStreamError('')
    setIsHydratingConversation(true)
    setIsAwaitingInitialSubmit(false)

    try {
      await refreshMessages(normalizedId)
      setIsHydratingConversation(false)
      return true
    } catch (error) {
      setStreamError(error instanceof Error ? error.message : 'Nao foi possivel carregar a conversa.')
      setIsHydratingConversation(false)
      return false
    }
  }, [accessToken, conversationId, isThinking, refreshMessages])

  const hasConversation = messages.length > 0 || isThinking || isAwaitingInitialSubmit || isHydratingConversation

  const canSubmitWith = useCallback((draftText, chips = aiChips) => {
    if (!enabled || !accessToken) return false
    if (isThinking || isAwaitingInitialSubmit || isHydratingConversation) return false
    return Boolean(String(draftText ?? '').trim()) || hasComposerContext(chips)
  }, [accessToken, aiChips, enabled, isAwaitingInitialSubmit, isHydratingConversation, isThinking])

  const cancelActiveGeneration = useCallback(async () => {
    if (!accessToken || !conversationId || !isThinking) return false

    const pendingAssistant = [...messages].reverse().find((message) => {
      const status = String(message.status ?? '').toUpperCase()
      return message.role === 'assistant' && (status === 'PENDING' || status === 'STREAMING')
    })

    if (!pendingAssistant?.id) return false

    try {
      await cancelIntelligenceMessage(conversationId, pendingAssistant.id, { token: accessToken })
      setMessages((current) => current.map((message) => (
        message.id === pendingAssistant.id
          ? {
            ...message,
            status: 'CANCELLED',
            text: 'Resposta cancelada.',
            contentText: 'Resposta cancelada.',
            errorCode: 'CANCELLED',
          }
          : message
      )))
      setIsThinking(false)
      return true
    } catch (error) {
      setStreamError(error instanceof Error ? error.message : 'Nao foi possivel cancelar a resposta.')
      return false
    }
  }, [accessToken, conversationId, isThinking, messages])

  return {
    conversationId,
    messages,
    isThinking,
    isHydratingConversation,
    hasConversation,
    streamError,
    submitMessage,
    cancelActiveGeneration,
    selectConversation,
    canSubmitWith,
    refreshMessages,
  }
}
