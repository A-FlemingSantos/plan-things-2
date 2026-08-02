import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestMemoryRouter } from '../../../../test/testRouter.jsx'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import KanbanBoard from './KanbanBoard.jsx'

const boardState = vi.hoisted(() => ({
  columns: [],
  updateColumns: vi.fn(),
  updateCard: vi.fn(),
}))

const boardActions = vi.hoisted(() => ({
  createColumn: vi.fn(),
  deleteColumn: vi.fn(),
  renameColumn: vi.fn(),
  changeColColor: vi.fn(),
  addCard: vi.fn(),
  deleteCard: vi.fn(),
}))

const activePlan = vi.hoisted(() => ({
  id: 'plan-1',
  name: 'Plano Otimista',
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
    createColumn: boardActions.createColumn,
    deleteColumn: boardActions.deleteColumn,
    renameColumn: boardActions.renameColumn,
    changeColColor: boardActions.changeColColor,
    addCard: boardActions.addCard,
    updateCard: boardState.updateCard,
    deleteCard: boardActions.deleteCard,
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

vi.mock('../../../calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx', () => ({
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

vi.mock('../../../../shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx', () => ({
  default: () => null,
}))

vi.mock('../../../preferences/components/AppThemeScope/AppThemeScope.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('../../components/KanbanColumn/KanbanColumn.jsx', () => ({
  default: ({ col, onToggleCardCompleted, onCardClick }) => (
    <section aria-label={col.title}>
      {col.cards.map((card) => (
        <div key={card.id}>
          <button type="button" onClick={() => onToggleCardCompleted(card)}>
            Concluir {card.title}
          </button>
          <button type="button" onClick={() => onCardClick(card, col.title)}>
            Abrir {card.title}
          </button>
        </div>
      ))}
    </section>
  ),
}))

vi.mock('../../components/CardModal/CardModal.jsx', () => ({
  default: ({ card, onDelete }) => (
    <div>
      <p>{card.title}</p>
      <button type="button" onClick={() => { onDelete(card.id).catch(() => {}) }}>
        Excluir cartão
      </button>
    </div>
  ),
}))

vi.mock('../../components/AddColumnComposer/AddColumnComposer.jsx', () => ({
  default: ({ addingCol, newColTitle, setNewColTitle, setAddingCol, addColumn, errorMessage }) => (
    addingCol ? (
      <div>
        <input
          aria-label="Nome da lista"
          value={newColTitle}
          onChange={(event) => setNewColTitle(event.target.value)}
        />
        {errorMessage ? <p>{errorMessage}</p> : null}
        <button type="button" onClick={addColumn}>
          Adicionar lista
        </button>
        <button type="button" onClick={() => setAddingCol(false)}>
          Fechar lista
        </button>
      </div>
    ) : (
      <button type="button" onClick={() => setAddingCol(true)}>
        Adicionar lista
      </button>
    )
  ),
}))

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function buildCard(overrides = {}) {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayKey = `${year}-${month}-${day}`

  return {
    id: 'card-1',
    columnId: 'col-1',
    title: 'Card de teste',
    description: '',
    labelId: '',
    memberIds: [],
    dueDate: 'Hoje',
    comments: [],
    attachments: [],
    checklists: [],
    kind: 'CARTAO',
    isCompleted: false,
    starred: false,
    startAt: null,
    dueAt: { iso: `${todayKey}T12:00:00-03:00`, text: 'Hoje 12:00' },
    schedule: {
      selectedCalendarDay: Number(day),
      startEnabled: false,
      startDateValue: '',
      dueEnabled: true,
      dueDateValue: `${day}/${month}/${year}`,
      dueTimeValue: '12:00',
      displayLabel: 'Hoje',
      preserveDisplayLabel: false,
    },
    ...overrides,
  }
}

describe('KanbanBoard optimistic feedback', () => {
  beforeEach(() => {
    plansMock.ensurePlanDetails.mockReset()
    plansMock.refreshPlanDetails.mockReset()
    plansMock.loadPlanBoard.mockReset()
    boardState.updateColumns.mockReset()
    boardState.updateCard.mockReset()
    boardActions.createColumn.mockReset()
    boardActions.deleteColumn.mockReset()
    boardActions.renameColumn.mockReset()
    boardActions.changeColColor.mockReset()
    boardActions.addCard.mockReset()
    boardActions.deleteCard.mockReset()
    plansMock.ensurePlanDetails.mockResolvedValue(activePlan)
    plansMock.refreshPlanDetails.mockResolvedValue(activePlan)
    plansMock.loadPlanBoard.mockImplementation(() => Promise.resolve(boardState.columns))
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
  })

  it('marks cards as completed immediately and reverts on backend failure', async () => {
    const deferred = createDeferred()
    boardState.updateCard.mockReturnValue(deferred.promise)

    renderBoard()
    await userEvent.click(await screen.findByRole('button', { name: 'Concluir Card de teste' }))

    expect(boardState.columns[0].cards[0].isCompleted).toBe(true)

    deferred.reject(new Error('Falha ao concluir'))

    await waitFor(() => {
      expect(boardState.columns[0].cards[0].isCompleted).toBe(false)
    })
  })

  it('stars planner cards immediately and reverts on backend failure', async () => {
    const deferred = createDeferred()
    boardState.updateCard.mockReturnValue(deferred.promise)

    renderBoard({ pathname: '/workspace/board/plan-1', state: { openPlanner: true } })
    await userEvent.click(await screen.findByRole('button', { name: 'Marcar com estrela' }))

    expect(boardState.columns[0].cards[0].starred).toBe(true)

    deferred.reject(new Error('Falha ao destacar'))

    await waitFor(() => {
      expect(boardState.columns[0].cards[0].starred).toBe(false)
    })
  })

  it('closes the add-column composer immediately while the backend request is pending and reopens it on failure', async () => {
    const deferred = createDeferred()
    boardActions.createColumn.mockReturnValue(deferred.promise)

    renderBoard()
    await userEvent.click(await screen.findByRole('button', { name: 'Adicionar lista' }))
    await userEvent.type(screen.getByLabelText('Nome da lista'), 'Doing')
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar lista' }))

    await waitFor(() => {
      expect(screen.queryByLabelText('Nome da lista')).toBeNull()
    })

    deferred.reject(new Error('Falha ao criar lista'))

    expect(await screen.findByLabelText('Nome da lista')).toHaveValue('Doing')
    expect(screen.getAllByText('Falha ao criar lista')).toHaveLength(2)
  })

  it('closes the card modal immediately while the backend deletion is pending and restores it on failure', async () => {
    const deferred = createDeferred()
    boardActions.deleteCard.mockReturnValue(deferred.promise)

    renderBoard()
    await userEvent.click(await screen.findByRole('button', { name: 'Abrir Card de teste' }))
    expect(screen.getByRole('button', { name: 'Excluir cartão' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Excluir cartão' }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Excluir cartão' })).toBeNull()
    })

    deferred.reject(new Error('Falha ao excluir cartão'))

    expect(await screen.findByRole('button', { name: 'Excluir cartão' })).toBeInTheDocument()
    expect(screen.getByText('Falha ao excluir cartão')).toBeInTheDocument()
  })
})

function renderBoard(route = { pathname: '/workspace/board/plan-1' }) {
  return render(
    <TestMemoryRouter initialEntries={[route]}>
      <KanbanBoard />
    </TestMemoryRouter>,
  )
}
