import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDeferred } from '../../../../test/deferred.js'
import { TestMemoryRouter } from '../../../../test/testRouter.jsx'
import Auth from './Auth.jsx'

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  startOAuthLogin: vi.fn(),
  reloadStoredSession: vi.fn(),
}))

const oauthPopupMocks = vi.hoisted(() => ({
  openOAuthPopup: vi.fn(),
  waitForOAuthPopup: vi.fn(),
}))

const preferenceMocks = vi.hoisted(() => ({
  resolveInitialRoute: vi.fn(() => '/workspace'),
}))

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => authMocks,
}))

vi.mock('../../utils/oauthPopup.js', () => oauthPopupMocks)

vi.mock('../../../preferences/context/PreferencesContext.jsx', async () => {
  const actual = await vi.importActual('../../../preferences/context/PreferencesContext.jsx')

  return {
    ...actual,
    usePreferences: () => preferenceMocks,
  }
})

describe('Auth button loaders', () => {
  beforeEach(() => {
    authMocks.login.mockReset()
    authMocks.startOAuthLogin.mockReset()
    oauthPopupMocks.openOAuthPopup.mockReset()
    oauthPopupMocks.waitForOAuthPopup.mockReset()
  })

  it('shows a visible ASCII loader centered in the email submit button', async () => {
    const loginDeferred = createDeferred()
    authMocks.login.mockReturnValue(loginDeferred.promise)

    render(
      <TestMemoryRouter initialEntries={['/login']}>
        <Auth initialMode="login" />
      </TestMemoryRouter>,
    )

    await userEvent.type(screen.getByLabelText('E-mail'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar com e-mail' }))

    const submitButton = screen.getByRole('button', { name: 'Continuar com e-mail' })
    const glyph = submitButton.querySelector('[aria-hidden="true"]')

    expect(glyph).toBeTruthy()
    expect(glyph.textContent).toMatch(/[|/\\-]/)
    expect(getComputedStyle(glyph).color).not.toBe(getComputedStyle(submitButton).backgroundColor)

    await act(async () => {
      loginDeferred.resolve({ user: { id: 'user-1' } })
      await loginDeferred.promise
    })
  })

  it('shows a visible ASCII loader centered in the OAuth button', async () => {
    const oauthDeferred = createDeferred()
    authMocks.startOAuthLogin.mockReturnValue(oauthDeferred.promise)

    render(
      <TestMemoryRouter initialEntries={['/login']}>
        <Auth initialMode="login" />
      </TestMemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Continuar com Google' }))

    const oauthButton = screen.getByRole('button', { name: 'Continuar com Google' })
    const glyph = oauthButton.querySelector('[aria-hidden="true"]')

    expect(glyph).toBeTruthy()
    expect(glyph.textContent).toMatch(/[|/\\-]/)
    expect(getComputedStyle(glyph).color).not.toBe(getComputedStyle(oauthButton).backgroundColor)

    await act(async () => {
      oauthDeferred.resolve({ authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth' })
      await oauthDeferred.promise
    })
  })
})
