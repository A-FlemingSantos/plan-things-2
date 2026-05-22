import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import KanbanBoard from './KanbanBoard.jsx'

const apiMock = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  triggerBlobDownload: vi.fn(),
}))

const boardState = vi.hoisted(() => ({
  columns: [],
  updateColumns: vi.fn(),
}))

const activePlan = vi.hoisted(() => ({
  id: 'plan-1',
  name: 'Plano Arquivos',
  role: 'OWNER',
  boardColumns: [],
  boardLoaded: true,
  labelsMeta: [],
  membersMeta: [
    {
      id: 'user-1',
      fullName: 'Arthur Owner',
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
    localPreferences: {
      kanbanAccentColor: '',
    },
    formatClockTime: (value) => value,
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
  default: () => null,
}))

vi.mock('../../components/InviteNotifications/InviteNotifications.jsx', () => ({
  default: () => null,
}))

vi.mock('../../components/KanbanColumn/KanbanColumn.jsx', () => ({
  default: ({ col, onCardClick }) => (
    <section aria-label={col.title}>
      {col.cards.map((card) => (
        <button key={card.id} type="button" onClick={() => onCardClick(card, col.title)}>
          {card.title}
        </button>
      ))}
    </section>
  ),
}))

vi.mock('../../components/CardModal/CardModal.jsx', () => ({
  default: ({ card, onAttachFile }) => (
    <div>
      <p>Modal aberto para {card.title}</p>
      <button
        type="button"
        onClick={() => onAttachFile?.({
          id: 'file-2',
          name: 'briefing.pdf',
          type: 'pdf',
          mimeType: 'application/pdf',
          size: 1200,
          modified: 'Agora',
        }, card.id)}
      >
        Anexar mock
      </button>
    </div>
  ),
}))

vi.mock('../../components/AddColumnComposer/AddColumnComposer.jsx', () => ({
  default: () => null,
}))

function buildCard(overrides = {}) {
  return {
    id: 'card-1',
    columnId: 'col-1',
    title: 'Card de teste',
    description: 'Descricao',
    labelId: '',
    memberIds: [],
    dueDate: '',
    comments: [
      {
        id: 'comment-1',
        text: 'Comentario existente',
      },
    ],
    attachments: [],
    checklists: [
      {
        id: 'checklist-1',
        title: 'Checklist',
        items: [],
      },
    ],
    kind: 'CARTAO',
    schedule: {
      selectedCalendarDay: 7,
      startEnabled: false,
      startDateValue: '',
      dueEnabled: false,
      dueDateValue: '',
      dueTimeValue: '',
      displayLabel: '',
      preserveDisplayLabel: false,
    },
    ...overrides,
  }
}

describe('KanbanBoard file sync without board reload', () => {
  beforeEach(() => {
    apiMock.apiRequest.mockReset()
    plansMock.ensurePlanDetails.mockReset()
    plansMock.refreshPlanDetails.mockReset()
    plansMock.loadPlanBoard.mockReset()
    boardState.updateColumns.mockReset()
    plansMock.ensurePlanDetails.mockResolvedValue(activePlan)
    plansMock.refreshPlanDetails.mockResolvedValue(activePlan)
    boardState.updateColumns.mockImplementation((updater) => {
      boardState.columns = typeof updater === 'function' ? updater(boardState.columns) : updater
    })
    boardState.columns = [
      {
        id: 'col-1',
        title: 'Backlog',
        color: '#4290da',
        cards: [buildCard()],
      },
    ]
    plansMock.loadPlanBoard.mockImplementation(() => Promise.resolve(boardState.columns))
  })

  it('attaches a file locally and preserves existing card metadata without reloading the board', async () => {
    apiMock.apiRequest.mockResolvedValue({
      id: 'attachment-2',
      fileId: 'file-2',
      name: 'briefing.pdf',
      type: 'FILE',
      mimeType: 'application/pdf',
      sizeBytes: 1200,
      attachedBy: {
        id: 'user-1',
        fullName: 'Arthur Owner',
        email: 'arthur@example.com',
        avatarUrl: null,
      },
      attachedByCurrentUser: true,
      canRemove: true,
      createdAt: { text: 'Agora' },
    })

    renderBoard()
    await waitFor(() => {
      expect(plansMock.loadPlanBoard).toHaveBeenCalled()
    })
    await userEvent.click(screen.getByRole('button', { name: 'Card de teste' }))
    plansMock.loadPlanBoard.mockClear()

    await userEvent.click(screen.getByRole('button', { name: 'Anexar mock' }))

    await waitFor(() => {
      expect(boardState.columns[0].cards[0].attachments).toEqual([
        expect.objectContaining({
          id: 'attachment-2',
          fileId: 'file-2',
          name: 'briefing.pdf',
          canRemove: true,
        }),
      ])
    })

    expect(plansMock.loadPlanBoard).not.toHaveBeenCalled()
    expect(boardState.columns[0].cards[0].comments).toEqual([
      expect.objectContaining({ id: 'comment-1', text: 'Comentario existente' }),
    ])
    expect(boardState.columns[0].cards[0].checklists).toEqual([
      expect.objectContaining({ id: 'checklist-1', title: 'Checklist' }),
    ])
  })

})

function renderBoard() {
  return render(
    <MemoryRouter initialEntries={['/workspace/plan-1/board']}>
      <KanbanBoard />
    </MemoryRouter>,
  )
}
