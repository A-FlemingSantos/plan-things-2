import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TestMemoryRouter } from '../../../../test/testRouter.jsx'
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
})
