import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useMemo, useState } from 'react'
import { MemoryRouter, useNavigate, useParams } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

const chatState = vi.hoisted(() => ({
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

vi.mock('./features/workspace/pages/KanbanBoard/KanbanBoard.jsx', () => ({
  default: () => <main>Board</main>,
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
        <button type="button" onClick={() => navigate('/workspace/chat')}>
          Open chat
        </button>
      </main>
    )
  },
}))

vi.mock('./features/intelligence/pages/IntelligenceChat/IntelligenceChat.jsx', () => ({
  default: () => {
    const navigate = useNavigate()
    const { conversationId } = useParams()
    const [mountId] = useState(() => {
      chatState.mountSerial += 1
      return chatState.mountSerial
    })
    const currentConversationId = useMemo(() => conversationId ?? 'none', [conversationId])

    return (
      <main>
        <h1>Intelligence</h1>
        <p data-testid="chat-mount-id">{mountId}</p>
        <p data-testid="chat-conversation-id">{currentConversationId}</p>
        <button type="button" onClick={() => navigate('/workspace/chat/conv-created')}>
          Set conversation
        </button>
        <button type="button" onClick={() => navigate('/workspace/chat/conv-other')}>
          Switch conversation
        </button>
        <button type="button" onClick={() => navigate('/workspace')}>
          Back to workspace
        </button>
      </main>
    )
  },
}))

describe('App chat route transition shell', () => {
  beforeEach(() => {
    chatState.mountSerial = 0
  })

  it('does not remount the dedicated chat when only the conversation id changes', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/workspace/chat']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Intelligence' })).toBeInTheDocument()
    expect(screen.getByTestId('chat-mount-id')).toHaveTextContent('1')
    expect(screen.getByTestId('chat-conversation-id')).toHaveTextContent('none')

    await user.click(screen.getByRole('button', { name: 'Set conversation' }))

    expect(screen.getByTestId('chat-mount-id')).toHaveTextContent('1')
    expect(screen.getByTestId('chat-conversation-id')).toHaveTextContent('conv-created')

    await user.click(screen.getByRole('button', { name: 'Switch conversation' }))

    expect(screen.getByTestId('chat-mount-id')).toHaveTextContent('1')
    expect(screen.getByTestId('chat-conversation-id')).toHaveTextContent('conv-other')
  })

  it('still remounts across distinct product surfaces', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/workspace']}>
        <App />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Open chat' }))
    expect(screen.getByTestId('chat-mount-id')).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: 'Back to workspace' }))
    await user.click(screen.getByRole('button', { name: 'Open chat' }))

    expect(screen.getByTestId('chat-mount-id')).toHaveTextContent('2')
  })
})
