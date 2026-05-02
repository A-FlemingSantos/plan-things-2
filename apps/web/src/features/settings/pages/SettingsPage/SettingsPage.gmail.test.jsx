import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsPage from './SettingsPage.jsx'

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
  isDemoSession: false,
  patchSession: vi.fn(),
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

const apiMock = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}))

vi.mock('../../../auth/context/AuthContext.jsx', () => ({
  useAuth: () => authMock,
}))

vi.mock('../../../preferences/context/PreferencesContext.jsx', () => ({
  DEFAULT_LOCAL_PREFERENCES: {
    homePage: 'workspace',
    openLastCtx: true,
  },
  usePreferences: () => preferencesMock,
}))

vi.mock('../../../../shared/api/apiClient.js', () => apiMock)

vi.mock('../../../../shared/hooks/useWorkspaceNavigation.js', () => ({
  useWorkspaceNavigation: () => ({
    activeNav: 'home',
    handleNavItemClick: vi.fn(),
  }),
}))

vi.mock('../../../../shared/components/ProductAppShell/ProductAppShell.jsx', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../../../shared/components/PlanPageHeader/PlanPageHeader.jsx', () => ({
  default: ({ title }) => <h1>{title}</h1>,
}))

vi.mock('../../../../shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx', () => ({
  default: () => null,
}))

vi.mock('../../../preferences/components/AppThemeScope/AppThemeScope.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

describe('SettingsPage Gmail integration', () => {
  beforeEach(() => {
    apiMock.apiRequest.mockReset()
    preferencesMock.updateGeneral.mockReset()
    preferencesMock.updateLocal.mockReset()
    preferencesMock.restoreLocalDefaults.mockReset()
    preferencesMock.updateNotifications.mockReset()
    authMock.patchSession.mockReset()
  })

  it('renders the persisted connected Gmail account', async () => {
    mockSettingsSnapshot({
      connected: true,
      email: 'arthur@example.com',
      connectedAt: {
        iso: '2026-04-24T12:00:00Z',
        text: '24/04/2026 09:00',
      },
    })

    renderSettings('/settings?section=integrations')

    expect(await screen.findByText('Gmail')).toBeInTheDocument()
    expect(screen.getByText('Conectado · arthur@example.com')).toBeInTheDocument()
    expect(screen.queryByText('Outlook Mail')).not.toBeInTheDocument()
  })

  it('starts Gmail authorization from the Gmail card', async () => {
    mockSettingsSnapshot({ connected: false })
    apiMock.apiRequest.mockImplementation((path, options = {}) => {
      if (path === '/api/settings/integrations/gmail/start' && options.method === 'POST') {
        return new Promise(() => {})
      }
      return Promise.resolve(settingsSnapshot({ connected: false }))
    })

    renderSettings('/settings?section=integrations')

    const gmailCard = await findIntegrationCard('Gmail')
    await userEvent.click(within(gmailCard).getByRole('button', { name: 'Conectar' }))

    await waitFor(() => {
      expect(apiMock.apiRequest).toHaveBeenCalledWith('/api/settings/integrations/gmail/start', {
        method: 'POST',
        token: 'test-token',
        body: { client: 'web' },
      })
    })
    expect(within(gmailCard).getByRole('button', { name: 'Aguarde' })).toBeDisabled()
  })

  it('disconnects Gmail and updates the card state', async () => {
    mockSettingsSnapshot({
      connected: true,
      email: 'arthur@example.com',
    })
    apiMock.apiRequest.mockImplementation((path, options = {}) => {
      if (path === '/api/settings/integrations/gmail' && options.method === 'DELETE') {
        return Promise.resolve({
          gmail: settingsSnapshot({ connected: false }).integrations.gmail,
        })
      }
      return Promise.resolve(settingsSnapshot({
        connected: true,
        email: 'arthur@example.com',
      }))
    })

    renderSettings('/settings?section=integrations')

    const gmailCard = await findIntegrationCard('Gmail')
    await userEvent.click(within(gmailCard).getByRole('button', { name: 'Desconectar' }))

    expect(await screen.findByText('Gmail desconectado.')).toBeInTheDocument()
    expect(screen.getByText('Não conectado')).toBeInTheDocument()
  })

  it('shows the Gmail callback error with retry available', async () => {
    mockSettingsSnapshot({ connected: false })

    renderSettings('/settings?section=integrations&gmail=error&error=GMAIL_EMAIL_DIVERGENTE')

    expect(await screen.findByText('Nao foi possivel conectar o Gmail (GMAIL_EMAIL_DIVERGENTE).')).toBeInTheDocument()
    const gmailCard = await findIntegrationCard('Gmail')
    expect(within(gmailCard).getByRole('button', { name: 'Conectar' })).toBeEnabled()
  })
})

function mockSettingsSnapshot(gmail) {
  apiMock.apiRequest.mockResolvedValue(settingsSnapshot(gmail))
}

function settingsSnapshot(gmail) {
  return {
    integrations: {
      gmail: {
        connected: false,
        email: null,
        scopes: [],
        connectedAt: null,
        lastError: null,
        ...gmail,
      },
    },
  }
}

async function findIntegrationCard(name) {
  const heading = await screen.findByText(name)
  return heading.closest('div[class*="integrationCard"]')
}

function renderSettings(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SettingsPage />
    </MemoryRouter>,
  )
}
