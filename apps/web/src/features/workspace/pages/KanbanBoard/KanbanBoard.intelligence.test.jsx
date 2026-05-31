import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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

const activePlan = vi.hoisted(() => ({
  id: 'plan-1',
  name: 'Plano Intelligence',
  role: 'OWNER',
  boardColumns: [],
  boardLoaded: true,
  labelsMeta: [],
  membersMeta: [],
}))

const plansMock = vi.hoisted(() => ({
  ensurePlanDetails: vi.fn(),
  refreshPlanDetails: vi.fn(),
  loadPlanBoard: vi.fn(() => Promise.resolve()),
  updatePlanBoard: vi.fn(),
  applyBoardView: vi.fn(),
  isBackendDriven: true,
  isLoading: false,
  aiChips: [],
  setAiChips: vi.fn(),
}))

vi.mock('../../../../shared/api/apiClient.js', async () => {
  const actual = await vi.importActual('../../../../shared/api/apiClient.js')
  return {
    ...actual,
    apiRequest: vi.fn(),
    triggerBlobDownload: vi.fn(),
  }
})

vi.mock('../../../intelligence/hooks/useAiConversation.js', async () => {
  const actual = await vi.importActual('../../../intelligence/hooks/useMockAiConversation.js')
  return {
    useAiConversation: actual.useMockAiConversation,
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
    updateCard: boardState.updateCard,
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

vi.mock('../../../preferences/components/AppThemeScope/AppThemeScope.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

function renderBoard(route = { pathname: '/workspace/board/plan-1' }) {
  return render(
    <TestMemoryRouter initialEntries={[route]}>
      <KanbanBoard />
    </TestMemoryRouter>,
  )
}

describe('KanbanBoard intelligence', () => {
  beforeEach(() => {
    plansMock.aiChips = []
    plansMock.setAiChips.mockReset()
    boardState.columns = []
  })

  it('does not inherit workspace chat chips in the internal intelligence panel', async () => {
    plansMock.aiChips = [
      {
        id: 'ctx-github',
        type: 'github',
        label: 'GitHub',
        kind: 'connector',
        ChipIcon: () => null,
      },
    ]

    renderBoard()
    await userEvent.click(await screen.findByRole('button', { name: 'Intelligence' }))

    expect(await screen.findByLabelText('Chat de IA')).toBeInTheDocument()
    expect(screen.queryByLabelText('Repositório: plan-things/web')).toBeNull()
    expect(screen.queryByLabelText('Remover GitHub do contexto')).toBeNull()
  })

  it('opens the internal intelligence panel when navigation state requests it', async () => {
    renderBoard({
      pathname: '/workspace/board/plan-1',
      state: { openIntelligence: true },
    })

    await waitFor(() => {
      expect(screen.getByLabelText('Chat de IA')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Intelligence' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('renders the internal composer inside the panel composer area', async () => {
    renderBoard()
    await userEvent.click(await screen.findByRole('button', { name: 'Intelligence' }))

    const composerArea = await screen.findByTestId('board-intelligence-composer-area')
    const composerForm = (await screen.findByLabelText('Prompt do Intelligence')).closest('form')
    expect(composerForm).not.toBeNull()
    expect(composerArea).toContainElement(composerForm)
  })

  it('does not reserve overlay padding inside the chat thread above the composer', async () => {
    const user = userEvent.setup()
    renderBoard()
    await user.click(await screen.findByRole('button', { name: 'Intelligence' }))

    await user.type(await screen.findByLabelText('Prompt do Intelligence'), 'Resuma este quadro')
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }))

    const thread = await screen.findByRole('log', { name: 'Conversa com o Intelligence' })
    expect(thread.style.paddingBottom).toBe('')
  })

  it('collapses structural spacing between the thread and composer when conversation is active', () => {
    const cssPath = join(process.cwd(), 'src/features/workspace/pages/KanbanBoard/KanbanBoard.module.css')
    const cssText = readFileSync(cssPath, 'utf8')

    expect(cssText).not.toContain('min-height: 502px;')
    expect(cssText).not.toContain('max-height: min(42vh, 360px);')
    expect(cssText).not.toContain('margin-top: auto;')
    expect(cssText).toContain('.intelligencePanelWithConversation .intelligencePanelBody')
    expect(cssText).toContain('gap: 0;')
    expect(cssText).toContain('.intelligencePanelThread')
    expect(cssText).toContain('flex: 1 1 0;')
    expect(cssText).toContain('.intelligencePanelMessages > div:last-child:empty')
    expect(cssText).toContain('margin-top: -12px;')
  })
})
