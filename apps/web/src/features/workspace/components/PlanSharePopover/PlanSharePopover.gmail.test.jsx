import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PlanSharePopover from './PlanSharePopover.jsx'

const apiMock = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}))

vi.mock('../../../../shared/api/apiClient.js', () => ({
  apiRequest: (...args) => apiMock.apiRequest(...args),
}))

vi.mock('../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx', () => ({
  default: ({ fallback = 'PT' }) => <span>{fallback}</span>,
}))

vi.mock('../../../../shared/hooks/useAuthenticatedImageUrl.js', () => ({
  useAuthenticatedImageUrl: () => null,
}))

vi.mock('../PlanRoleSelect/PlanRoleSelect.jsx', () => ({
  default: ({ value, onChange, disabled, ariaLabel }) => (
    <select
      aria-label={ariaLabel}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="MEMBER">Membro</option>
      <option value="ADMIN">Admin</option>
    </select>
  ),
}))

function renderPopover(overrides = {}) {
  return render(
    <MemoryRouter>
      <PlanSharePopover
        open
        plan={{ id: 'plan-1', name: 'Plano de teste', role: 'OWNER' }}
        members={[]}
        isBackendDriven
        accessToken="test-token"
        onRefreshPlanDetails={async () => {}}
        onNotify={vi.fn()}
        {...overrides}
      />
    </MemoryRouter>,
  )
}

describe('PlanSharePopover Gmail gating', () => {
  beforeEach(() => {
    apiMock.apiRequest.mockReset()
  })

  it('blocks invite copy when Gmail is not connected', async () => {
    const user = userEvent.setup()
    apiMock.apiRequest.mockResolvedValue({
      integrations: {
        gmail: { connected: false },
      },
    })

    renderPopover()

    expect(await screen.findByText(/Conecte o Gmail em Configurações/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para Integrações' })).toHaveAttribute(
      'href',
      '/settings?section=integrations',
    )

    const emailInput = screen.getByPlaceholderText('E-mail')
    await user.type(emailInput, 'convidado@example.com')

    const copyButton = screen.getByRole('button', { name: 'Copiar link de convite' })
    expect(copyButton).toBeDisabled()

    await user.click(copyButton)

    await waitFor(() => {
      expect(apiMock.apiRequest).toHaveBeenCalledTimes(1)
      expect(apiMock.apiRequest).toHaveBeenCalledWith('/api/settings', { token: 'test-token' })
    })
    expect(apiMock.apiRequest).not.toHaveBeenCalledWith('/api/plans/plan-1/invites', expect.anything())
  })

  it('allows invite copy when Gmail is connected', async () => {
    const user = userEvent.setup()
    apiMock.apiRequest
      .mockResolvedValueOnce({
        integrations: {
          gmail: { connected: true, email: 'owner@example.com' },
        },
      })
      .mockResolvedValueOnce({ token: 'invite-token-123' })

    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

    renderPopover()

    await waitFor(() => {
      expect(screen.queryByText(/Conecte o Gmail em Configurações/i)).not.toBeInTheDocument()
    })

    const emailInput = screen.getByPlaceholderText('E-mail')
    await user.type(emailInput, 'convidado@example.com')

    const copyButton = screen.getByRole('button', { name: 'Copiar link de convite' })
    await waitFor(() => {
      expect(copyButton).toBeEnabled()
    })

    await user.click(copyButton)

    await waitFor(() => {
      expect(apiMock.apiRequest).toHaveBeenCalledWith('/api/plans/plan-1/invites', {
        method: 'POST',
        token: 'test-token',
        body: { email: 'convidado@example.com' },
      })
    })
  })
})
