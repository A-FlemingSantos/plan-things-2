import { render, screen, waitFor } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TestMemoryRouter } from '../../../../test/testRouter.jsx'
import { ROUTES } from '../../../../shared/config/routes.js'
import OAuthCallback from './OAuthCallback.jsx'

const authMocks = vi.hoisted(() => ({
  completeOAuthLogin: vi.fn(),
}))

const preferenceMocks = vi.hoisted(() => ({
  resolveInitialRoute: vi.fn(() => '/workspace'),
}))

const oauthPopupMocks = vi.hoisted(() => ({
  isOAuthPopupContext: vi.fn(() => true),
  postOAuthPopupResult: vi.fn(() => true),
}))

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

vi.mock('../../utils/oauthPopup.js', () => oauthPopupMocks)

function LoginRedirectProbe() {
  const location = useLocation()

  return (
    <div>
      <p>{location.pathname}</p>
      <p>{location.state?.error}</p>
    </div>
  )
}

describe('OAuthCallback popup flow', () => {
  beforeEach(() => {
    authMocks.completeOAuthLogin.mockReset()
    oauthPopupMocks.isOAuthPopupContext.mockReset()
    oauthPopupMocks.postOAuthPopupResult.mockReset()
    oauthPopupMocks.isOAuthPopupContext.mockReturnValue(true)
    oauthPopupMocks.postOAuthPopupResult.mockReturnValue(true)
    window.close = vi.fn()
  })

  it('notifies the opener and closes the popup after a successful exchange', async () => {
    authMocks.completeOAuthLogin.mockResolvedValue({
      user: { id: 'user-1' },
    })

    render(
      <TestMemoryRouter initialEntries={['/oauth/callback?code=demo-google-oauth-code&redirectTo=/settings']}>
        <OAuthCallback />
      </TestMemoryRouter>,
    )

    await waitFor(() => {
      expect(authMocks.completeOAuthLogin).toHaveBeenCalledWith('demo-google-oauth-code', {
        mode: 'default',
      })
      expect(oauthPopupMocks.postOAuthPopupResult).toHaveBeenCalledWith({
        success: true,
        authMode: 'default',
        redirectTo: '/settings',
        userId: 'user-1',
      })
      expect(window.close).toHaveBeenCalled()
    })
  })

  it('redirects the main window to login when the completion code cannot be exchanged', async () => {
    oauthPopupMocks.isOAuthPopupContext.mockReturnValue(false)
    authMocks.completeOAuthLogin.mockRejectedValue(new Error('O codigo de conclusao do login expirou.'))

    render(
      <TestMemoryRouter initialEntries={['/oauth/callback?code=used-oauth-code']}>
        <Routes>
          <Route path={ROUTES.oauthCallback} element={<OAuthCallback />} />
          <Route path={ROUTES.login} element={<LoginRedirectProbe />} />
        </Routes>
      </TestMemoryRouter>,
    )

    expect(await screen.findByText('/login')).toBeInTheDocument()
    expect(screen.getByText('O codigo de conclusao do login expirou.')).toBeInTheDocument()
  })
})
