import { render, screen } from '@testing-library/react'
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
    currentUser: { fullName: 'Arthur Owner' },
  }),
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
})
