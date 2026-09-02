import { render, screen, waitFor } from '@testing-library/react'
import { Route, Routes, useLocation, useParams } from 'react-router-dom'
import { ApiClientError } from '../../../shared/api/apiClient.js'
import { TestMemoryRouter } from '../../../test/testRouter.jsx'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useResolvedPlanRoute } from './useResolvedPlanRoute.js'

const plansState = vi.hoisted(() => ({
  plans: [],
  activePlanId: null,
  getPlanById: vi.fn(),
  selectPlan: vi.fn(),
  loadPlanByKey: vi.fn(),
  isLoading: false,
}))

vi.mock('../context/PlansContext.jsx', () => ({
  usePlans: () => plansState,
}))

function RouteProbe() {
  const { planId } = useParams()
  const location = useLocation()
  const { activePlan } = useResolvedPlanRoute({
    planId,
    buildPath: (nextPlan) => {
      if (typeof nextPlan === 'object') {
        return `/workspace/board/${nextPlan.slug || nextPlan.id}`
      }
      return `/workspace/board/${nextPlan}`
    },
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
      { id: '8eec7f69-6bdb-4222-8b74-5f2e2f3f8264', slug: 'plano-real-1', name: 'Plano real 1' },
      { id: 'd8b16b14-b735-4676-a2b4-c9a65c6f6ab3', slug: 'plano-real-2', name: 'Plano real 2' },
    ]

    plansState.plans = plans
    plansState.activePlanId = plans[1].id
    plansState.isLoading = false
    plansState.selectPlan.mockReset()
    plansState.loadPlanByKey.mockReset()
    plansState.loadPlanByKey.mockRejectedValue(new Error('not found'))
    plansState.getPlanById.mockImplementation((planId) => (
      plans.find((plan) => plan.id === planId || plan.slug === planId) ?? null
    ))
  })

  it('canonicalizes uuid urls to the plan slug', async () => {
    render(
      <TestMemoryRouter initialEntries={['/workspace/board/d8b16b14-b735-4676-a2b4-c9a65c6f6ab3']}>
        <Routes>
          <Route path="/workspace/board/:planId" element={<RouteProbe />} />
        </Routes>
      </TestMemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('pathname')).toHaveTextContent('/workspace/board/plano-real-2')
    })

    expect(screen.getByTestId('active-plan-id')).toHaveTextContent('d8b16b14-b735-4676-a2b4-c9a65c6f6ab3')
  })

  it('sends anonymous visitors of a private board to login', async () => {
    plansState.getPlanById.mockReturnValue(null)
    plansState.loadPlanByKey.mockRejectedValue(new ApiClientError('Faça login.', { status: 401 }))

    render(
      <TestMemoryRouter initialEntries={['/workspace/board/quadro-particular']}>
        <Routes>
          <Route path="/workspace/board/:planId" element={<RouteProbe />} />
          <Route path="/login" element={<div data-testid="login">login</div>} />
        </Routes>
      </TestMemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('login')).toBeInTheDocument()
    })
  })

  it('keeps a signed-in observer on the board url', async () => {
    const observerPlan = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      slug: 'quadro-da-equipe',
      name: 'Quadro da equipe',
      role: 'OBSERVER',
    }
    plansState.plans = [observerPlan]
    plansState.activePlanId = observerPlan.id
    plansState.getPlanById.mockImplementation((planId) => (
      planId === observerPlan.id || planId === observerPlan.slug ? observerPlan : null
    ))

    render(
      <TestMemoryRouter initialEntries={['/workspace/board/quadro-da-equipe']}>
        <Routes>
          <Route path="/workspace/board/:planId" element={<RouteProbe />} />
        </Routes>
      </TestMemoryRouter>,
    )

    expect(screen.getByTestId('pathname')).toHaveTextContent('/workspace/board/quadro-da-equipe')
    expect(screen.getByTestId('active-plan-id')).toHaveTextContent(observerPlan.id)
    expect(plansState.loadPlanByKey).not.toHaveBeenCalled()
  })
})
