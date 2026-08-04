import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

const workspaceState = vi.hoisted(() => ({
  showLoading: true,
  useFullscreenLoading: false,
}))

vi.mock('./features/auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    isReady: true,
    isAuthenticated: true,
    sessionMode: 'authenticated',
    pendingLogoutRedirect: null,
    clearPendingLogoutRedirect: vi.fn(),
    pendingAccountRedirect: null,
    clearPendingAccountRedirect: vi.fn(),
  }),
}))

vi.mock('./features/preferences/context/PreferencesContext.jsx', () => ({
  usePreferences: () => ({
    resolveInitialRoute: () => '/workspace',
  }),
}))

vi.mock('./features/preferences/components/AppThemeScope/AppThemeScope.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('./features/landing/pages/LandingPage.jsx', () => ({
  default: () => <main>Landing</main>,
}))

vi.mock('./features/auth/pages/Auth/Auth.jsx', () => ({
  default: () => <main>Auth</main>,
}))

vi.mock('./features/auth/pages/OAuthCallback/OAuthCallback.jsx', () => ({
  default: () => <main>OAuth</main>,
}))

vi.mock('./features/auth/pages/PasswordRecovery/PasswordRecovery.jsx', () => ({
  default: () => <main>Password Recovery</main>,
}))

vi.mock('./features/info/pages/InfoPage.jsx', () => ({
  default: () => <main>Info</main>,
}))

vi.mock('./features/settings/pages/SettingsPage/SettingsPage.jsx', () => ({
  default: () => <main>Settings</main>,
}))

vi.mock('./features/workspace/pages/InviteAccept/InviteAccept.jsx', () => ({
  default: () => <main>Invite</main>,
}))

vi.mock('./features/workspace/pages/KanbanBoard/KanbanBoard.jsx', () => ({
  default: () => <main>Board</main>,
}))

vi.mock('./shared/components/AuthenticatedAppHeader/AuthenticatedAppHeader.jsx', () => ({
  default: () => null,
}))

vi.mock('./features/workspace/pages/Workspace/Workspace.jsx', async () => {
  const { default: LoadingScreen } = await import('./shared/components/Loader/LoadingScreen.jsx')

  return {
    default: function WorkspaceMock() {
      if (workspaceState.showLoading) {
        return (
          <LoadingScreen
            label="Carregando planos"
            variant={workspaceState.useFullscreenLoading ? 'fullscreen' : 'embedded'}
          />
        )
      }

      return <main>Workspace ready</main>
    },
  }
})

describe('App navigation dock visibility', () => {
  beforeEach(() => {
    workspaceState.showLoading = true
    workspaceState.useFullscreenLoading = false
  })

  it('keeps the authenticated navigation dock visible during embedded loading', () => {
    render(
      <MemoryRouter initialEntries={['/workspace']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('status', { name: 'Carregando planos' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument()
  })

  it('hides the authenticated navigation dock during fullscreen loading', () => {
    workspaceState.showLoading = true
    workspaceState.useFullscreenLoading = true

    render(
      <MemoryRouter initialEntries={['/workspace']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('status', { name: 'Carregando planos' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
  })

  it('shows the authenticated navigation dock when route content is ready', () => {
    workspaceState.showLoading = false

    render(
      <MemoryRouter initialEntries={['/workspace']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('Workspace ready')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument()
  })
})
