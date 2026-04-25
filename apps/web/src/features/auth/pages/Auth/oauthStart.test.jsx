import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Auth from './Auth.jsx'

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  startOAuthLogin: vi.fn(),
}))

const preferenceMocks = vi.hoisted(() => ({
  resolveInitialRoute: vi.fn(() => '/workspace'),
}))

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => authMocks,
}))

vi.mock('../../../preferences/context/PreferencesContext.jsx', () => ({
  usePreferences: () => preferenceMocks,
}))

describe('OAuth start buttons', () => {
  beforeEach(() => {
    authMocks.login.mockReset()
    authMocks.register.mockReset()
    authMocks.startOAuthLogin.mockReset()
    preferenceMocks.resolveInitialRoute.mockClear()
  })

  it('starts Google OAuth with the pending internal redirect', async () => {
    authMocks.startOAuthLogin.mockReturnValue(new Promise(() => {}))

    renderAuth('/login', { redirectTo: '/settings' })

    await userEvent.click(screen.getByRole('button', { name: /google/i }))

    await waitFor(() => {
      expect(authMocks.startOAuthLogin).toHaveBeenCalledWith('google', {
        redirectTo: '/settings',
      })
    })
    expect(screen.getByRole('button', { name: /google/i })).toBeDisabled()
  })

  it('shows the backend error when OAuth start fails', async () => {
    authMocks.startOAuthLogin.mockRejectedValue(new Error('Este provedor OAuth ainda nao esta configurado.'))

    renderAuth('/login')

    await userEvent.click(screen.getByRole('button', { name: /microsoft/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Este provedor OAuth ainda nao esta configurado.')
    expect(screen.getByRole('button', { name: /microsoft/i })).toBeEnabled()
  })
})

function renderAuth(pathname, state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname, state }]}>
      <Auth initialMode="login" />
    </MemoryRouter>,
  )
}
