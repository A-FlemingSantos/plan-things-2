import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Workspace from './Workspace.jsx'
import { installMatchMediaController } from '../../../../test/matchMedia.js'

const plansMock = vi.hoisted(() => ({
  plans: [
    {
      id: 'plan-1',
      name: 'Lancamento do Produto — Q3',
      description: '',
      tag: 'Design',
      tagColor: '#d4aef1',
      date: '18 ago',
      tasks: 18,
      members: ['#000'],
    },
  ],
  activePlan: null,
  createPlan: vi.fn(),
  deletePlan: vi.fn(),
  renamePlan: vi.fn(),
  updatePlanCover: vi.fn(),
  selectPlan: vi.fn(),
  currentUser: { fullName: 'Arthur Fleming' },
  isBackendDriven: false,
  isLoading: false,
}))

const preferencesMock = vi.hoisted(() => ({
  localPreferences: {
    confirmDestructiveActions: true,
    showIntelligenceSection: true,
  },
}))

vi.mock('../../context/PlansContext.jsx', () => ({
  usePlans: () => plansMock,
}))

vi.mock('../../../preferences/context/PreferencesContext.jsx', () => ({
  DEFAULT_LOCAL_PREFERENCES: {
    showIntelligenceSection: true,
  },
  usePreferences: () => preferencesMock,
}))

vi.mock('../../../../shared/hooks/useWorkspaceNavigation.js', () => ({
  useWorkspaceNavigation: () => ({
    activeNav: 'home',
    handleNavItemClick: vi.fn(),
  }),
}))

vi.mock('../../../../shared/components/ProductAppShell/ProductAppShell.jsx', () => ({
  default: ({ children, mobileTitle }) => (
    <div>
      <h1>{mobileTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('../../../../shared/components/PlanSidebarSection/PlanSidebarSection.jsx', () => ({
  default: () => null,
}))

vi.mock('../../../../shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx', () => ({
  default: () => null,
}))

vi.mock('../../../preferences/components/AppThemeScope/AppThemeScope.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('../../components/InviteNotifications/InviteNotifications.jsx', () => ({
  default: () => <button type="button" aria-label="Notificações">Notificações</button>,
}))

function renderWorkspace() {
  return render(
    <MemoryRouter>
      <Workspace />
    </MemoryRouter>,
  )
}

describe('Workspace mobile layout', () => {
  beforeEach(() => {
    preferencesMock.localPreferences.showIntelligenceSection = true
    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: undefined,
    })
  })

  it('keeps the mobile workspace controls available without hiding the primary actions', () => {
    installMatchMediaController(390)

    renderWorkspace()

    expect(screen.getByRole('region', { name: 'Seção do Intelligence' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /novo plano/i }).length).toBeGreaterThan(0)
    expect(screen.getByPlaceholderText('Buscar planos...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Notificações' })).toBeInTheDocument()
    expect(screen.getByText('Todos os planos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Visualização em grade' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Visualização em lista' })).toBeInTheDocument()
  })

  it('hides the intelligence section when the workspace preference is disabled', () => {
    preferencesMock.localPreferences.showIntelligenceSection = false

    renderWorkspace()

    expect(screen.queryByRole('region', { name: 'Seção do Intelligence' })).not.toBeInTheDocument()
    expect(screen.getByText('Todos os planos')).toBeInTheDocument()
  })

  it('sends workspace intelligence messages from typed prompts and suggestions', async () => {
    const user = userEvent.setup()

    renderWorkspace()

    await user.type(screen.getByLabelText('Prompt do Intelligence'), 'Preciso planejar um produto novo')
    await user.click(screen.getByRole('button', { name: 'Enviar prompt ao Intelligence' }))

    expect(screen.getByText('Preciso planejar um produto novo')).toBeInTheDocument()
    expect(await screen.findByText(/Eu começaria separando a ideia/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Criar pitch deck' }))

    expect(await screen.findByText('Crie uma estrutura de pitch deck para apresentar esta ideia.')).toBeInTheDocument()
    expect(await screen.findByText(/problema, público, insight/i)).toBeInTheDocument()
  })

  it('adds recognized voice input to the workspace intelligence prompt', async () => {
    const user = userEvent.setup()

    class MockSpeechRecognition {
      start() {
        this.onstart?.()
        this.onresult?.({ results: [[{ transcript: 'Planejar lançamento por voz' }]] })
        this.onend?.()
      }

      abort() {}
    }

    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: MockSpeechRecognition,
    })

    renderWorkspace()

    await user.click(screen.getByRole('button', { name: 'Gravar áudio para o Intelligence' }))

    expect(await screen.findByDisplayValue('Planejar lançamento por voz')).toBeInTheDocument()
    expect(screen.getByText('Texto de voz adicionado ao prompt.')).toBeInTheDocument()
  })

  it('shows a microphone permission message when voice access is blocked', async () => {
    const user = userEvent.setup()

    class MockSpeechRecognition {
      start() {
        this.onerror?.({ error: 'not-allowed' })
        this.onend?.()
      }

      abort() {}
    }

    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: MockSpeechRecognition,
    })

    renderWorkspace()

    await user.click(screen.getByRole('button', { name: 'Gravar áudio para o Intelligence' }))

    expect(await screen.findByText('Permissão do microfone negada. Libere o acesso ao microfone no navegador.')).toBeInTheDocument()
  })

  it('explains when browser speech recognition is unavailable', async () => {
    const user = userEvent.setup()

    class MockSpeechRecognition {
      start() {
        this.onerror?.({ error: 'network' })
        this.onend?.()
      }

      abort() {}
    }

    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: MockSpeechRecognition,
    })

    renderWorkspace()

    await user.click(screen.getByRole('button', { name: 'Gravar áudio para o Intelligence' }))

    expect(await screen.findByText('O reconhecimento de voz do navegador está indisponível. Tente Chrome/Edge com internet ou digite o prompt.')).toBeInTheDocument()
  })
})
