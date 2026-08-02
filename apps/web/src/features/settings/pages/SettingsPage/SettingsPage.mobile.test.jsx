import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router-dom'
import { TestMemoryRouter } from '../../../../test/testRouter.jsx'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsPage from './SettingsPage.jsx'
import { installMatchMediaController } from '../../../../test/matchMedia.js'

const authMock = vi.hoisted(() => ({
  currentUser: {
    id: 'user-1',
    fullName: 'Arthur Santos',
    email: 'arthur@example.com',
    locale: 'pt-BR',
    timeZone: 'America/Sao_Paulo',
  },
  workspace: {
    id: 'workspace-1',
    name: 'Workspace de Arthur Santos',
  },
  accessToken: 'test-token',
  isAuthenticated: true,
  isDemoSession: true,
  patchSession: vi.fn(),
  logout: vi.fn(),
}))

const preferencesMock = vi.hoisted(() => ({
  generalPreferences: {
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    theme: 'system',
  },
  localPreferences: {
    homePage: 'workspace',
    openLastCtx: true,
    confirmDestructiveActions: true,
    liquidGlass: false,
  },
  notificationPreferences: {
    emailNotifs: true,
    eventReminders: true,
    deadlineAlerts: true,
  },
  updateGeneral: vi.fn(),
  updateLocal: vi.fn(),
  restoreLocalDefaults: vi.fn(),
  updateNotifications: vi.fn(),
}))

vi.mock('../../../auth/context/AuthContext.jsx', () => ({
  useAuth: () => authMock,
}))

vi.mock('../../../preferences/context/PreferencesContext.jsx', () => ({
  DEFAULT_LOCAL_PREFERENCES: {
    homePage: 'workspace',
    openLastCtx: true,
    confirmDestructiveActions: true,
    liquidGlass: false,
  },
  usePreferences: () => preferencesMock,
}))

vi.mock('../../../../shared/api/apiClient.js', () => ({
  apiRequest: vi.fn(),
  triggerBlobDownload: vi.fn(),
}))

vi.mock('../../../../shared/components/ProductAppShell/ProductAppShell.jsx', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../../../shared/components/PlanPageHeader/PlanPageHeader.jsx', () => ({
  default: ({ title }) => <h2>{title}</h2>,
}))

vi.mock('../../../../shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx', () => ({
  default: () => null,
}))

vi.mock('../../../preferences/components/AppThemeScope/AppThemeScope.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location-search">{location.search}</output>
}

function renderSettings(initialEntry = '/settings?section=integrations') {
  return render(
    <TestMemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/settings"
          element={(
            <>
              <LocationProbe />
              <SettingsPage />
            </>
          )}
        />
      </Routes>
    </TestMemoryRouter>,
  )
}

describe('SettingsPage mobile layout', () => {
  beforeEach(() => {
    authMock.patchSession.mockReset()
    authMock.logout.mockReset()
    preferencesMock.updateGeneral.mockReset()
    preferencesMock.updateLocal.mockReset()
    preferencesMock.restoreLocalDefaults.mockReset()
    preferencesMock.updateNotifications.mockReset()
  })

  it('uses a single shell title on mobile and keeps the section query in sync', async () => {
    installMatchMediaController(390)
    const user = userEvent.setup()

    renderSettings('/settings?section=integrations')

    expect(await screen.findByRole('heading', { name: 'Integrações' })).toBeInTheDocument()
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Área de trabalho' }))

    expect(await screen.findByRole('heading', { name: 'Área de trabalho' })).toBeInTheDocument()
    expect(screen.getByText('Painel do assistente')).toBeInTheDocument()
    expect(screen.getByText('Exibir painel do assistente')).toBeInTheDocument()
    expect(screen.getByText('Efeito aurora')).toBeInTheDocument()
    expect(screen.getAllByText('Em breve')).toHaveLength(2)
    expect(screen.getByTestId('location-search')).toHaveTextContent('?section=workspace')
  })
})
