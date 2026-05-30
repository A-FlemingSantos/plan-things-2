import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestMemoryRouter } from '../../../../test/testRouter.jsx'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import IntelligenceChat from './IntelligenceChat.jsx'

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

vi.mock('../../hooks/useAiConversation.js', async () => {
  const actual = await vi.importActual('../../hooks/useMockAiConversation.js')
  return {
    useAiConversation: actual.useMockAiConversation,
  }
})

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

function renderChat(route = { pathname: '/workspace/chat' }) {
  return render(
    <TestMemoryRouter initialEntries={[route]}>
      <IntelligenceChat />
    </TestMemoryRouter>,
  )
}

describe('IntelligenceChat', () => {
  beforeEach(() => {
    plansMock.aiChips = []
    plansMock.setAiChips.mockReset()
  })

  it('renders collapsed toolbar with title, scope and indicators in the header', () => {
    plansMock.aiChips = [
      { id: 'ctx-github', type: 'github', label: 'GitHub', kind: 'connector', ChipIcon: () => null },
    ]

    renderChat({
      pathname: '/workspace/chat',
      state: { planId: 'plan-1', planName: 'Sprint 3' },
    })

    const trigger = screen.getByRole('button', { name: /toolbar da conversa/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Nova conversa')).toBeInTheDocument()
    expect(screen.getByText('Sprint 3')).toBeInTheDocument()
    expect(screen.getByText('3 itens')).toBeInTheDocument()
  })

  it('expands toolbar inline in the header', async () => {
    const user = userEvent.setup()
    renderChat()

    const trigger = screen.getByRole('button', { name: /toolbar da conversa/i })
    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /Conversas/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Atividade$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Contexto/i })).not.toBeInTheDocument()
  })

  it('shows GitHub active in connectors when github chip is present', async () => {
    const user = userEvent.setup()
    plansMock.aiChips = [
      { id: 'ctx-github', type: 'github', label: 'GitHub', kind: 'connector', ChipIcon: () => null },
    ]

    renderChat()

    await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))
    await user.click(screen.getByRole('button', { name: /Permissões/i }))

    expect(screen.getByRole('switch', { name: 'Desconectar GitHub' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('Repositório: plan-things/web')).toBeInTheDocument()
  })

  it('shows Continue in Kanban when plan is in scope', async () => {
    const user = userEvent.setup()

    renderChat({
      pathname: '/workspace/chat',
      state: { planId: 'plan-1', planName: 'Sprint 3' },
    })

    await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))

    expect(screen.getByRole('button', { name: /Continuar no Kanban/i })).toBeInTheDocument()
  })

  it('does not render a dedicated context section', async () => {
    const user = userEvent.setup()

    renderChat({
      pathname: '/workspace/chat',
      state: { planId: 'plan-1', planName: 'Sprint 3' },
    })

    await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))

    expect(screen.queryByRole('button', { name: /Contexto/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Contexto' })).not.toBeInTheDocument()
  })

  it('shows loaded files in the files section', async () => {
    const user = userEvent.setup()
    renderChat()

    await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))
    await user.click(screen.getByRole('button', { name: /Arquivos e itens/i }))

    expect(screen.getByText('pitch-deck-v2.pdf')).toBeInTheDocument()
    expect(screen.getByText('wireframes.fig')).toBeInTheDocument()
  })

  it('moves attachments into the sent message but keeps context chips in the composer', async () => {
    const user = userEvent.setup()
    plansMock.setAiChips.mockImplementation((next) => {
      plansMock.aiChips = typeof next === 'function' ? next(plansMock.aiChips) : next
    })
    plansMock.aiChips = [
      {
        id: 'ctx-file-img',
        kind: 'file',
        type: 'file-upload-test',
        label: 'screenshot.png',
        isImage: true,
        previewUrl: 'blob:preview-1',
      },
      {
        id: 'ctx-file-doc',
        kind: 'file',
        type: 'file-upload-doc',
        label: 'brief.pdf',
        isImage: false,
      },
      {
        id: 'ctx-github',
        kind: 'connector',
        type: 'github',
        label: 'GitHub',
        ChipIcon: () => null,
      },
    ]

    renderChat()

    const prompt = screen.getByLabelText('Prompt do Intelligence')
    await user.type(prompt, 'Analise estes materiais')
    await user.click(screen.getByRole('button', { name: 'Enviar prompt ao Intelligence' }))

    expect(screen.queryByRole('group', { name: 'Anexos adicionados' })).not.toBeInTheDocument()
    expect(plansMock.setAiChips).toHaveBeenCalledWith([
      expect.objectContaining({ kind: 'connector', label: 'GitHub' }),
    ])
    expect(plansMock.aiChips).toEqual([
      expect.objectContaining({ kind: 'connector', label: 'GitHub' }),
    ])

    expect(screen.getByRole('group', { name: 'Imagens enviadas' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'screenshot.png' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Arquivos enviados' })).toBeInTheDocument()
    expect(screen.getByText('brief.pdf')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Contexto enviado' })).toBeInTheDocument()
    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('Analise estes materiais')).toBeInTheDocument()
  })

  it('allows typing a follow-up message after the assistant responds', async () => {
    const user = userEvent.setup()
    renderChat()

    const prompt = screen.getByLabelText('Prompt do Intelligence')
    await user.type(prompt, 'Primeira mensagem')
    await user.click(screen.getByRole('button', { name: 'Enviar prompt ao Intelligence' }))

    await waitFor(() => {
      expect(screen.getByText(/Entendi\. Eu começaria/)).toBeInTheDocument()
    })

    expect(prompt).not.toBeDisabled()
    await user.type(prompt, 'Segunda mensagem')
    expect(prompt).toHaveValue('Segunda mensagem')
  })
})
