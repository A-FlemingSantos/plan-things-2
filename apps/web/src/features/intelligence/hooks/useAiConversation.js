import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildCreateMessagePayload,
  createOptimisticAssistantPlaceholder,
  createOptimisticUserMessage,
  isThreadMessageThinking,
  mapApiMessageToThreadMessage,
} from '../../../shared/contracts/intelligenceContracts.js'
import {
  createIntelligenceConversation,
  createIntelligenceMessage,
  listIntelligenceMessages,
} from '../api/intelligenceApi.js'
import {
  hasComposerContext,
  keepComposerInlineChips,
  snapshotComposerContext,
} from '../utils/snapshotComposerContext.js'
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

    if (!localHasText) {
      return message
    }

    return {
      ...message,
      status: localStatus,
      text: localMessage.text,
      contentText: localMessage.contentText,
    }
  })
}

export function useAiConversation({
  accessToken = null,
  scope = {},
  enabled = true,
  aiChips = [],
  setAiChips,
  initialPrompt = null,
  initialSubmitComposer = false,
  initialSubmitDelayMs = initialSubmitComposer ? WORKSPACE_LAYOUT_SUBMIT_DELAY_MS : 0,
} = {}) {
  const sessionScopeKey = `${accessToken ?? 'anonymous'}:${scope?.planId ?? ''}:${scope?.cardId ?? ''}`
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [isThinking, setIsThinking] = useState(false)
  const willSubmitOnMount = Boolean(String(initialPrompt ?? '').trim() || initialSubmitComposer)
  const [isAwaitingInitialSubmit, setIsAwaitingInitialSubmit] = useState(willSubmitOnMount)
  const [streamError, setStreamError] = useState('')
  const conversationPromiseRef = useRef(null)
  const initialPromptProcessedRef = useRef(false)
  const lastSessionScopeKeyRef = useRef(sessionScopeKey)

  useEffect(() => {
    if (lastSessionScopeKeyRef.current === sessionScopeKey) {
      return
    }

    lastSessionScopeKeyRef.current = sessionScopeKey
    conversationPromiseRef.current = null
    initialPromptProcessedRef.current = false
    setConversationId(null)
    setMessages([])
    setIsThinking(false)
    setStreamError('')
    setIsAwaitingInitialSubmit(willSubmitOnMount)
  }, [sessionScopeKey, willSubmitOnMount])

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

  const ensureConversation = useCallback(async () => {
    if (!accessToken || !enabled) {
      return null
    }
    if (conversationId) {
      return conversationId
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
        return nextConversationId
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

    if (event.event === 'assistant.completed') {
      void refreshMessages(String(event.data?.conversationId ?? conversationId ?? '')).catch(() => {})
      return
    }

    if (event.event === 'assistant.failed') {
      const messageId = String(event.data?.messageId ?? '')
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
    void ensureConversation().catch((error) => {
      setStreamError(error instanceof Error ? error.message : 'Nao foi possivel iniciar a conversa.')
    })
  }, [accessToken, enabled, ensureConversation])

  const submitMessage = useCallback(async (rawText, chips = aiChips, options = {}) => {
    const { allowWhileAwaiting = false } = options
    const text = String(rawText ?? '').trim()

    if (!enabled || !accessToken) return false
    if (isAwaitingInitialSubmit && !allowWhileAwaiting) return false
    if (isThinking) return false
    if (!text && !hasComposerContext(chips)) return false

    const contextSnapshot = snapshotComposerContext(chips)
    try {
      const targetConversationId = await ensureConversation()
      if (!targetConversationId) return false

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
    isAwaitingInitialSubmit,
    isThinking,
    setAiChips,
  ])

  useEffect(() => {
    if (initialPromptProcessedRef.current) return
    if (!enabled) return

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
  }, [aiChips, enabled, initialPrompt, initialSubmitComposer, initialSubmitDelayMs, isThinking, submitMessage])

  useEffect(() => {
    if (!conversationId || !accessToken || !isThinking) return undefined

    const timer = setInterval(() => {
      void refreshMessages(conversationId)
    }, STREAM_SYNC_POLL_MS)

    return () => {
      clearInterval(timer)
    }
  }, [accessToken, conversationId, isThinking, refreshMessages])

  const hasConversation = messages.length > 0 || isThinking || isAwaitingInitialSubmit

  const canSubmitWith = useCallback((draftText, chips = aiChips) => {
    if (!enabled || !accessToken) return false
    if (isThinking || isAwaitingInitialSubmit) return false
    return Boolean(String(draftText ?? '').trim()) || hasComposerContext(chips)
  }, [accessToken, aiChips, enabled, isAwaitingInitialSubmit, isThinking])

  return {
    conversationId,
    messages,
    isThinking,
    hasConversation,
    streamError,
    submitMessage,
    canSubmitWith,
    refreshMessages,
  }
}
