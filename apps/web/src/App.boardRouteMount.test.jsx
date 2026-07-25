import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useMemo, useState } from 'react'
import { MemoryRouter, useNavigate, useParams } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

const boardState = vi.hoisted(() => ({
  mountSerial: 0,
}))

vi.mock('./features/auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    isReady: true,
    isAuthenticated: true,
    sessionMode: 'authenticated',
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

vi.mock('./features/intelligence/pages/IntelligenceChat/IntelligenceChat.jsx', () => ({
  default: () => <main>Intelligence</main>,
}))

vi.mock('./features/workspace/pages/InviteAccept/InviteAccept.jsx', () => ({
  default: () => <main>Invite</main>,
}))

vi.mock('./features/workspace/pages/Workspace/Workspace.jsx', () => ({
  default: () => {
    const navigate = useNavigate()
    return (
      <main>
        <h1>Workspace</h1>
        <button type="button" onClick={() => navigate('/workspace/board')}>
          Open board
        </button>
      </main>
    )
  },
}))

vi.mock('./features/workspace/pages/KanbanBoard/KanbanBoard.jsx', () => ({
  default: () => {
    const navigate = useNavigate()
    const { planId } = useParams()
    const [mountId] = useState(() => {
      boardState.mountSerial += 1
      return boardState.mountSerial
    })
    const currentPlanId = useMemo(() => planId ?? 'none', [planId])

    return (
      <main>
        <h1>Board</h1>
        <p data-testid="board-mount-id">{mountId}</p>
        <p data-testid="board-plan-id">{currentPlanId}</p>
        <button type="button" onClick={() => navigate('/workspace/board/plan-1')}>
          Resolve plan
        </button>
        <button type="button" onClick={() => navigate('/workspace/board/plan-2')}>
          Switch plan
        </button>
        <button type="button" onClick={() => navigate('/workspace')}>
          Back to workspace
        </button>
      </main>
    )
  },
}))

describe('App board route transition shell', () => {
  beforeEach(() => {
    boardState.mountSerial = 0
  })

  it('does not remount the board when the plan id is resolved or switched', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/workspace/board']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Board' })).toBeInTheDocument()
    expect(screen.getByTestId('board-mount-id')).toHaveTextContent('1')
    expect(screen.getByTestId('board-plan-id')).toHaveTextContent('none')

    await user.click(screen.getByRole('button', { name: 'Resolve plan' }))
    expect(screen.getByTestId('board-plan-id')).toHaveTextContent('plan-1')
    expect(screen.getByTestId('board-mount-id')).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: 'Switch plan' }))
    expect(screen.getByTestId('board-plan-id')).toHaveTextContent('plan-2')
    expect(screen.getByTestId('board-mount-id')).toHaveTextContent('1')
  })
})
