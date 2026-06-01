import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router-dom'
import { TestMemoryRouter } from '../../../../test/testRouter.jsx'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import IntelligenceChat from './IntelligenceChat.jsx'

const apiMocks = vi.hoisted(() => ({
  cancelMessage: vi.fn(),
  createConversation: vi.fn(),
  createMessage: vi.fn(),
  getConversation: vi.fn(),
  listConversations: vi.fn(),
  listMessages: vi.fn(),
  updateConversation: vi.fn(),
}))

const plansMock = vi.hoisted(() => ({
  aiChips: [],
  setAiChips: vi.fn(),
}))

vi.mock('../../../auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    accessToken: 'test-token',
    currentUser: { fullName: 'Arthur Owner' },
  }),
}))

vi.mock('../../api/intelligenceApi.js', () => ({
  cancelIntelligenceMessage: (...args) => apiMocks.cancelMessage(...args),
  createIntelligenceConversation: (...args) => apiMocks.createConversation(...args),
  createIntelligenceMessage: (...args) => apiMocks.createMessage(...args),
  getIntelligenceConversation: (...args) => apiMocks.getConversation(...args),
  listIntelligenceConversations: (...args) => apiMocks.listConversations(...args),
  listIntelligenceMessages: (...args) => apiMocks.listMessages(...args),
  updateIntelligenceConversation: (...args) => apiMocks.updateConversation(...args),
}))

vi.mock('../../hooks/useAiStream.js', () => ({
  useAiStream: () => {},
}))

vi.mock('../../../preferences/context/PreferencesContext.jsx', () => ({
  usePreferences: () => ({
    localPreferences: { kanbanAccentColor: '' },
  }),
}))

vi.mock('../../../workspace/context/PlansContext.jsx', () => ({
  usePlans: () => plansMock,
}))

vi.mock('../../../../shared/components/ProductAppShell/ProductAppShell.jsx', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../../../shared/components/WorkspaceHeader/WorkspaceHeader.jsx', () => ({
  default: ({ centerContent }) => (
    <header>
      <h1>Intelligence</h1>
      {centerContent}
    </header>
  ),
}))

vi.mock('../../../preferences/components/AppThemeScope/AppThemeScope.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('../../../../shared/components/AiComposerContextMenu/AiComposerContextMenu.jsx', () => ({
  default: () => <div aria-label="Menu de contexto do composer" />,
}))

vi.mock('../../../../shared/components/GitHubContextBar/GitHubContextBar.jsx', () => ({
  default: () => <div aria-label="Repositório: plan-things/web" />,
}))

vi.mock('framer-motion', () => ({
  motion: {
    form: ({
      animate,
      children,
      drag,
      dragConstraints,
      dragElastic,
      exit,
      initial,
      layout,
      layoutId,
      transition,
      variants,
      whileFocus,
      whileHover,
      whileInView,
      whileTap,
      ...props
    }) => <form {...props}>{children}</form>,
  },
}))

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>
}

function renderChat(initialEntry = '/workspace/chat') {
  return render(
    <TestMemoryRouter initialEntries={[initialEntry]}>
      <LocationProbe />
      <Routes>
        <Route path="/workspace/chat/:conversationId?" element={<IntelligenceChat />} />
      </Routes>
    </TestMemoryRouter>,
  )
}

function mockConversation(id, overrides = {}) {
  return {
    id,
    title: `Conversa ${id}`,
    planId: null,
    cardId: null,
    scopeType: 'WORKSPACE',
    status: 'ACTIVE',
    ...overrides,
  }
}

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

describe('IntelligenceChat routing', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    plansMock.aiChips = []
    plansMock.setAiChips.mockReset()
    Object.values(apiMocks).forEach((mock) => mock.mockReset())
    apiMocks.listConversations.mockResolvedValue([])
    apiMocks.listMessages.mockResolvedValue([])
    apiMocks.getConversation.mockImplementation(async (conversationId) => mockConversation(conversationId))
    apiMocks.createConversation.mockResolvedValue(mockConversation('conv-created'))
    apiMocks.createMessage.mockResolvedValue({
      conversationId: 'conv-created',
      userMessageId: 'user-1',
      assistantMessageId: 'asst-1',
      assistantStatus: 'PENDING',
    })
  })

  it('opens /workspace/chat as an empty state without creating a backend conversation', async () => {
    renderChat('/workspace/chat')

    expect(screen.getByText('O que vamos construir hoje?')).toBeInTheDocument()

    await waitFor(() => {
      expect(apiMocks.listConversations).toHaveBeenCalled()
    })

    expect(apiMocks.createConversation).not.toHaveBeenCalled()
  })

  it('hydrates /workspace/chat/:conversationId from the backend without creating a new conversation', async () => {
    apiMocks.listMessages.mockResolvedValue([
      {
        id: 'user-1',
        conversationId: 'conv-1',
        role: 'USER',
        status: 'COMPLETED',
        contentText: 'Mensagem recuperada',
        blocks: [],
      },
    ])

    renderChat('/workspace/chat/conv-1')

    await waitFor(() => {
      expect(apiMocks.getConversation).toHaveBeenCalledWith('conv-1', { token: 'test-token' })
    })
    await waitFor(() => {
      expect(screen.getByText('Mensagem recuperada')).toBeInTheDocument()
    })

    expect(apiMocks.createConversation).not.toHaveBeenCalled()
  })

  it('keeps the route conversation area neutral until message hydration finishes', async () => {
    const messagesDeferred = createDeferred()
    apiMocks.listMessages.mockReturnValue(messagesDeferred.promise)

    renderChat('/workspace/chat/conv-1')

    await waitFor(() => {
      expect(apiMocks.listMessages).toHaveBeenCalledWith('conv-1', { token: 'test-token' })
    })

    expect(screen.queryByText('O que vamos construir hoje?')).not.toBeInTheDocument()
    expect(screen.queryByText('Recuperando o histórico...')).not.toBeInTheDocument()

    messagesDeferred.resolve([
      {
        id: 'user-1',
        conversationId: 'conv-1',
        role: 'USER',
        status: 'COMPLETED',
        contentText: 'Mensagem recuperada',
        blocks: [],
      },
    ])

    await waitFor(() => {
      expect(screen.getByText('Mensagem recuperada')).toBeInTheDocument()
    })
  })

  it('updates the URL when selecting a saved conversation', async () => {
    const user = userEvent.setup()
    apiMocks.listConversations.mockResolvedValue([
      { id: 'conv-2', title: 'Conversa salva' },
    ])

    renderChat('/workspace/chat')

    await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))
    await user.click(screen.getByRole('button', { name: /Conversas/i }))
    await user.click(await screen.findByRole('button', { name: 'Conversa salva' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/workspace/chat/conv-2')
  })

  it('returns to the empty chat URL from the new conversation action', async () => {
    const user = userEvent.setup()

    renderChat('/workspace/chat/conv-1')

    await waitFor(() => {
      expect(apiMocks.getConversation).toHaveBeenCalledWith('conv-1', { token: 'test-token' })
    })

    await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))
    await user.click(screen.getByLabelText('Nova conversa'))

    expect(screen.getByTestId('location')).toHaveTextContent('/workspace/chat')
  })

  it('creates a URL-backed conversation from launcher handoff only once', async () => {
    const user = userEvent.setup()
    const initialEntry = {
      pathname: '/workspace/chat',
      state: {
        handoffId: 'handoff-1',
        initialPrompt: 'Primeira mensagem',
        submitComposer: true,
      },
    }

    const firstRender = renderChat(initialEntry)

    await waitFor(() => {
      expect(apiMocks.createMessage).toHaveBeenCalledWith(
        'conv-created',
        expect.objectContaining({ content: 'Primeira mensagem' }),
        { token: 'test-token' },
      )
    })
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/workspace/chat/conv-created')
    })

    firstRender.unmount()
    apiMocks.createConversation.mockClear()
    apiMocks.createMessage.mockClear()

    renderChat(initialEntry)
    await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))

    expect(apiMocks.createConversation).not.toHaveBeenCalled()
    expect(apiMocks.createMessage).not.toHaveBeenCalled()
  })

  it('shows the optimistic user message during launcher handoff instead of the empty chat', () => {
    renderChat({
      pathname: '/workspace/chat',
      state: {
        handoffId: 'handoff-loading',
        initialPrompt: 'Primeira mensagem',
        submitComposer: true,
      },
    })

    expect(screen.getByText('Primeira mensagem')).toBeInTheDocument()
    expect(screen.queryByText('O que vamos construir hoje?')).not.toBeInTheDocument()
    expect(screen.queryByText('Preparando sua mensagem...')).not.toBeInTheDocument()
  })

  it('keeps toolbar scope stable while the created route conversation details load', async () => {
    const conversationDeferred = createDeferred()
    apiMocks.getConversation.mockReturnValue(conversationDeferred.promise)

    renderChat({
      pathname: '/workspace/chat',
      state: {
        handoffId: 'handoff-scoped',
        initialPrompt: 'Primeira mensagem',
        submitComposer: true,
        planId: 'plan-1',
        planName: 'Plano Alpha',
      },
    })

    expect(screen.getByText('Plano Alpha')).toBeInTheDocument()
    expect(screen.getByText('Primeira mensagem')).toBeInTheDocument()

    await waitFor(() => {
      expect(apiMocks.createMessage).toHaveBeenCalledWith(
        'conv-created',
        expect.objectContaining({ content: 'Primeira mensagem' }),
        { token: 'test-token' },
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/workspace/chat/conv-created')
    })

    expect(screen.getByText('Plano Alpha')).toBeInTheDocument()
    expect(screen.getByText('Primeira mensagem')).toBeInTheDocument()
    expect(screen.queryByText('Área de trabalho')).not.toBeInTheDocument()

    conversationDeferred.resolve(mockConversation('conv-created', {
      planId: 'plan-1',
    }))

    await waitFor(() => {
      expect(apiMocks.getConversation).toHaveBeenCalledWith('conv-created', { token: 'test-token' })
    })
  })

  it('does not resubmit a prompt state when reloading a URL-backed conversation', async () => {
    renderChat({
      pathname: '/workspace/chat/conv-1',
      state: {
        handoffId: 'handoff-1',
        initialPrompt: 'Nao reenviar',
        submitComposer: true,
      },
    })

    await waitFor(() => {
      expect(apiMocks.getConversation).toHaveBeenCalledWith('conv-1', { token: 'test-token' })
    })

    expect(apiMocks.createMessage).not.toHaveBeenCalled()
  })
})
