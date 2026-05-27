import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestMemoryRouter } from '../../../../test/testRouter.jsx'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDeferred } from '../../../../test/deferred.js'
import Auth from './Auth.jsx'

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  startOAuthLogin: vi.fn(),
}))

const preferenceMocks = vi.hoisted(() => ({
  resolveInitialRoute: vi.fn(() => '/workspace'),
}))

const navigationMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')

  return {
    ...actual,
    useNavigate: () => navigationMocks.navigate,
  }
})

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => authMocks,
}))

vi.mock('../../../preferences/context/PreferencesContext.jsx', async () => {
  const actual = await vi.importActual('../../../preferences/context/PreferencesContext.jsx')

  return {
    ...actual,
    usePreferences: () => preferenceMocks,
  }
})

describe('OAuth start buttons', () => {
  beforeEach(() => {
    authMocks.login.mockReset()
    authMocks.register.mockReset()
    authMocks.startOAuthLogin.mockReset()
    preferenceMocks.resolveInitialRoute.mockClear()
    navigationMocks.navigate.mockReset()
  })

  it('starts Google OAuth with the pending internal redirect', async () => {
    const oauthStart = createDeferred()
    authMocks.startOAuthLogin.mockReturnValue(oauthStart.promise)

    renderAuth('/login', { redirectTo: '/settings' })

    await userEvent.click(screen.getByRole('button', { name: /google/i }))

    await waitFor(() => {
      expect(authMocks.startOAuthLogin).toHaveBeenCalledWith('google', {
        redirectTo: '/settings',
        mode: 'default',
      })
    })
    expect(screen.getByRole('button', { name: /google/i })).toBeDisabled()

    oauthStart.reject(new Error('Test cancelled pending OAuth start'))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /google/i })).toBeEnabled()
    })
  })

  it('starts OAuth in add-account mode without preserving the current redirect target', async () => {
    const oauthStart = createDeferred()
    authMocks.startOAuthLogin.mockReturnValue(oauthStart.promise)

    renderAuth('/login', {
      redirectTo: '/files',
      authMode: 'add-account',
    })

    await userEvent.click(screen.getByRole('button', { name: /google/i }))

    await waitFor(() => {
      expect(authMocks.startOAuthLogin).toHaveBeenCalledWith('google', {
        mode: 'add-account',
      })
    })

    oauthStart.reject(new Error('Test cancelled pending OAuth start'))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /google/i })).toBeEnabled()
    })
  })

  it('submits email login in add-account mode and redirects to the new account home', async () => {
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
      expect(navigationMocks.navigate).toHaveBeenCalledWith('/workspace', { replace: true })
    })
  })

  it('submits registration in add-account mode and redirects to the new account home', async () => {
    authMocks.register.mockResolvedValue({
      user: { id: 'user-3' },
    })

    render(
      <TestMemoryRouter initialEntries={[{
        pathname: '/cadastro',
        state: {
          redirectTo: '/calendar',
          authMode: 'add-account',
        },
      }]}>
        <Auth initialMode="register" />
      </TestMemoryRouter>,
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
      expect(navigationMocks.navigate).toHaveBeenCalledWith('/workspace', { replace: true })
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
    <TestMemoryRouter initialEntries={[{ pathname, state }]}>
      <Auth initialMode="login" />
    </TestMemoryRouter>,
  )
}
