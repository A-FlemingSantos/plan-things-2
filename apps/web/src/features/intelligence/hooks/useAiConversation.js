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

const STREAM_SYNC_POLL_MS = 900

function createFailedAssistantMessage(message) {
  const text = String(message ?? 'Nao foi possivel enviar a mensagem agora.')
  const id = `assistant-failed-${Date.now()}`
  return {
    id,
    clientKey: id,
    conversationId: null,
    role: 'assistant',
    status: 'FAILED',
    text,
    contentText: text,
    contextSnapshot: null,
    blocks: [],
    inlineArtifacts: [],
    errorCode: 'MESSAGE_SEND_FAILED',
    openaiResponseId: null,
    createdAt: null,
  }
}

function withLocalMessageIdentity(message, clientKey = message?.id) {
  return {
    ...message,
    clientKey: String(clientKey ?? message?.id ?? ''),
    localEcho: true,
    displayText: message?.displayText ?? message?.text ?? '',
    displayContextSnapshot: message?.displayContextSnapshot ?? message?.contextSnapshot ?? null,
  }
}

function preserveLocalUiState(message, localMessage) {
  if (!localMessage) return message

  return {
    ...message,
    clientKey: localMessage.clientKey ?? message.clientKey,
    localEcho: localMessage.localEcho === true ? true : message.localEcho,
    displayText: localMessage.displayText ?? message.displayText,
    displayContextSnapshot: localMessage.displayContextSnapshot ?? message.displayContextSnapshot,
  }
}

function normalizeMessageText(message) {
  return String(message?.displayText ?? message?.text ?? message?.contentText ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

function findMatchingLocalUserMessage(message, currentMessages, usedLocalIds) {
  if (message?.role !== 'user') return null

  const remoteText = normalizeMessageText(message)
  if (!remoteText) return null

  return currentMessages.find((localMessage) => (
    localMessage.role === 'user'
    && localMessage.localEcho === true
    && !usedLocalIds.has(localMessage.id)
    && normalizeMessageText(localMessage) === remoteText
  )) ?? null
}

function dedupeThreadMessages(messages = []) {
  const seenIds = new Set()
  const seenClientKeys = new Set()

  return messages.filter((message) => {
    const id = String(message?.id ?? '')
    const clientKey = String(message?.clientKey ?? '')
    if (id && seenIds.has(id)) return false
    if (clientKey && seenClientKeys.has(clientKey)) return false
    if (id) seenIds.add(id)
    if (clientKey) seenClientKeys.add(clientKey)
    return true
  })
}

function mergeMessagesWithLocalContext(nextMessages, currentMessages) {
  const currentById = new Map(currentMessages.map((message) => [message.id, message]))

  return nextMessages.map((message) => {
    const localMessage = currentById.get(message.id)
    const messageWithStableUi = preserveLocalUiState(message, localMessage)

    if (messageWithStableUi.role !== 'user' || messageWithStableUi.contextSnapshot) {
      return messageWithStableUi
    }

    if (!localMessage?.contextSnapshot) {
      return messageWithStableUi
    }

    return {
      ...messageWithStableUi,
      contextSnapshot: localMessage.contextSnapshot,
    }
  })
}

function mergeUniqueBlocks(localBlocks = [], remoteBlocks = [], { skipRemoteMarkdown = false } = {}) {
  const nextBlocks = [...localBlocks]
  const existingIds = new Set(nextBlocks.map((block) => block.id).filter(Boolean))
  const existingSignatures = new Set(nextBlocks.map((block) => `${block.type}:${block.position}`))

  remoteBlocks.forEach((block) => {
    if (skipRemoteMarkdown && block.type === 'MARKDOWN') {
      return
    }

    const hasSameId = block.id && existingIds.has(block.id)
    const hasSamePosition = existingSignatures.has(`${block.type}:${block.position}`)
    if (hasSameId || hasSamePosition) {
      return
    }

    nextBlocks.push(block)
    if (block.id) existingIds.add(block.id)
    existingSignatures.add(`${block.type}:${block.position}`)
  })

  return nextBlocks.sort((left, right) => left.position - right.position)
}

function mergeUniqueInlineArtifacts(localArtifacts = [], remoteArtifacts = []) {
  const nextArtifacts = [...localArtifacts]
  const existingIds = new Set(nextArtifacts.map((artifact) => artifact.id).filter(Boolean))
  const existingSignatures = new Set(nextArtifacts.map((artifact) => `${artifact.type}:${artifact.position}`))

  remoteArtifacts.forEach((artifact) => {
    const hasSameId = artifact.id && existingIds.has(artifact.id)
    const hasSamePosition = existingSignatures.has(`${artifact.type}:${artifact.position}`)
    if (hasSameId || hasSamePosition) {
      return
    }

    nextArtifacts.push(artifact)
    if (artifact.id) existingIds.add(artifact.id)
    existingSignatures.add(`${artifact.type}:${artifact.position}`)
  })

  return nextArtifacts.sort((left, right) => left.position - right.position)
}

function mergeMessagesPreservingStreaming(nextMessages, currentMessages, { preserveLocalStreaming = false } = {}) {
  const currentById = new Map(currentMessages.map((message) => [message.id, message]))
  const nextIds = new Set(nextMessages.map((message) => message.id))
  const matchedLocalIds = new Set()

  const mergedMessages = nextMessages.map((message) => {
    const localMessage = currentById.get(message.id)
      ?? findMatchingLocalUserMessage(message, currentMessages, matchedLocalIds)
    if (!localMessage) {
      return message
    }
    matchedLocalIds.add(localMessage.id)
    const messageWithStableUi = preserveLocalUiState(message, localMessage)

    const localStatus = String(localMessage.status ?? '').toUpperCase()
    const remoteStatus = String(messageWithStableUi.status ?? '').toUpperCase()
    const remoteHasText = Boolean(String(messageWithStableUi.contentText ?? messageWithStableUi.text ?? '').trim())
    const localHasText = Boolean(String(localMessage.contentText ?? localMessage.text ?? '').trim())

    if (localStatus !== 'STREAMING' && localStatus !== 'PENDING') {
      return messageWithStableUi
    }

    if (!preserveLocalStreaming && (remoteStatus === 'COMPLETED' || remoteHasText)) {
      return messageWithStableUi
    }

    if (!localHasText && (!Array.isArray(localMessage.blocks) || localMessage.blocks.length === 0)) {
      return messageWithStableUi
    }

    const remoteBlocks = Array.isArray(messageWithStableUi.blocks) ? messageWithStableUi.blocks : []
    const localBlocks = Array.isArray(localMessage.blocks) ? localMessage.blocks : []
    const remoteInlineArtifacts = Array.isArray(messageWithStableUi.inlineArtifacts) ? messageWithStableUi.inlineArtifacts : []
    const localInlineArtifacts = Array.isArray(localMessage.inlineArtifacts) ? localMessage.inlineArtifacts : []
    const shouldPreserveLocalText = localHasText && (
      !remoteHasText
      || String(localMessage.contentText ?? localMessage.text ?? '').length >= String(messageWithStableUi.contentText ?? messageWithStableUi.text ?? '').length
    )

    return {
      ...messageWithStableUi,
      status: remoteStatus || localStatus,
      text: shouldPreserveLocalText ? localMessage.text : messageWithStableUi.text,
      contentText: shouldPreserveLocalText ? localMessage.contentText : messageWithStableUi.contentText,
      blocks: mergeUniqueBlocks(localBlocks, remoteBlocks, {
        skipRemoteMarkdown: shouldPreserveLocalText,
      }),
      inlineArtifacts: mergeUniqueInlineArtifacts(localInlineArtifacts, remoteInlineArtifacts),
    }
  })

  if (!preserveLocalStreaming) {
    return mergedMessages
  }

  const localOnlyMessages = currentMessages.filter((message) => {
    if (nextIds.has(message.id)) return false
    if (matchedLocalIds.has(message.id)) return false
    const status = String(message.status ?? '').toUpperCase()
    return message.localEcho === true || status === 'PENDING' || status === 'STREAMING'
  })

  return dedupeThreadMessages([...mergedMessages, ...localOnlyMessages])
}

function completeAssistantMessageLocally(messages, messageId) {
  return messages.map((message) => {
    if (message.id !== messageId) {
      return message
    }

    return {
      ...message,
      status: 'COMPLETED',
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
  initialSubmitDelayMs = 0,
} = {}) {
  const normalizedInitialConversationId = String(initialConversationId ?? '').trim() || null
  const sessionScopeKey = `${accessToken ?? 'anonymous'}:${scope?.planId ?? ''}:${scope?.cardId ?? ''}:${normalizedInitialConversationId ?? ''}`
  const willSubmitOnMount = !normalizedInitialConversationId && Boolean(String(initialPrompt ?? '').trim() || initialSubmitComposer)
  const initialOptimisticUserMessageRef = useRef(null)
  const pendingOptimisticUserMessageIdRef = useRef(null)
  if (!initialOptimisticUserMessageRef.current && willSubmitOnMount) {
    initialOptimisticUserMessageRef.current = withLocalMessageIdentity(
      createOptimisticUserMessage({
        text: initialPrompt,
        contextSnapshot: snapshotComposerContext(aiChips),
      }),
    )
    pendingOptimisticUserMessageIdRef.current = initialOptimisticUserMessageRef.current.id
  }

  const [messages, setMessages] = useState(() => (
    initialOptimisticUserMessageRef.current ? [initialOptimisticUserMessageRef.current] : []
  ))
  const [conversationId, setConversationId] = useState(normalizedInitialConversationId)
  const [isThinking, setIsThinking] = useState(false)
  const [isHydratingConversation, setIsHydratingConversation] = useState(Boolean(normalizedInitialConversationId))
  const [isAwaitingInitialSubmit, setIsAwaitingInitialSubmit] = useState(willSubmitOnMount)
  const [streamError, setStreamError] = useState('')
  const conversationPromiseRef = useRef(null)
  const initialPromptProcessedRef = useRef(Boolean(normalizedInitialConversationId))
  const hydratedConversationIdRef = useRef(null)
  const lastSessionScopeKeyRef = useRef(sessionScopeKey)
  const locallyCreatedConversationIdRef = useRef(null)
  const submittingMessageIdsRef = useRef(new Set())

  useEffect(() => {
    if (lastSessionScopeKeyRef.current === sessionScopeKey) {
      return
    }

    lastSessionScopeKeyRef.current = sessionScopeKey
    conversationPromiseRef.current = null
    hydratedConversationIdRef.current = null
    pendingOptimisticUserMessageIdRef.current = null
    submittingMessageIdsRef.current.clear()
    initialPromptProcessedRef.current = Boolean(normalizedInitialConversationId)

    const isLocallyCreatedConversationRoute = Boolean(
      normalizedInitialConversationId
      && normalizedInitialConversationId === locallyCreatedConversationIdRef.current,
    )

    if (
      normalizedInitialConversationId
      && (normalizedInitialConversationId === conversationId || isLocallyCreatedConversationRoute)
    ) {
      if (conversationId !== normalizedInitialConversationId) {
        setConversationId(normalizedInitialConversationId)
      }
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

  const refreshMessages = useCallback(async (
    targetConversationId = conversationId,
    { preserveLocalStreaming = false } = {},
  ) => {
    if (!accessToken || !targetConversationId) return []

    const apiMessages = await listIntelligenceMessages(targetConversationId, { token: accessToken })
    const normalizedMessages = apiMessages.map(mapApiMessageToThreadMessage)

    setMessages((current) => {
      const withStreamingMerge = mergeMessagesPreservingStreaming(normalizedMessages, current, {
        preserveLocalStreaming,
      })
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
      const messageId = String(event.data?.messageId ?? '')
      if (!messageId) {
        setIsThinking(false)
        return
      }

      let shouldFetchMissingContent = false
      setMessages((current) => {
        const localMessage = current.find((message) => message.id === messageId)
        const localHasRenderableContent = Boolean(
          String(localMessage?.contentText ?? localMessage?.text ?? '').trim()
          || (Array.isArray(localMessage?.blocks) && localMessage.blocks.length > 0)
          || (Array.isArray(localMessage?.inlineArtifacts) && localMessage.inlineArtifacts.length > 0),
        )
        shouldFetchMissingContent = !localHasRenderableContent

        return completeAssistantMessageLocally(current, messageId)
      })
      setIsThinking(false)

      if (shouldFetchMissingContent) {
        void refreshMessages(String(event.data?.conversationId ?? conversationId ?? ''), {
          preserveLocalStreaming: true,
        }).catch(() => {})
      }
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
    if (isThinking && !allowWhileAwaiting) return false
    if (!text && !hasComposerContext(chips)) return false

    const localSnapshot = snapshotComposerContext(chips)
    const pendingOptimisticUserMessageId = pendingOptimisticUserMessageIdRef.current
    const optimisticUserMessage = pendingOptimisticUserMessageId
      ? null
      : withLocalMessageIdentity(createOptimisticUserMessage({
        text,
        contextSnapshot: localSnapshot,
      }))
    const optimisticUserMessageId = pendingOptimisticUserMessageId ?? optimisticUserMessage.id
    if (submittingMessageIdsRef.current.has(optimisticUserMessageId)) {
      return true
    }
    submittingMessageIdsRef.current.add(optimisticUserMessageId)

    if (optimisticUserMessage) {
      setMessages((current) => [...current, optimisticUserMessage])
    }
    setIsThinking(true)
    setStreamError('')

    try {
      const ensuredConversation = await ensureConversation()
      const targetConversationId = ensuredConversation?.id
      if (!targetConversationId) {
        setMessages((current) => [
          ...current,
          createFailedAssistantMessage('Nao foi possivel iniciar a conversa.'),
        ])
        setIsThinking(false)
        return false
      }

      const contextSnapshot = await uploadComposerAttachments(localSnapshot, chips, {
        token: accessToken,
      })

      const acceptedMessage = await createIntelligenceMessage(
        targetConversationId,
        buildCreateMessagePayload({ text, contextSnapshot }),
        { token: accessToken },
      )

      pendingOptimisticUserMessageIdRef.current = null
      setMessages((current) => {
        const acceptedUserMessage = createOptimisticUserMessage({
          id: acceptedMessage.userMessageId,
          text,
          contextSnapshot,
        })
        const localUserMessage = current.find((message) => message.id === optimisticUserMessageId)
        const acceptedUserMessageWithStableUi = withLocalMessageIdentity(
          acceptedUserMessage,
          localUserMessage?.clientKey ?? optimisticUserMessageId,
        )
        const nextMessages = current.map((message) => (
          message.id === optimisticUserMessageId ? acceptedUserMessageWithStableUi : message
        ))
        const hasAcceptedUserMessage = nextMessages.some((message) => message.id === acceptedMessage.userMessageId)
        const hasAcceptedUserClientKey = nextMessages.some((message) => (
          message.clientKey
          && message.clientKey === acceptedUserMessageWithStableUi.clientKey
        ))
        const withUserMessage = hasAcceptedUserMessage || hasAcceptedUserClientKey
          ? nextMessages
          : [...nextMessages, acceptedUserMessageWithStableUi]

        const dedupedWithUserMessage = dedupeThreadMessages(withUserMessage)

        if (dedupedWithUserMessage.some((message) => message.id === acceptedMessage.assistantMessageId)) {
          return dedupedWithUserMessage
        }

        return [
          ...dedupedWithUserMessage,
          createOptimisticAssistantPlaceholder({
            id: acceptedMessage.assistantMessageId,
          }),
        ]
      })

      if (typeof setAiChips === 'function') {
        setAiChips(keepComposerInlineChips(chips))
      }

      setIsThinking(true)
      setStreamError('')
      if (ensuredConversation.created && typeof onConversationCreated === 'function') {
        locallyCreatedConversationIdRef.current = targetConversationId
        onConversationCreated(targetConversationId)
      }
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nao foi possivel enviar a mensagem agora.'
      pendingOptimisticUserMessageIdRef.current = null
      setMessages((current) => [
        ...current,
        createFailedAssistantMessage(errorMessage),
      ])
      setIsThinking(false)
      setStreamError(errorMessage)
      return false
    } finally {
      submittingMessageIdsRef.current.delete(optimisticUserMessageId)
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
    if (!accessToken) return
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
      initialPromptProcessedRef.current = true
      void submitMessage(prompt, aiChips, { allowWhileAwaiting: true }).then((didSubmit) => {
        if (didSubmit) {
          setIsAwaitingInitialSubmit(false)
          return
        }
        if (isThinking) return
        setIsAwaitingInitialSubmit(false)
      })
    }, Math.max(0, initialSubmitDelayMs))

    return () => {
      clearTimeout(timer)
    }
  }, [
    aiChips,
    accessToken,
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
      void refreshMessages(conversationId, { preserveLocalStreaming: true })
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

  const isInitialConversationPending = Boolean(
    normalizedInitialConversationId
    && conversationId !== normalizedInitialConversationId,
  )
  const effectiveIsHydratingConversation = isHydratingConversation || isInitialConversationPending

  const hasConversation = (
    messages.length > 0
    || isThinking
    || isAwaitingInitialSubmit
    || effectiveIsHydratingConversation
  )

  const canSubmitWith = useCallback((draftText, chips = aiChips) => {
    if (!enabled || !accessToken) return false
    if (isThinking || isAwaitingInitialSubmit || effectiveIsHydratingConversation) return false
    return Boolean(String(draftText ?? '').trim()) || hasComposerContext(chips)
  }, [accessToken, aiChips, effectiveIsHydratingConversation, enabled, isAwaitingInitialSubmit, isThinking])

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
    isHydratingConversation: effectiveIsHydratingConversation,
    hasConversation,
    streamError,
    submitMessage,
    cancelActiveGeneration,
    selectConversation,
    canSubmitWith,
    refreshMessages,
  }
}
