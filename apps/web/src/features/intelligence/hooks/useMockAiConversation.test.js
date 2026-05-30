import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AI_MESSAGE_STATUSES } from '../../../shared/contracts/intelligenceContracts.js'
import { useMockAiConversation } from './useMockAiConversation.js'

describe('useMockAiConversation', () => {
  it('submits a user message, clears attachments from composer chips, and appends a mock reply', async () => {
    const setAiChips = vi.fn()
    const chips = [
      { id: '1', kind: 'file', type: 'file-a', label: 'a.png', isImage: true },
      { id: '2', kind: 'connector', type: 'github', label: 'GitHub' },
    ]

    const { result } = renderHook(() => useMockAiConversation({
      aiChips: chips,
      setAiChips,
      mockReplyDelayMs: 20,
    }))

    let submitted = false
    act(() => {
      submitted = result.current.submitMessage('Olá')
    })

    expect(submitted).toBe(true)
    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0].contextSnapshot.imageAttachments).toHaveLength(1)
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      status: AI_MESSAGE_STATUSES.PENDING,
      text: '',
      blocks: [],
    })
    expect(setAiChips).toHaveBeenCalledWith([
      expect.objectContaining({ kind: 'connector', label: 'GitHub' }),
    ])
    expect(result.current.isThinking).toBe(true)

    await waitFor(() => {
      expect(result.current.isThinking).toBe(false)
    })

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      status: AI_MESSAGE_STATUSES.COMPLETED,
      text: 'Olá',
      contentText: 'Olá',
      blocks: [],
    })
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      status: AI_MESSAGE_STATUSES.COMPLETED,
    })
    expect(result.current.messages[1].blocks.length).toBeGreaterThan(0)
    expect(result.current.messages[1].text).toBeTruthy()
    expect(result.current.hasConversation).toBe(true)
  })

  it('submits composer context on mount when initialSubmitComposer is set', async () => {
    const setAiChips = vi.fn()
    const chips = [{ id: '1', kind: 'connector', type: 'github', label: 'GitHub' }]

    const { result } = renderHook(() => useMockAiConversation({
      aiChips: chips,
      setAiChips,
      initialSubmitComposer: true,
      initialSubmitDelayMs: 0,
      mockReplyDelayMs: 20,
    }))

    await waitFor(() => {
      expect(result.current.messages[0]?.contextSnapshot?.contextChips).toHaveLength(1)
    })
  })

  it('treats pending workspace handoff as an active conversation', () => {
    const { result } = renderHook(() => useMockAiConversation({
      initialPrompt: 'Olá',
      initialSubmitComposer: true,
      initialSubmitDelayMs: 500,
    }))

    expect(result.current.hasConversation).toBe(true)
    expect(result.current.messages).toHaveLength(0)
  })

  it('keeps hasConversation during handoff when composer chips update', () => {
    const { result, rerender } = renderHook(
      ({ chips }) => useMockAiConversation({
        aiChips: chips,
        initialPrompt: 'Olá',
        initialSubmitComposer: true,
        initialSubmitDelayMs: 500,
      }),
      { initialProps: { chips: [] } },
    )

    expect(result.current.hasConversation).toBe(true)

    rerender({ chips: [{ id: '1', kind: 'connector', type: 'github', label: 'GitHub' }] })

    expect(result.current.hasConversation).toBe(true)
    expect(result.current.messages).toHaveLength(0)
  })

  it('blocks manual submit during pending handoff and preserves initial prompt', () => {
    vi.useFakeTimers()
    try {
      const { result } = renderHook(() => useMockAiConversation({
        initialPrompt: 'from-workspace',
        initialSubmitComposer: true,
        initialSubmitDelayMs: 480,
        mockReplyDelayMs: 20,
      }))

      expect(result.current.canSubmitWith('manual')).toBe(false)

      let submitted = true
      act(() => {
        submitted = result.current.submitMessage('manual')
      })
      expect(submitted).toBe(false)

      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(result.current.messages[0]?.text).toBe('from-workspace')
    } finally {
      vi.useRealTimers()
    }
  })

  it('clears pending handoff when there is no prompt or composer context to submit', () => {
    vi.useFakeTimers()
    try {
      const { result } = renderHook(() => useMockAiConversation({
        aiChips: [],
        initialSubmitComposer: true,
        initialSubmitDelayMs: 60,
      }))

      expect(result.current.hasConversation).toBe(true)
      act(() => {
        vi.advanceTimersByTime(80)
      })
      expect(result.current.hasConversation).toBe(false)
      expect(result.current.messages).toHaveLength(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('processes initialPrompt on mount', async () => {
    const { result } = renderHook(() => useMockAiConversation({
      initialPrompt: 'Primeira mensagem',
      mockReplyDelayMs: 20,
    }))

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThanOrEqual(1)
    })

    expect(result.current.messages[0].text).toBe('Primeira mensagem')
  })
})
