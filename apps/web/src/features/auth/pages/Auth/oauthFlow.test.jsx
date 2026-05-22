import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createAccountStore, createDemoSession, readStoredSessionValue, renderApp } from '../../../../test/renderApp.jsx'

describe('OAuth auth flow', () => {
  it('exchanges an OAuth completion code and persists the active account in the versioned store', async () => {
    renderApp('/oauth/callback?code=demo-google-oauth-code&redirectTo=/settings')

    expect(await screen.findByRole('heading', { name: 'Configurações' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/settings')

    const sessionStore = readStoredSessionValue()
    expect(sessionStore).toMatchObject({
      version: 2,
      activeAccountId: 'demo-user-google-example-com',
      accounts: [expect.objectContaining({
        accessToken: 'demo-oauth-google-example-com-token',
        demo: true,
      })],
    })
  })

  it('merges a new account into the saved store when OAuth completes in add-account mode and lands on the new account home', async () => {
    window.sessionStorage.setItem('plan-things.auth.intent', JSON.stringify({
      mode: 'add-account',
      redirectTo: '/files',
    }))

    renderApp('/oauth/callback?code=demo-google-oauth-code', {
      session: createAccountStore([
        createDemoSession({
          user: {
            fullName: 'Arthur Santos',
            email: 'arthur@example.com',
          },
        }),
      ]),
    })

    await screen.findByRole('heading', { name: 'Início' })
    expect(window.location.pathname).toBe('/workspace')

    const sessionStore = readStoredSessionValue()
    expect(sessionStore.activeAccountId).toBe('demo-user-google-example-com')
    expect(sessionStore.accounts).toHaveLength(2)
    expect(window.sessionStorage.getItem('plan-things.auth.intent')).toBeNull()
  })

  it('shows an OAuth callback error without creating a session', async () => {
    renderApp('/oauth/callback?error=OAUTH_PROVIDER_ERROR')

    expect(await screen.findByText('Nao foi possivel concluir o login externo.')).toBeInTheDocument()
    expect(window.localStorage.getItem('plan-things.session')).toBeNull()
  })
})
