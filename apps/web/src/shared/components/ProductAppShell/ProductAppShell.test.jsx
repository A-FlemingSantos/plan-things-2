import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ProductAppShell from './ProductAppShell.jsx'
import { installMatchMediaController } from '../../../test/matchMedia.js'

vi.mock('../../../features/auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'test-user',
      fullName: 'Arthur Fleming',
      email: 'arthur@example.com',
    },
    workspace: {
      id: 'workspace-1',
      name: 'Workspace do Arthur',
    },
  }),
}))

const styles = {
  shell: 'shell',
  shellCollapsed: 'shellCollapsed',
  sidebarTop: 'sidebarTop',
  logoRow: 'logoRow',
  sidebarLogo: 'sidebarLogo',
  sidebarLogoMark: 'sidebarLogoMark',
  sidebarLogoText: 'sidebarLogoText',
  collapseBtn: 'collapseBtn',
  collapseBtnIcon: 'collapseBtnIcon',
  collapseBtnFlipped: 'collapseBtnFlipped',
  workspacePicker: 'workspacePicker',
  workspacePickerHidden: 'workspacePickerHidden',
  wsAvatar: 'wsAvatar',
  wsName: 'wsName',
  wsChevron: 'wsChevron',
  nav: 'nav',
  navItem: 'navItem',
  navItemActive: 'navItemActive',
  navIcon: 'navIcon',
  navLabel: 'navLabel',
  navHintIcon: 'navHintIcon',
  userSection: 'userSection',
  userBtn: 'userBtn',
  userBtnActive: 'userBtnActive',
  userBtnCollapsed: 'userBtnCollapsed',
  userAvatar: 'userAvatar',
  userDetails: 'userDetails',
  userName: 'userName',
  userPlan: 'userPlan',
}

const navItems = [
  { id: 'home', label: 'Início', Icon: () => <span>H</span> },
  { id: 'files', label: 'Arquivos', Icon: () => <span>F</span> },
]

function Harness() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <ProductAppShell
      styles={styles}
      navItems={navItems}
      activeNav={location.pathname === '/files' ? 'files' : 'home'}
      onNavItemClick={(id) => navigate(id === 'files' ? '/files' : '/workspace')}
      LogoIcon={() => <span>L</span>}
      CollapseIcon={() => <span>C</span>}
      ChevronIcon={() => <span>V</span>}
      contentClassName="content"
      mobileTitle={location.pathname === '/files' ? 'Arquivos' : 'Início'}
      mobileTitleMeta="Teste"
    >
      <div>{location.pathname}</div>
    </ProductAppShell>
  )
}

function renderHarness(initialEntry = '/workspace') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/workspace" element={<Harness />} />
        <Route path="/files" element={<Harness />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProductAppShell', () => {
  it('persists desktop sidebar collapse state', async () => {
    const user = userEvent.setup()
    installMatchMediaController(1280)

    renderHarness()

    await user.click(screen.getByRole('button', { name: /recolher barra lateral/i }))

    expect(screen.getByRole('button', { name: /expandir barra lateral/i })).toBeInTheDocument()
    expect(window.localStorage.getItem('plan-things:sidebar-collapsed:v1:test-user')).toBe('true')
  })

  it('opens the mobile drawer and closes it after navigation', async () => {
    const user = userEvent.setup()
    installMatchMediaController(390)

    renderHarness()

    await user.click(screen.getByRole('button', { name: /abrir menu de navegação/i }))
    await user.click(screen.getByRole('button', { name: 'Arquivos' }))

    expect(await screen.findByText('/files')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Início' })).not.toBeInTheDocument()
  })
})

