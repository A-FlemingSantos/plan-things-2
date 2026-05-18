import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClientError } from '../../../../shared/api/apiClient.js'
import KanbanBoard from './KanbanBoard.jsx'

const apiMock = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  triggerBlobDownload: vi.fn(),
}))

const activePlan = vi.hoisted(() => ({
  id: 'plan-1',
  name: 'Plano Gmail',
  role: 'OWNER',
  boardColumns: [],
  boardLoaded: true,
  labelsMeta: [],
  membersMeta: [
    {
      id: 'user-1',
      fullName: 'Arthur Santos',
      email: 'arthur@example.com',
      role: 'OWNER',
    },
  ],
}))

const plansMock = vi.hoisted(() => ({
  ensurePlanDetails: vi.fn(),
  refreshPlanDetails: vi.fn(),
  loadPlanBoard: vi.fn(),
  updatePlanBoard: vi.fn(),
  applyBoardView: vi.fn(),
  isBackendDriven: true,
  isLoading: false,
}))

vi.mock('../../../../shared/api/apiClient.js', async () => {
  const actual = await vi.importActual('../../../../shared/api/apiClient.js')
  return {
    ...actual,
    apiRequest: apiMock.apiRequest,
    triggerBlobDownload: apiMock.triggerBlobDownload,
  }
})

vi.mock('../../../auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    accessToken: 'test-token',
    currentUser: {
      id: 'user-1',
      fullName: 'Arthur Santos',
      email: 'arthur@example.com',
    },
  }),
}))

vi.mock('../../context/PlansContext.jsx', () => ({
  usePlans: () => ({
    ...plansMock,
    plans: [activePlan],
    activePlan,
    openPlan: vi.fn(),
  }),
}))

vi.mock('../../hooks/useResolvedPlanRoute.js', () => ({
  useResolvedPlanRoute: () => ({
    plans: [activePlan],
    activePlan,
    openPlan: vi.fn(),
  }),
}))

vi.mock('../../hooks/useBoardColumns.js', () => ({
  useBoardColumns: () => ({
    columns: [],
    totalCards: 0,
    createColumn: vi.fn(),
    deleteColumn: vi.fn(),
    renameColumn: vi.fn(),
    changeColColor: vi.fn(),
    addCard: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    moveCard: vi.fn(),
  }),
}))

vi.mock('../../../calendar/hooks/useCalendarEvents.js', () => ({
  useCalendarEvents: () => ({ filteredEvents: [] }),
}))

vi.mock('../../../calendar/pages/CalendarPage/CalendarPage.jsx', () => ({
  CalendarWorkspaceView: () => <section aria-label="Calendário do quadro">Calendário do quadro</section>,
  default: () => null,
}))

vi.mock('../../../preferences/context/PreferencesContext.jsx', () => ({
  usePreferences: () => ({
    generalPreferences: {
      timezone: 'America/Sao_Paulo',
      dateFormat: 'dd/MM/yyyy',
    },
    formatClockTime: (value) => value,
  }),
}))

vi.mock('../../../../shared/hooks/useWorkspaceNavigation.js', () => ({
  useWorkspaceNavigation: () => ({
    activeNav: 'board',
    handleNavItemClick: vi.fn(),
  }),
}))

vi.mock('../../../../shared/components/ProductAppShell/ProductAppShell.jsx', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../../../shared/components/PlanPageHeader/PlanPageHeader.jsx', () => ({
  default: ({ title, actions }) => (
    <header>
      <h1>{title}</h1>
      {actions}
    </header>
  ),
}))

vi.mock('../../../../shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx', () => ({
  default: () => null,
}))

vi.mock('../../../preferences/components/AppThemeScope/AppThemeScope.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('../../components/BoardHeaderActions/BoardHeaderActions.jsx', () => ({
  default: ({ onAddMember }) => (
    <button type="button" onClick={onAddMember}>
      Convidar membro
    </button>
  ),
}))

vi.mock('../../components/InviteNotifications/InviteNotifications.jsx', () => ({
  default: () => null,
}))

vi.mock('../../components/KanbanColumn/KanbanColumn.jsx', () => ({
  default: () => null,
}))

vi.mock('../../components/CardModal/CardModal.jsx', () => ({
  default: () => null,
}))

vi.mock('../../components/AddColumnComposer/AddColumnComposer.jsx', () => ({
  default: () => null,
}))

describe('KanbanBoard Gmail invite flow', () => {
  beforeEach(() => {
    apiMock.apiRequest.mockReset()
    plansMock.ensurePlanDetails.mockReset()
    plansMock.refreshPlanDetails.mockReset()
    plansMock.loadPlanBoard.mockReset()
    plansMock.ensurePlanDetails.mockResolvedValue(activePlan)
    plansMock.refreshPlanDetails.mockResolvedValue(activePlan)
    plansMock.loadPlanBoard.mockResolvedValue([])
  })

  it('shows sent confirmation without exposing token or manual link', async () => {
    apiMock.apiRequest.mockImplementation((path, options = {}) => {
      if (path === '/api/plans/plan-1/invites' && options.method === 'POST') {
        return Promise.resolve({
          inviteId: 'invite-1',
          invitedEmail: 'membro@example.com',
          status: 'PENDING',
          token: 'secret-token',
          expiresAt: { text: '02/05/2026 10:00' },
          delivery: {
            emailSent: true,
            sentTo: 'membro@example.com',
            sentFrom: 'arthur@example.com',
          },
        })
      }
      if (path === '/api/plans/plan-1/invites') {
        return Promise.resolve([])
      }
      return Promise.resolve([])
    })

    renderBoard()

    await userEvent.click(screen.getByRole('button', { name: 'Convidar membro' }))
    await userEvent.type(screen.getByLabelText('E-mail'), 'membro@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Convidar' }))

    expect(await screen.findByText('Convite enviado')).toBeInTheDocument()
    expect(screen.getByText('Convite enviado para membro@example.com.')).toBeInTheDocument()
    expect(screen.queryByText(/secret-token/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /copiar/i })).not.toBeInTheDocument()
  })

  it('shows Gmail recovery guidance when sending fails', async () => {
    apiMock.apiRequest.mockImplementation((path, options = {}) => {
      if (path === '/api/plans/plan-1/invites' && options.method === 'POST') {
        return Promise.reject(new ApiClientError('Conecte o Gmail.', {
          code: 'GMAIL_NAO_CONECTADO',
          status: 400,
        }))
      }
      return Promise.resolve([])
    })

    renderBoard()

    await userEvent.click(screen.getByRole('button', { name: 'Convidar membro' }))
    await userEvent.type(screen.getByLabelText('E-mail'), 'membro@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Convidar' }))

    expect(await screen.findByText(/Gmail não conectado para este usuário/i)).toBeInTheDocument()
    expect(screen.getByText(/Código: GMAIL_NAO_CONECTADO/i)).toBeInTheDocument()
  })

  it('shows Google Cloud guidance when Gmail API is disabled', async () => {
    apiMock.apiRequest.mockImplementation((path, options = {}) => {
      if (path === '/api/plans/plan-1/invites' && options.method === 'POST') {
        return Promise.reject(new ApiClientError('API Gmail desabilitada.', {
          code: 'GMAIL_API_NAO_HABILITADA',
          status: 400,
        }))
      }
      return Promise.resolve([])
    })

    renderBoard()

    await userEvent.click(screen.getByRole('button', { name: 'Convidar membro' }))
    await userEvent.type(screen.getByLabelText('E-mail'), 'membro@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Convidar' }))

    expect(await screen.findByText(/A API do Gmail não está habilitada no projeto Google Cloud/i)).toBeInTheDocument()
    expect(screen.getByText(/Código: GMAIL_API_NAO_HABILITADA/i)).toBeInTheDocument()
  })

  it('uses the sending state while the invite request is pending', async () => {
    apiMock.apiRequest.mockImplementation((path, options = {}) => {
      if (path === '/api/plans/plan-1/invites' && options.method === 'POST') {
        return new Promise(() => {})
      }
      return Promise.resolve([])
    })

    renderBoard()

    await userEvent.click(screen.getByRole('button', { name: 'Convidar membro' }))
    await userEvent.type(screen.getByLabelText('E-mail'), 'membro@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Convidar' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Enviando...' })).toBeDisabled()
    })
  })
})

function renderBoard() {
  return render(
    <MemoryRouter initialEntries={['/workspace/board/plan-1']}>
      <KanbanBoard />
    </MemoryRouter>,
  )
}
