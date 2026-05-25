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
  aiChips: [],
  setAiChips: vi.fn(),
}))

const preferencesMock = vi.hoisted(() => ({
  localPreferences: {
    confirmDestructiveActions: true,
    showIntelligenceSection: true,
  },
}))

vi.mock('../../../auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    currentUser: { fullName: 'Arthur Fleming' },
    workspace: { name: 'Área de trabalho pessoal' },
  }),
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

vi.mock('../../../../shared/components/ProductAppShell/ProductAppShell.jsx', () => ({
  default: ({ children }) => <div>{children}</div>,
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
    plansMock.aiChips = []
    plansMock.setAiChips.mockClear()
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

  it('has a prompt input and send button in the intelligence section', () => {
    renderWorkspace()

    expect(screen.getByLabelText('Prompt do Intelligence')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar prompt ao Intelligence' })).toBeInTheDocument()
  })

  it('renders composer context and voice controls in the intelligence section', () => {
    renderWorkspace()

    expect(screen.getByRole('button', { name: 'Adicionar contexto ao chat' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gravar áudio para o Intelligence' })).toBeInTheDocument()
  })

  it('disables the send button when the prompt is empty', () => {
    renderWorkspace()

    expect(screen.getByRole('button', { name: 'Enviar prompt ao Intelligence' })).toBeDisabled()
  })

  it('enables the send button when the prompt has text', async () => {
    const user = userEvent.setup()

    renderWorkspace()

    await user.type(screen.getByLabelText('Prompt do Intelligence'), 'Planejar algo')

    expect(screen.getByRole('button', { name: 'Enviar prompt ao Intelligence' })).toBeEnabled()
  })
})
