import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
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
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].contextSnapshot.imageAttachments).toHaveLength(1)
    expect(setAiChips).toHaveBeenCalledWith([
      expect.objectContaining({ kind: 'connector', label: 'GitHub' }),
    ])
    expect(result.current.isThinking).toBe(true)

    await waitFor(() => {
      expect(result.current.isThinking).toBe(false)
    })

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[1].role).toBe('assistant')
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
