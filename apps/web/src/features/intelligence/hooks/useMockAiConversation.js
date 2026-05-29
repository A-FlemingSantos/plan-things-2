import { useCallback, useEffect, useRef, useState } from 'react'
import { buildMockIntelligenceReply } from '../mock/buildMockIntelligenceReply.js'
import {
  hasComposerContext,
  keepComposerInlineChips,
  snapshotComposerContext,
} from '../utils/snapshotComposerContext.js'

const DEFAULT_MOCK_REPLY_DELAY_MS = 550
const WORKSPACE_LAYOUT_SUBMIT_DELAY_MS = 480

function createMessageId(role) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

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

  const submitMessage = useCallback((rawText, chips = aiChips) => {
    const text = String(rawText ?? '').trim()
    if (isThinking) return false
    if (!text && !hasComposerContext(chips)) return false

    const contextSnapshot = snapshotComposerContext(chips)

    setMessages((current) => [
      ...current,
      {
        id: createMessageId('user'),
        role: 'user',
        text,
        contextSnapshot,
      },
    ])

    if (typeof setAiChips === 'function') {
      setAiChips(keepComposerInlineChips(chips))
    }

    setIsThinking(true)
    clearResponseTimer()

    responseTimerRef.current = setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId('assistant'),
          role: 'assistant',
          text: buildMockIntelligenceReply(text),
        },
      ])
      setIsThinking(false)
      responseTimerRef.current = null
    }, mockReplyDelayMs)

    return true
  }, [aiChips, clearResponseTimer, isThinking, mockReplyDelayMs, setAiChips])

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
      initialPromptProcessedRef.current = true
      setIsAwaitingInitialSubmit(false)
      submitMessage(prompt)
    }, Math.max(0, initialSubmitDelayMs))

    return () => {
      clearTimeout(timer)
    }
  }, [initialPrompt, initialSubmitComposer, initialSubmitDelayMs, submitMessage])

  useEffect(() => () => {
    clearResponseTimer()
  }, [clearResponseTimer])

  const hasConversation = messages.length > 0 || isThinking || isAwaitingInitialSubmit

  const canSubmitWith = useCallback((draftText, chips = aiChips) => {
    if (isThinking) return false
    return Boolean(String(draftText ?? '').trim()) || hasComposerContext(chips)
  }, [aiChips, isThinking])

  return {
    messages,
    isThinking,
    hasConversation,
    submitMessage,
    canSubmitWith,
  }
}
