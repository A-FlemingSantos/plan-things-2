import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useResolvedPlanRoute } from './useResolvedPlanRoute.js'

const plansState = vi.hoisted(() => ({
  plans: [],
  activePlanId: null,
  getPlanById: vi.fn(),
  selectPlan: vi.fn(),
}))

vi.mock('../context/PlansContext.jsx', () => ({
  usePlans: () => plansState,
}))

function RouteProbe() {
  const { planId } = useParams()
  const location = useLocation()
  const { activePlan } = useResolvedPlanRoute({
    planId,
    buildPath: (nextPlanId) => `/workspace/board/${nextPlanId}`,
  })

  return (
    <>
      <div data-testid="pathname">{location.pathname}</div>
      <div data-testid="active-plan-id">{activePlan?.id ?? 'none'}</div>
    </>
  )
}

describe('useResolvedPlanRoute', () => {
  beforeEach(() => {
    const plans = [
      { id: '8eec7f69-6bdb-4222-8b74-5f2e2f3f8264', name: 'Plano real 1' },
      { id: 'd8b16b14-b735-4676-a2b4-c9a65c6f6ab3', name: 'Plano real 2' },
    ]

    plansState.plans = plans
    plansState.activePlanId = plans[1].id
    plansState.selectPlan.mockReset()
    plansState.getPlanById.mockImplementation((planId) => plans.find((plan) => plan.id === planId) ?? null)
  })

  it('replaces legacy demo plan ids with a valid backend plan id', async () => {
    render(
      <MemoryRouter initialEntries={['/workspace/board/product-launch-q3']}>
        <Routes>
          <Route path="/workspace/board/:planId" element={<RouteProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('pathname')).toHaveTextContent('/workspace/board/d8b16b14-b735-4676-a2b4-c9a65c6f6ab3')
    })

    expect(screen.getByTestId('active-plan-id')).toHaveTextContent('d8b16b14-b735-4676-a2b4-c9a65c6f6ab3')
    expect(plansState.selectPlan).not.toHaveBeenCalled()
  })
})
