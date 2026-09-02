import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from '../App.jsx'
import AppThemeScope from '../features/preferences/components/AppThemeScope/AppThemeScope.jsx'
import { PreferencesProvider } from '../features/preferences/context/PreferencesContext.jsx'
import { PlansProvider } from '../features/workspace/context/PlansContext.jsx'
import { TEST_ROUTER_FUTURE_FLAGS } from './testRouter.jsx'

const { getAuthState, setAuthState } = vi.hoisted(() => {
  let authState = {
    accessToken: 'demo-token',
    currentUser: {
      id: 'theme-test-user',
      fullName: 'Theme Test',
      locale: 'pt-BR',
      timeZone: 'America/Sao_Paulo',
    },
    workspace: {
      id: 'theme-test-workspace',
      name: 'Theme Workspace',
    },
    isAuthenticated: true,
    isDemoSession: true,
    isReady: false,
    patchSession: vi.fn(),
  }

  return {
    getAuthState: () => authState,
    setAuthState: (patch) => {
      authState = { ...authState, ...patch }
    },
  }
})

vi.mock('../features/auth/context/AuthContext.jsx', () => ({
  useAuth: () => getAuthState(),
}))

vi.mock('../features/workspace/pages/Workspace/Workspace.jsx', () => ({
  default: function WorkspaceMock() {
    return (
      <AppThemeScope>
        <h1>Workspace Mock</h1>
      </AppThemeScope>
    )
  },
}))

describe('Theme preference bootstrap', () => {
  it('applies a saved dark preference during /app bootstrap and still resolves the route', async () => {
    setAuthState({ isReady: false })
    const userId = getAuthState().currentUser.id

    window.localStorage.setItem(`plan-things:theme:v1:${userId}`, 'dark')
    window.history.pushState({}, '', '/app')

    const createUi = () => (
      <BrowserRouter future={TEST_ROUTER_FUTURE_FLAGS}>
        <PreferencesProvider>
          <PlansProvider>
            <App />
          </PlansProvider>
        </PreferencesProvider>
      </BrowserRouter>
    )

    const { rerender } = render(createUi())

    expect(screen.getByRole('status', { name: 'Carregando sua sessão' })).toBeInTheDocument()
    expect(document.documentElement.dataset.appColorScheme).toBe('dark')
    expect(document.body.dataset.appColorScheme).toBe('dark')
    expect(document.querySelector('[data-app-theme-scope]')).toHaveAttribute('data-theme', 'dark')

    setAuthState({ isReady: true })
    rerender(createUi())

    expect(await screen.findByRole('heading', { name: 'Workspace Mock' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/workspace')
    expect(document.documentElement.dataset.appColorScheme).toBe('dark')
  })
})
