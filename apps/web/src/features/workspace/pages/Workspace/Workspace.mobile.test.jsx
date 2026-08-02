import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestMemoryRouter } from '../../../../test/testRouter.jsx'
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
  activePlanId: null,
  createPlan: vi.fn(),
  deletePlan: vi.fn(),
  renamePlan: vi.fn(),
  updatePlanCover: vi.fn(),
  selectPlan: vi.fn(),
  currentUser: { id: 'user-1', fullName: 'Arthur Fleming' },
  isBackendDriven: false,
  isLoading: false,
}))

const apiClientMock = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  triggerBlobDownload: vi.fn(),
}))

const preferencesMock = vi.hoisted(() => ({
  localPreferences: {
    confirmDestructiveActions: true,
  },
}))

vi.mock('../../../auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    accessToken: 'test-token',
    currentUser: { id: 'user-1', fullName: 'Arthur Fleming' },
    workspace: { name: 'Área de trabalho pessoal' },
  }),
}))

vi.mock('../../../../shared/api/apiClient.js', () => ({
  apiRequest: (...args) => apiClientMock.apiRequest(...args),
  triggerBlobDownload: (...args) => apiClientMock.triggerBlobDownload(...args),
}))

vi.mock('../../context/PlansContext.jsx', () => ({
  usePlans: () => plansMock,
}))

vi.mock('../../../preferences/context/PreferencesContext.jsx', () => ({
  DEFAULT_LOCAL_PREFERENCES: {},
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

function renderWorkspace(initialEntries = ['/workspace']) {
  return render(
    <TestMemoryRouter initialEntries={initialEntries}>
      <Workspace />
    </TestMemoryRouter>,
  )
}

describe('Workspace mobile layout', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'plan-things:recent-plans:v1:user-1',
      JSON.stringify(['plan-1']),
    )
    plansMock.isBackendDriven = false
    apiClientMock.apiRequest.mockReset()
    apiClientMock.triggerBlobDownload.mockReset()
  })

  it('keeps the mobile workspace controls available without hiding the primary actions', () => {
    installMatchMediaController(390)

    renderWorkspace()

    expect(screen.getAllByRole('button', { name: /novo plano/i }).length).toBeGreaterThan(0)
    expect(screen.getByPlaceholderText('Buscar planos...')).toBeInTheDocument()
    expect(screen.getByText('Recentes')).toBeInTheDocument()
    expect(screen.getByText('Áreas de trabalho')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Planos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Membros' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Configurações' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Biblioteca' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Visualização em grade' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Visualização em lista' })).toBeInTheDocument()
  })

  it('handles workspace file deep links with an authenticated download', async () => {
    const blob = new Blob(['file'])
    plansMock.isBackendDriven = true
    apiClientMock.apiRequest.mockResolvedValue(blob)

    renderWorkspace(['/workspace?file=12345678-1234-1234-1234-123456789abc'])

    await waitFor(() => {
      expect(apiClientMock.apiRequest).toHaveBeenCalledWith(
        '/api/files/12345678-1234-1234-1234-123456789abc/download',
        {
          token: 'test-token',
          responseType: 'blob',
        },
      )
    })
    expect(apiClientMock.triggerBlobDownload).toHaveBeenCalledWith(blob, 'arquivo-12345678')
  })
})
