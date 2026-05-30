import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createCompletedAssistantMessage,
  createOptimisticAssistantPlaceholder,
  createOptimisticUserMessage,
  createThreadMessageId,
} from '../../../shared/contracts/intelligenceContracts.js'
import { buildMockIntelligenceReply } from '../mock/buildMockIntelligenceReply.js'
import {
  hasComposerContext,
  keepComposerInlineChips,
  snapshotComposerContext,
} from '../utils/snapshotComposerContext.js'

const DEFAULT_MOCK_REPLY_DELAY_MS = 550
const WORKSPACE_LAYOUT_SUBMIT_DELAY_MS = 480

/**
 * Shared mock conversation state for Intelligence surfaces (chat page, workspace, kanban).
 */
export function useMockAiConversation({
  aiChips = [],
  setAiChips,
  initialPrompt = null,
  initialSubmitComposer = false,
  initialSubmitDelayMs = initialSubmitComposer ? WORKSPACE_LAYOUT_SUBMIT_DELAY_MS : 0,
  mockReplyDelayMs = DEFAULT_MOCK_REPLY_DELAY_MS,
} = {}) {
  const [messages, setMessages] = useState([])
  const [isThinking, setIsThinking] = useState(false)
  const willSubmitOnMount = Boolean(
    String(initialPrompt ?? '').trim() || initialSubmitComposer,
  )
  const [isAwaitingInitialSubmit, setIsAwaitingInitialSubmit] = useState(willSubmitOnMount)
  const responseTimerRef = useRef(null)
  const initialPromptProcessedRef = useRef(false)

  const clearResponseTimer = useCallback(() => {
    if (!responseTimerRef.current) return
    clearTimeout(responseTimerRef.current)
    responseTimerRef.current = null
  }, [])

  const submitMessage = useCallback((rawText, chips = aiChips, options = {}) => {
    const { allowWhileAwaiting = false } = options
    const text = String(rawText ?? '').trim()
    if (isAwaitingInitialSubmit && !allowWhileAwaiting) return false
    if (isThinking) return false
    if (!text && !hasComposerContext(chips)) return false

    const contextSnapshot = snapshotComposerContext(chips)
    const userMessageId = createThreadMessageId('user')
    const assistantMessageId = createThreadMessageId('assistant')

    setMessages((current) => [
      ...current,
      createOptimisticUserMessage({
        id: userMessageId,
        text,
        contextSnapshot,
      }),
      createOptimisticAssistantPlaceholder({
        id: assistantMessageId,
      }),
    ])

    if (typeof setAiChips === 'function') {
      setAiChips(keepComposerInlineChips(chips))
    }

    setIsThinking(true)
    clearResponseTimer()

    responseTimerRef.current = setTimeout(() => {
      setMessages((current) => current.map((message) => (
        message.id === assistantMessageId
          ? createCompletedAssistantMessage({
            id: assistantMessageId,
            text: buildMockIntelligenceReply(text),
          })
          : message
      )))
      setIsThinking(false)
      responseTimerRef.current = null
    }, mockReplyDelayMs)

    return true
  }, [aiChips, clearResponseTimer, isAwaitingInitialSubmit, isThinking, mockReplyDelayMs, setAiChips])

  useEffect(() => {
    if (initialPromptProcessedRef.current) return

    const prompt = String(initialPrompt ?? '').trim()
    const shouldSubmitComposer = Boolean(initialSubmitComposer)
    if (!prompt && !shouldSubmitComposer) {
      setIsAwaitingInitialSubmit(false)
      return undefined
    }

    setIsAwaitingInitialSubmit(true)

    const timer = setTimeout(() => {
      if (initialPromptProcessedRef.current) return
      const didSubmit = submitMessage(prompt, aiChips, { allowWhileAwaiting: true })
      if (didSubmit) {
        initialPromptProcessedRef.current = true
        setIsAwaitingInitialSubmit(false)
        return
      }
      // If submit failed only because another reply is pending, keep waiting and retry on next render.
      if (isThinking) return
      initialPromptProcessedRef.current = true
      setIsAwaitingInitialSubmit(false)
    }, Math.max(0, initialSubmitDelayMs))

    return () => {
      clearTimeout(timer)
    }
  }, [aiChips, initialPrompt, initialSubmitComposer, initialSubmitDelayMs, isThinking, submitMessage])

  useEffect(() => () => {
    clearResponseTimer()
  }, [clearResponseTimer])

  const hasConversation = messages.length > 0 || isThinking || isAwaitingInitialSubmit

  const canSubmitWith = useCallback((draftText, chips = aiChips) => {
    if (isThinking || isAwaitingInitialSubmit) return false
    return Boolean(String(draftText ?? '').trim()) || hasComposerContext(chips)
  }, [aiChips, isAwaitingInitialSubmit, isThinking])

  return {
    messages,
    isThinking,
    hasConversation,
    submitMessage,
    canSubmitWith,
  }
}
