import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClientError } from '../../../../shared/api/apiClient.js'
import KanbanBoard from './KanbanBoard.jsx'

const apiMock = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  triggerBlobDownload: vi.fn(),
}))

const boardState = vi.hoisted(() => ({
  columns: [],
}))

const activePlan = vi.hoisted(() => ({
  id: 'plan-1',
  name: 'Plano Inbox',
  role: 'OWNER',
  boardColumns: [],
  boardLoaded: true,
  labelsMeta: [],
  membersMeta: [
    {
      id: 'user-1',
      initials: 'AO',
      color: '#111827',
      name: 'Arthur Owner',
      email: 'arthur@example.com',
      role: 'OWNER',
    },
    {
      id: 'user-2',
      initials: 'IM',
      color: '#4290da',
      name: 'Inbox Member',
      email: 'member@example.com',
      role: 'MEMBER',
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
    updateColumns: vi.fn(),
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
  default: () => null,
}))

vi.mock('../../components/InviteNotifications/InviteNotifications.jsx', () => ({
  default: () => null,
}))

vi.mock('../../components/KanbanColumn/KanbanColumn.jsx', () => ({
  default: ({ col, onDragStart, onDragEnd }) => (
    <section aria-label={col.title}>
      {col.cards.map((card) => (
        <div
          key={card.id}
          role="button"
          tabIndex={0}
          draggable
          onDragStart={() => onDragStart(card.id, col.id)}
          onDragEnd={onDragEnd}
        >
          {card.title}
        </div>
      ))}
    </section>
  ),
}))

vi.mock('../../components/CardModal/CardModal.jsx', () => ({
  default: () => null,
}))

vi.mock('../../components/AddColumnComposer/AddColumnComposer.jsx', () => ({
  default: () => null,
}))

describe('KanbanBoard Inbox Gmail flow', () => {
  beforeEach(() => {
    apiMock.apiRequest.mockReset()
    plansMock.ensurePlanDetails.mockReset()
    plansMock.refreshPlanDetails.mockReset()
    plansMock.loadPlanBoard.mockReset()
    plansMock.ensurePlanDetails.mockResolvedValue(activePlan)
    plansMock.refreshPlanDetails.mockResolvedValue(activePlan)
    plansMock.loadPlanBoard.mockResolvedValue(boardState.columns)
    boardState.columns = [
      {
        id: 'col-1',
        title: 'A Fazer',
        color: '#4290da',
        cards: [
          {
            id: 'card-1',
            columnId: 'col-1',
            title: 'Enviar resumo',
            description: '',
            labelId: '',
            memberIds: ['user-2'],
            comments: [],
            attachments: [],
          },
        ],
      },
    ]
  })

  it('sends dropped cards directly when the card has assignees', async () => {
    apiMock.apiRequest.mockResolvedValue({
      emailSent: true,
      sentFrom: 'arthur@example.com',
      sentTo: ['member@example.com'],
      messageId: 'message-id',
      threadId: 'thread-id',
    })

    renderBoard()
    await openInboxAndDropCard('Enviar resumo')

    await waitFor(() => {
      expect(apiMock.apiRequest).toHaveBeenCalledWith('/api/plans/plan-1/board/cards/card-1/inbox/send', {
        method: 'POST',
        token: 'test-token',
        body: {},
      })
    })
  })

  it('asks for members when the dropped card has no assignees', async () => {
    boardState.columns[0].cards[0] = {
      ...boardState.columns[0].cards[0],
      memberIds: [],
    }
    apiMock.apiRequest.mockResolvedValue({
      emailSent: true,
      sentFrom: 'arthur@example.com',
      sentTo: ['member@example.com'],
    })

    renderBoard()
    await openInboxAndDropCard('Enviar resumo')

    expect(await screen.findByText('Destinatários')).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText(/Inbox Member/i))
    await userEvent.click(screen.getByRole('button', { name: 'Enviar e-mail' }))

    await waitFor(() => {
      expect(apiMock.apiRequest).toHaveBeenCalledWith('/api/plans/plan-1/board/cards/card-1/inbox/send', {
        method: 'POST',
        token: 'test-token',
        body: { recipientUserIds: ['user-2'] },
      })
    })
  })

  it('shows Gmail errors without moving the card', async () => {
    apiMock.apiRequest.mockRejectedValue(new ApiClientError('Conecte o Gmail.', {
      code: 'GMAIL_NAO_CONECTADO',
      status: 400,
    }))

    renderBoard()
    await openInboxAndDropCard('Enviar resumo')

    expect(await screen.findByRole('alert')).toHaveTextContent(/Gmail não conectado/i)
  })
})

async function openInboxAndDropCard(cardName) {
  await userEvent.click(screen.getByRole('button', { name: /Caixa de entrada/i }))
  const card = screen.getByRole('button', { name: cardName })
  const dropZone = screen.getByLabelText('Enviar cartão por Gmail')
  const dataTransfer = { dropEffect: '', setData: vi.fn(), getData: vi.fn() }

  fireEvent.dragStart(card, { dataTransfer })
  fireEvent.dragOver(dropZone, { dataTransfer })
  fireEvent.drop(dropZone, { dataTransfer })
}

function renderBoard() {
  return render(
    <MemoryRouter initialEntries={['/workspace/board/plan-1']}>
      <KanbanBoard />
    </MemoryRouter>,
  )
}
