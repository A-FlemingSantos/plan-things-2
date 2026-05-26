import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConversationToolbar from './ConversationToolbar.jsx'

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock('../../../../features/auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({ accessToken: null }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

const renderToolbar = (props = {}) =>
  render(
    <MemoryRouter>
      <ConversationToolbar {...props} />
    </MemoryRouter>,
  )

describe('ConversationToolbar', () => {
  beforeEach(() => {
    navigateMock.mockReset()
  })
  describe('collapsed state', () => {
    it('renders conversation title, scope and indicators', () => {
      renderToolbar({
        conversationTitle: 'Setup UI system',
        planId: 'plan-1',
        planName: 'Sprint 3',
        activeConnectors: ['github'],
      })

      const trigger = screen.getByRole('button', { name: /toolbar da conversa/i })
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.getByText('Setup UI system')).toBeInTheDocument()
      expect(screen.getByText('Sprint 3')).toBeInTheDocument()
      expect(screen.getByText('3 itens')).toBeInTheDocument()
    })

    it('shows workspace scope when no plan or card is provided', () => {
      renderToolbar({ conversationTitle: 'Test' })

      expect(screen.getByText('Workspace')).toBeInTheDocument()
    })

    it('shows card scope when cardId is provided', () => {
      renderToolbar({
        conversationTitle: 'Test',
        planId: 'plan-1',
        planName: 'Sprint',
        cardId: 'card-1',
        cardTitle: 'Login UI',
      })

      expect(screen.getByText('Login UI')).toBeInTheDocument()
    })

    it('shows loaded item count in indicators', () => {
      renderToolbar()

      expect(screen.getByText('3 itens')).toBeInTheDocument()
      expect(screen.queryByText('5')).not.toBeInTheDocument()
    })

    it('shows mock participant avatars in the toolbar', () => {
      renderToolbar()

      expect(screen.getByTitle('AS')).toBeInTheDocument()
      expect(screen.getByTitle('MK')).toBeInTheDocument()
      expect(screen.getByTitle('TK')).toBeInTheDocument()
      expect(screen.getByTitle('SR')).toBeInTheDocument()
    })
  })

  describe('expand/collapse', () => {
    it('expands the toolbar on click', async () => {
      const user = userEvent.setup()
      renderToolbar()

      const trigger = screen.getByRole('button', { name: /toolbar da conversa/i })
      expect(trigger).toHaveAttribute('aria-expanded', 'false')

      await user.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    it('collapses back on second click', async () => {
      const user = userEvent.setup()
      renderToolbar()

      const trigger = screen.getByRole('button', { name: /toolbar da conversa/i })
      await user.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')

      await user.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('supports keyboard toggle with Enter', async () => {
      const user = userEvent.setup()
      renderToolbar()

      const trigger = screen.getByRole('button', { name: /toolbar da conversa/i })
      trigger.focus()
      await user.keyboard('{Enter}')

      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('sections when expanded', () => {
    const expandToolbar = async () => {
      const user = userEvent.setup()
      renderToolbar({
        conversationTitle: 'Test conversa',
        planId: 'plan-1',
        planName: 'Sprint 3',
        cardId: 'card-1',
        cardTitle: 'Login UI',
        activeConnectors: ['github'],
      })

      await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))
      return user
    }

    it('renders the available section headers', async () => {
      await expandToolbar()

      expect(screen.getByRole('button', { name: /Conversas/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Permissões/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Arquivos e itens/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Atividade$/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Contexto/i })).not.toBeInTheDocument()
    })

    it('each section header has icon and name', async () => {
      await expandToolbar()

      const sectionHeaders = screen.getAllByRole('button').filter(
        (btn) => btn.getAttribute('aria-controls') && btn.textContent.match(/Conversas|Permissões|Arquivos e itens|Atividade/i),
      )
      expect(sectionHeaders.length).toBe(4)
    })

    it('toggles individual sections open and closed', async () => {
      const user = await expandToolbar()

      const conversationsBtn = screen.getByRole('button', { name: /Conversas/i })
      expect(conversationsBtn).toHaveAttribute('aria-expanded', 'false')

      await user.click(conversationsBtn)
      expect(conversationsBtn).toHaveAttribute('aria-expanded', 'true')

      await user.click(conversationsBtn)
      expect(conversationsBtn).toHaveAttribute('aria-expanded', 'false')
    })

    it('Conversations section shows mock conversations with actions', async () => {
      const user = await expandToolbar()

      await user.click(screen.getByRole('button', { name: /Conversas/i }))

      expect(screen.getByText('Estrutura do pitch deck')).toBeInTheDocument()
      expect(screen.getByText('Setup UI system')).toBeInTheDocument()
      expect(screen.getByText('Planejamento sprint 3')).toBeInTheDocument()

      expect(screen.getByLabelText(/Renomear "Estrutura do pitch deck"/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Arquivar "Estrutura do pitch deck"/)).toBeInTheDocument()
    })
  })

  describe('removed Context section', () => {
    it('does not render a dedicated Context section', async () => {
      const user = userEvent.setup()
      renderToolbar({ planId: 'plan-1', planName: 'Sprint 3' })

      await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))

      expect(screen.queryByRole('button', { name: /Contexto/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Contexto' })).not.toBeInTheDocument()
    })
  })

  describe('Files/Items section', () => {
    it('shows loaded files when section is expanded', async () => {
      const user = userEvent.setup()
      renderToolbar()

      await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))
      await user.click(screen.getByRole('button', { name: /Arquivos e itens/i }))

      expect(screen.getByText('pitch-deck-v2.pdf')).toBeInTheDocument()
      expect(screen.getByText('wireframes.fig')).toBeInTheDocument()
      expect(screen.getByText('spec-auth.md')).toBeInTheDocument()
    })

    it('filters items by search input', async () => {
      const user = userEvent.setup()
      renderToolbar()

      await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))
      await user.click(screen.getByRole('button', { name: /Arquivos e itens/i }))

      const filterInput = screen.getByLabelText('Filtrar arquivos e itens carregados')
      await user.type(filterInput, 'pitch')

      expect(screen.getByText('pitch-deck-v2.pdf')).toBeInTheDocument()
      expect(screen.queryByText('wireframes.fig')).not.toBeInTheDocument()
    })

    it('shows open and remove actions for each item', async () => {
      const user = userEvent.setup()
      renderToolbar()

      await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))
      await user.click(screen.getByRole('button', { name: /Arquivos e itens/i }))

      expect(screen.getByLabelText(/Abrir "pitch-deck-v2.pdf"/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Remover "pitch-deck-v2.pdf"/)).toBeInTheDocument()
    })
  })

  describe('Connectors/Permissions section', () => {
    it('shows GitHub as active when github chip is present', async () => {
      const user = userEvent.setup()
      renderToolbar({ activeConnectors: ['github'] })

      await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))
      await user.click(screen.getByRole('button', { name: /Permissões/i }))

      const githubRow = screen.getByText('GitHub').closest('li')
      expect(githubRow).toBeInTheDocument()
      expect(within(githubRow).getByText('Ativo')).toBeInTheDocument()
    })

    it('shows disconnect action for active connectors', async () => {
      const user = userEvent.setup()
      renderToolbar({ activeConnectors: ['github'] })

      await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))
      await user.click(screen.getByRole('button', { name: /Permissões/i }))

      expect(screen.getByLabelText('Desconectar GitHub')).toBeInTheDocument()
    })

    it('shows connect action for inactive connectors', async () => {
      const user = userEvent.setup()
      renderToolbar({ activeConnectors: [] })

      await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))
      await user.click(screen.getByRole('button', { name: /Permissões/i }))

      expect(screen.getByLabelText('Conectar GitHub')).toBeInTheDocument()
    })
  })

  describe('Activity section', () => {
    it('shows changes with status badges', async () => {
      const user = userEvent.setup()
      renderToolbar()

      await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))
      await user.click(screen.getByRole('button', { name: /^Atividade$/i }))

      expect(screen.getByText('Criar plano "Sprint 3"')).toBeInTheDocument()
      expect(screen.getByText('Pendente')).toBeInTheDocument()
      expect(screen.getByText('Aplicado')).toBeInTheDocument()
      expect(screen.getByText('Criado')).toBeInTheDocument()
      expect(screen.getByText('Rejeitado')).toBeInTheDocument()
      expect(screen.getByText('Falha')).toBeInTheDocument()
    })

    it('filters changes by search input', async () => {
      const user = userEvent.setup()
      renderToolbar()

      await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))
      await user.click(screen.getByRole('button', { name: /^Atividade$/i }))

      const filterInput = screen.getByLabelText('Filtrar atividade')
      await user.type(filterInput, 'Login')

      expect(screen.getByText('Adicionar card "Login UI"')).toBeInTheDocument()
      expect(screen.queryByText('Criar plano "Sprint 3"')).not.toBeInTheDocument()
    })
  })

  describe('Continue in Kanban', () => {
    it('shows "Continuar no Kanban" when planId is present', async () => {
      const user = userEvent.setup()
      renderToolbar({ planId: 'plan-1', planName: 'Sprint 3' })

      await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))

      expect(screen.getByRole('button', { name: /Continuar no Kanban/i })).toBeInTheDocument()
    })

    it('does not show "Continuar no Kanban" when no plan is in scope', async () => {
      const user = userEvent.setup()
      renderToolbar()

      await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))

      expect(screen.queryByRole('button', { name: /Continuar no Kanban/i })).not.toBeInTheDocument()
    })

    it('navigates to Kanban with openIntelligence state', async () => {
      const user = userEvent.setup()
      renderToolbar({ planId: 'plan-1', planName: 'Sprint 3' })

      await user.click(screen.getByRole('button', { name: /toolbar da conversa/i }))
      await user.click(screen.getByRole('button', { name: /Continuar no Kanban/i }))

      expect(navigateMock).toHaveBeenCalledWith('/workspace/board/plan-1', {
        state: { openIntelligence: true },
      })
    })
  })
})
