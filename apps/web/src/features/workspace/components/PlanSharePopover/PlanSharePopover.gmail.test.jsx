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

  it('blocks invite send when Gmail is not connected', async () => {
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

    const emailInput = screen.getByPlaceholderText('Adicionar um nome, grupo ou e-mail')
    await user.type(emailInput, 'convidado@example.com{Enter}')

    await waitFor(() => {
      expect(apiMock.apiRequest).toHaveBeenCalledTimes(1)
      expect(apiMock.apiRequest).toHaveBeenCalledWith('/api/settings', { token: 'test-token' })
    })
    expect(apiMock.apiRequest).not.toHaveBeenCalledWith('/api/plans/plan-1/invites', expect.anything())
  })

  it('allows invite send when Gmail is connected', async () => {
    const user = userEvent.setup()
    apiMock.apiRequest
      .mockResolvedValueOnce({
        integrations: {
          gmail: { connected: true, email: 'owner@example.com' },
        },
      })
      .mockResolvedValueOnce({ token: 'invite-token-123' })

    renderPopover()

    await waitFor(() => {
      expect(screen.queryByText(/Conecte o Gmail em Configurações/i)).not.toBeInTheDocument()
    })

    const emailInput = screen.getByPlaceholderText('Adicionar um nome, grupo ou e-mail')
    await user.type(emailInput, 'convidado@example.com{Enter}')

    await waitFor(() => {
      expect(apiMock.apiRequest).toHaveBeenCalledWith('/api/plans/plan-1/invites', {
        method: 'POST',
        token: 'test-token',
        body: { email: 'convidado@example.com' },
      })
    })
  })

  it('blocks invite send when Gmail is connected but the last authorization failed', async () => {
    const user = userEvent.setup()
    apiMock.apiRequest.mockResolvedValue({
      integrations: {
        gmail: { connected: true, email: 'owner@example.com', lastError: 'GMAIL_TOKEN_REFRESH_FALHOU' },
      },
    })

    renderPopover()

    expect(await screen.findByText(/A autorização do Gmail expirou/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para Integrações' })).toHaveAttribute(
      'href',
      '/settings?section=integrations',
    )

    const emailInput = screen.getByPlaceholderText('Adicionar um nome, grupo ou e-mail')
    await user.type(emailInput, 'convidado@example.com{Enter}')

    await waitFor(() => {
      expect(apiMock.apiRequest).toHaveBeenCalledTimes(1)
    })
    expect(apiMock.apiRequest).not.toHaveBeenCalledWith('/api/plans/plan-1/invites', expect.anything())
  })

  it('asks to reconnect Gmail when invite send fails with a Gmail authorization error', async () => {
    const user = userEvent.setup()
    const gmailError = Object.assign(new Error('Nao foi possivel renovar a autorizacao Gmail.'), {
      code: 'GMAIL_TOKEN_REFRESH_FALHOU',
    })
    apiMock.apiRequest
      .mockResolvedValueOnce({
        integrations: {
          gmail: { connected: true, email: 'owner@example.com' },
        },
      })
      .mockRejectedValueOnce(gmailError)

    renderPopover()

    await waitFor(() => {
      expect(screen.queryByText(/Conecte o Gmail em Configurações/i)).not.toBeInTheDocument()
    })

    const emailInput = screen.getByPlaceholderText('Adicionar um nome, grupo ou e-mail')
    await user.type(emailInput, 'convidado@example.com{Enter}')

    expect(await screen.findByText('Nao foi possivel renovar a autorizacao Gmail.')).toBeInTheDocument()
    expect(screen.getByText(/A autorização do Gmail expirou/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para Integrações' })).toBeInTheDocument()
  })
})
