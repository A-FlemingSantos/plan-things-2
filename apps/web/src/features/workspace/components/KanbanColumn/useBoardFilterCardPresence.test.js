import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useBoardFilterCardPresence } from './useBoardFilterCardPresence.js'

const cards = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B' },
  { id: 'c', title: 'C' },
]

function matching(...ids) {
  return new Set(ids)
}

describe('useBoardFilterCardPresence', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps every card visible when matching ids are null', () => {
    const { result } = renderHook(() => useBoardFilterCardPresence(cards, null, false))

    expect(result.current.displayCards.map((card) => card.id)).toEqual(['a', 'b', 'c'])
    expect(result.current.getMotion('a')).toBe('in')
  })

  it('marks filtered-out cards as exiting until motion completes', () => {
    const { result, rerender } = renderHook(
      ({ matchingCardIds }) => useBoardFilterCardPresence(cards, matchingCardIds, false),
      { initialProps: { matchingCardIds: null } },
    )

    rerender({ matchingCardIds: matching('a', 'c') })

    expect(result.current.displayCards.map((card) => card.id)).toEqual(['a', 'b', 'c'])
    expect(result.current.getMotion('b')).toBe('exiting')
    expect(result.current.getMotion('a')).toBe('in')

    act(() => {
      result.current.completeMotion('b')
    })

    expect(result.current.displayCards.map((card) => card.id)).toEqual(['a', 'c'])
    expect(result.current.getMotion('b')).toBe('in')
  })

  it('does not start enter or exit while paused', () => {
    const { result, rerender } = renderHook(
      ({ matchingCardIds, paused }) => useBoardFilterCardPresence(cards, matchingCardIds, paused),
      { initialProps: { matchingCardIds: null, paused: true } },
    )

    rerender({ matchingCardIds: matching('a'), paused: true })

    expect(result.current.displayCards.map((card) => card.id)).toEqual(['a', 'b', 'c'])
    expect(result.current.getMotion('b')).toBe('in')
    expect(result.current.getMotion('c')).toBe('in')
  })

  it('skips exit animation when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', (query) => ({
      matches: String(query).includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const { result, rerender } = renderHook(
      ({ matchingCardIds }) => useBoardFilterCardPresence(cards, matchingCardIds, false),
      { initialProps: { matchingCardIds: null } },
    )

    rerender({ matchingCardIds: matching('a') })

    expect(result.current.displayCards.map((card) => card.id)).toEqual(['a'])
  })
})
