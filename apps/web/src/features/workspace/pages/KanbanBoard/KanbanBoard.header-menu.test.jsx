import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import KanbanBoard from './KanbanBoard.jsx'

const boardState = vi.hoisted(() => ({
  columns: [],
  updateColumns: vi.fn(),
}))

const activePlan = vi.hoisted(() => ({
  id: 'plan-1',
  name: 'Plano Vistas',
  role: 'OWNER',
  boardColumns: [],
  boardLoaded: true,
  labelsMeta: [],
  membersMeta: [],
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
    apiRequest: vi.fn(),
    triggerBlobDownload: vi.fn(),
  }
})

vi.mock('../../../auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    accessToken: 'test-token',
    currentUser: {
      id: 'user-1',
      fullName: 'Arthur Owner',
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
    columns: boardState.columns,
    totalCards: boardState.columns.reduce((sum, column) => sum + column.cards.length, 0),
    updateColumns: boardState.updateColumns,
    createColumn: vi.fn(),
    deleteColumn: vi.fn(),
    renameColumn: vi.fn(),
    changeColColor: vi.fn(),
    addCard: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    addCardComment: vi.fn(),
    moveCard: vi.fn(),
    createChecklist: vi.fn(),
    deleteChecklist: vi.fn(),
    createChecklistItem: vi.fn(),
    updateChecklistItem: vi.fn(),
  }),
}))

vi.mock('../../../calendar/hooks/useCalendarEvents.js', () => ({
  useCalendarEvents: () => ({ filteredEvents: [] }),
}))

vi.mock('../../../preferences/context/PreferencesContext.jsx', () => ({
  usePreferences: () => ({
    generalPreferences: {
      timezone: 'America/Sao_Paulo',
      dateFormat: 'dd/MM/yyyy',
    },
    localPreferences: {
      kanbanAccentColor: '',
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
  default: ({ title, titleAccessory, actions }) => (
    <header>
      <h1>{title}</h1>
      {titleAccessory}
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
  default: () => null,
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

describe('KanbanBoard header view menu', () => {
  beforeEach(() => {
    boardState.columns = []
    boardState.updateColumns.mockReset()
    plansMock.ensurePlanDetails.mockReset()
    plansMock.refreshPlanDetails.mockReset()
    plansMock.loadPlanBoard.mockReset()
    plansMock.updatePlanBoard.mockReset()
    plansMock.applyBoardView.mockReset()
    plansMock.ensurePlanDetails.mockResolvedValue(activePlan)
    plansMock.refreshPlanDetails.mockResolvedValue(activePlan)
    plansMock.loadPlanBoard.mockResolvedValue(activePlan)
    plansMock.updatePlanBoard.mockResolvedValue(activePlan)
    window.requestAnimationFrame = (callback) => callback()
  })

  it('opens the title dropdown with board, calendars, and files options', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/workspace/board/plan-1']}>
        <KanbanBoard />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Visualizações do plano' }))

    expect(screen.getByRole('menu', { name: 'Visualizações do plano' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Quadro' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Calendários' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Biblioteca' })).toBeInTheDocument()
  })

  it('does not open planner or files sidebars from the dropdown options', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/workspace/board/plan-1']}>
        <KanbanBoard />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Visualizações do plano' }))
    await user.click(screen.getByRole('menuitem', { name: 'Calendários' }))
    await user.click(screen.getByRole('menuitem', { name: 'Biblioteca' }))

    expect(screen.queryByLabelText('Planejador')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Arquivos do plano')).not.toBeInTheDocument()
  })
})
