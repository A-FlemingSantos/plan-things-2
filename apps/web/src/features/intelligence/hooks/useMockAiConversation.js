import { useCallback, useEffect, useRef, useState } from 'react'
import { buildMockIntelligenceReply } from '../mock/buildMockIntelligenceReply.js'
import {
  hasComposerContext,
  keepComposerInlineChips,
  snapshotComposerContext,
} from '../utils/snapshotComposerContext.js'

const DEFAULT_MOCK_REPLY_DELAY_MS = 550

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
  mockReplyDelayMs = DEFAULT_MOCK_REPLY_DELAY_MS,
} = {}) {
  const [messages, setMessages] = useState([])
  const [isThinking, setIsThinking] = useState(false)
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
    if (!prompt) return

    initialPromptProcessedRef.current = true
    submitMessage(prompt)
  }, [initialPrompt, submitMessage])

  useEffect(() => () => {
    clearResponseTimer()
  }, [clearResponseTimer])

  const hasConversation = messages.length > 0 || isThinking

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
