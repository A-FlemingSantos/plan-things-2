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
        mode: 'default',
      })
    })
    expect(screen.getByRole('button', { name: /google/i })).toBeDisabled()
  })

  it('starts OAuth in add-account mode and preserves the current redirect target', async () => {
    authMocks.startOAuthLogin.mockReturnValue(new Promise(() => {}))

    renderAuth('/login', {
      redirectTo: '/files',
      authMode: 'add-account',
    })

    await userEvent.click(screen.getByRole('button', { name: /google/i }))

    await waitFor(() => {
      expect(authMocks.startOAuthLogin).toHaveBeenCalledWith('google', {
        redirectTo: '/files',
        mode: 'add-account',
      })
    })
  })

  it('submits email login in add-account mode', async () => {
    authMocks.login.mockResolvedValue({
      user: { id: 'user-2' },
    })

    renderAuth('/login', {
      redirectTo: '/files',
      authMode: 'add-account',
    })

    await userEvent.type(screen.getByLabelText('E-mail'), 'bruna@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo456')
    await userEvent.click(screen.getByRole('button', { name: /continuar com e-mail/i }))

    await waitFor(() => {
      expect(authMocks.login).toHaveBeenCalledWith({
        email: 'bruna@example.com',
        password: 'segredo456',
      }, {
        mode: 'add-account',
      })
    })
  })

  it('submits registration in add-account mode', async () => {
    authMocks.register.mockResolvedValue({
      user: { id: 'user-3' },
    })

    render(
      <MemoryRouter initialEntries={[{
        pathname: '/cadastro',
        state: {
          redirectTo: '/calendar',
          authMode: 'add-account',
        },
      }]}>
        <Auth initialMode="register" />
      </MemoryRouter>,
    )

    await userEvent.type(screen.getByLabelText('Nome completo'), 'Carlos Lima')
    await userEvent.type(screen.getByLabelText('E-mail'), 'carlos@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo789')
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() => {
      expect(authMocks.register).toHaveBeenCalledWith({
        fullName: 'Carlos Lima',
        email: 'carlos@example.com',
        password: 'segredo789',
      }, {
        mode: 'add-account',
      })
    })
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
