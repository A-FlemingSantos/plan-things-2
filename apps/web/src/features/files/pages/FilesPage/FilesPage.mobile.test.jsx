import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FilesPage from './FilesPage.jsx'
import { installMatchMediaController } from '../../../../test/matchMedia.js'

const authMock = vi.hoisted(() => ({
  accessToken: 'test-token',
  isAuthenticated: true,
  isDemoSession: true,
  workspace: {
    id: 'workspace-1',
    name: 'Workspace de Arthur',
    subscriptionPlan: 'BASIC',
  },
}))

const preferencesMock = vi.hoisted(() => ({
  formatDateTime: vi.fn(() => ''),
}))

vi.mock('../../../auth/context/AuthContext.jsx', () => ({
  useAuth: () => authMock,
}))

vi.mock('../../../preferences/context/PreferencesContext.jsx', () => ({
  usePreferences: () => preferencesMock,
}))

vi.mock('../../../../shared/api/apiClient.js', () => ({
  apiRequest: vi.fn(),
  triggerBlobDownload: vi.fn(),
}))

vi.mock('../../../../shared/hooks/useWorkspaceNavigation.js', () => ({
  useWorkspaceNavigation: () => ({
    activeNav: 'files',
    handleNavItemClick: vi.fn(),
  }),
}))

vi.mock('../../../../shared/components/ProductAppShell/ProductAppShell.jsx', () => ({
  default: ({ children, mobileTitle }) => (
    <div>
      <h1>{mobileTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('../../../../shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx', () => ({
  default: () => null,
}))

vi.mock('../../../workspace/components/InviteNotifications/InviteNotifications.jsx', () => ({
  default: () => null,
}))

vi.mock('../../../preferences/components/AppThemeScope/AppThemeScope.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

function renderFiles() {
  return render(
    <MemoryRouter>
      <FilesPage />
    </MemoryRouter>,
  )
}

describe('FilesPage mobile layout', () => {
  beforeEach(() => {
    preferencesMock.formatDateTime.mockClear()
  })

  it('keeps selection separate from the detail sheet on mobile', async () => {
    installMatchMediaController(390)
    const user = userEvent.setup()

    renderFiles()

    await user.click(screen.getByText('plano-lancamento-q3.pdf'))

    expect(screen.getByText('1 selecionado')).toBeInTheDocument()
    expect(screen.queryByText('Detalhes do arquivo')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ver detalhes' }))

    expect(await screen.findByText('Detalhes do arquivo')).toBeInTheDocument()
  })

  it('moves secondary mobile actions into the overflow menu', async () => {
    installMatchMediaController(390)
    const user = userEvent.setup()

    renderFiles()

    expect(screen.queryByRole('button', { name: 'Enviar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nova pasta' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mais ações' }))

    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nova pasta' })).toBeInTheDocument()
  })
})
