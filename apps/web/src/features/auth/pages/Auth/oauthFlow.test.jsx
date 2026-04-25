import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../../../test/renderApp.jsx'

describe('OAuth auth flow', () => {
  it('exchanges an OAuth completion code and persists the session', async () => {
    renderApp('/oauth/callback?code=demo-google-oauth-code&redirectTo=/settings')

    expect(await screen.findByRole('heading', { name: 'Configurações' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/settings')

    const session = JSON.parse(window.localStorage.getItem('plan-things.session'))
    expect(session.accessToken).toBe('demo-oauth-token')
    expect(session.demo).toBe(true)
  })

  it('shows an OAuth callback error without creating a session', async () => {
    renderApp('/oauth/callback?error=OAUTH_PROVIDER_ERROR')

    expect(await screen.findByText('Nao foi possivel concluir o login externo.')).toBeInTheDocument()
    expect(window.localStorage.getItem('plan-things.session')).toBeNull()
  })
})
