import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useIntelligenceComposerContext } from './useIntelligenceComposerContext.js'

const plansMock = vi.hoisted(() => ({
  plans: [],
}))

vi.mock('../../workspace/context/PlansContext.jsx', () => ({
  usePlans: () => plansMock,
}))

describe('useIntelligenceComposerContext', () => {
  it('returns workspace plans for non-board surfaces', () => {
    plansMock.plans = [
      { id: 'plan-1', name: 'Sprint 3' },
      { id: 'plan-2', name: 'Design System' },
    ]

    const { result } = renderHook(() => useIntelligenceComposerContext({ scope: 'chat' }))

    expect(result.current.planOptions).toEqual(plansMock.plans)
    expect(result.current.boardCards).toBeUndefined()
  })

  it('maps board columns into board card options for board surfaces', () => {
    plansMock.plans = [{ id: 'plan-1', name: 'Sprint 3' }]

    const { result } = renderHook(() => useIntelligenceComposerContext({
      scope: 'board',
      boardColumns: [
        {
          id: 'col-1',
          title: 'Em progresso',
          cards: [
            { id: 'card-1', title: 'Login UI' },
            { id: 'card-2', title: 'Onboarding copy' },
          ],
        },
      ],
    }))

    expect(result.current.planOptions).toEqual(plansMock.plans)
    expect(result.current.boardCards).toEqual([
      { id: 'card-1', title: 'Login UI', columnTitle: 'Em progresso' },
      { id: 'card-2', title: 'Onboarding copy', columnTitle: 'Em progresso' },
    ])
  })
})
