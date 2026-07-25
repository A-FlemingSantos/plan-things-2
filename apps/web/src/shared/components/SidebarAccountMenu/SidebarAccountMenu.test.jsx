import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestMemoryRouter } from '../../../test/testRouter.jsx'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SidebarAccountMenu from './SidebarAccountMenu.jsx'

const authState = vi.hoisted(() => ({
  currentUser: {
    id: 'user-1',
    fullName: 'Arthur Santos',
    email: 'arthur@example.com',
    avatarUrl: null,
  },
  workspace: {
    subscriptionPlan: 'BASIC',
  },
  activeAccountId: 'user-1',
  savedAccounts: [
    {
      accountId: 'user-1',
      user: {
        id: 'user-1',
        fullName: 'Arthur Santos',
        email: 'arthur@example.com',
        avatarUrl: null,
      },
    },
    {
      accountId: 'user-2',
      user: {
        id: 'user-2',
        fullName: 'Bruna Costa',
        email: 'bruna@example.com',
        avatarUrl: null,
      },
    },
  ],
  isAuthenticated: true,
  switchAccount: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('../../../features/auth/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

const styles = {
  userSection: 'userSection',
  userBtn: 'userBtn',
  userBtnActive: 'userBtnActive',
  userBtnCollapsed: 'userBtnCollapsed',
  userAvatar: 'userAvatar',
  userDetails: 'userDetails',
  userName: 'userName',
  userPlan: 'userPlan',
}

describe('SidebarAccountMenu', () => {
  beforeEach(() => {
    authState.logout.mockReset()
    authState.switchAccount.mockReset()
    window.localStorage.clear()
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
  })

  it('anchors the collapsed avatar menu to the viewport so it is not clipped by the sidebar', async () => {
    const user = userEvent.setup()

    render(
      <TestMemoryRouter>
        <SidebarAccountMenu styles={styles} collapsed />
      </TestMemoryRouter>,
    )

    const trigger = screen.getByRole('button', { name: /arthur santos/i })
    trigger.getBoundingClientRect = () => ({
      x: 12,
      y: 676,
      left: 12,
      top: 676,
      right: 44,
      bottom: 720,
      width: 32,
      height: 44,
      toJSON: () => ({}),
    })

    await user.click(trigger)

    const menu = screen.getByRole('menu', { name: '' })

    await waitFor(() => {
      expect(menu.style.position).toBe('fixed')
    })

    expect(menu.style.left).toBe('12px')
    expect(menu.style.top).toBe('350px')
    expect(menu.style.width).toBe('220px')
  })

  it('expands the dock account menu inline to the right of the avatar trigger', async () => {
    const user = userEvent.setup()

    render(
      <TestMemoryRouter>
        <SidebarAccountMenu
          styles={styles}
          collapsed
          menuPresentation="dock"
          renderTrigger={({ triggerProps }) => (
            <button type="button" {...triggerProps} aria-label="Abrir menu da conta">
              Conta
            </button>
          )}
        />
      </TestMemoryRouter>,
    )

    const root = screen.getByRole('button', { name: 'Abrir menu da conta' }).parentElement
    expect(root?.className).toContain('containerDock')
    expect(root?.className).not.toContain('containerDockOpen')

    await user.click(screen.getByRole('button', { name: 'Abrir menu da conta' }))

    expect(root?.className).toContain('containerDockOpen')

    const menu = screen.getByRole('menu')
    expect(menu.className).toContain('dockExpandInner')
    expect(menu.style.position).not.toBe('fixed')

    expect(screen.getByRole('button', { name: /contas salvas de arthur santos/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Upgrade' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Meu perfil' })).not.toBeInTheDocument()
  })

  it('reopens the collapsed avatar menu after closing it with an outside click', async () => {
    const user = userEvent.setup()

    render(
      <TestMemoryRouter>
        <SidebarAccountMenu styles={styles} collapsed />
      </TestMemoryRouter>,
    )

    const trigger = screen.getByRole('button', { name: /arthur santos/i })
    trigger.getBoundingClientRect = () => ({
      x: 12,
      y: 676,
      left: 12,
      top: 676,
      right: 44,
      bottom: 720,
      width: 32,
      height: 44,
      toJSON: () => ({}),
    })

    await user.click(trigger)
    expect(await screen.findByRole('menu')).toBeInTheDocument()

    await user.click(document.body)
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })
  })

  it('positions the expanded avatar menu as the same fixed overlay used by the collapsed sidebar', async () => {
    const user = userEvent.setup()

    const { container } = render(
      <div data-app-theme-scope data-theme="dark">
        <TestMemoryRouter>
          <SidebarAccountMenu styles={styles} />
        </TestMemoryRouter>
      </div>,
    )

    const trigger = screen.getByRole('button', { name: /arthur santos/i })
    const menuContainer = trigger.closest('.userSection')?.parentElement

    menuContainer.getBoundingClientRect = () => ({
      x: 0,
      y: 640,
      left: 0,
      top: 640,
      right: 260,
      bottom: 720,
      width: 260,
      height: 80,
      toJSON: () => ({}),
    })

    trigger.getBoundingClientRect = () => ({
      x: 10,
      y: 676,
      left: 10,
      top: 676,
      right: 250,
      bottom: 720,
      width: 240,
      height: 44,
      toJSON: () => ({}),
    })

    await user.click(trigger)

    const menu = screen.getByRole('menu', { name: '' })

    await waitFor(() => {
      expect(menu.style.position).toBe('fixed')
    })

    expect(container.querySelector('[data-app-theme-scope]')?.contains(menu)).toBe(true)
    expect(menu.style.left).toBe('10px')
    expect(menu.style.top).toBe('350px')
    expect(menu.style.width).toBe('240px')
  })

  it('reuses the same account menu with a custom avatar trigger', async () => {
    const user = userEvent.setup()

    render(
      <TestMemoryRouter>
        <SidebarAccountMenu
          styles={styles}
          collapsed
          menuPlacement="below"
          renderTrigger={({ resolvedInitials, triggerProps }) => (
            <button {...triggerProps} aria-label="Abrir menu da conta">
              <span>{resolvedInitials}</span>
            </button>
          )}
        />
      </TestMemoryRouter>,
    )

    const trigger = screen.getByRole('button', { name: 'Abrir menu da conta' })
    trigger.getBoundingClientRect = () => ({
      x: 24,
      y: 120,
      left: 24,
      top: 120,
      right: 52,
      bottom: 148,
      width: 28,
      height: 28,
      toJSON: () => ({}),
    })

    await user.click(trigger)

    const menu = await screen.findByRole('menu')

    expect(screen.getByRole('menuitem', { name: 'Meu perfil' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
    expect(menu.style.left).toBe('24px')
    expect(menu.style.top).toBe('154px')
    expect(menu.style.width).toBe('220px')
  })

  it('opens the secondary accounts menu from the active account header', async () => {
    const user = userEvent.setup()

    render(
      <TestMemoryRouter>
        <SidebarAccountMenu styles={styles} />
      </TestMemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /arthur santos/i }))
    await user.click(screen.getByRole('button', { name: /contas salvas de arthur santos/i }))

    expect(await screen.findByRole('menu', { name: 'Contas salvas' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /arthur santos/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /bruna costa/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Adicionar conta' })).toBeInTheDocument()
  })

  it('positions the accounts submenu with fixed viewport coordinates when the sidebar is expanded', async () => {
    const user = userEvent.setup()

    const { container } = render(
      <div data-app-theme-scope data-theme="dark">
        <TestMemoryRouter>
          <SidebarAccountMenu styles={styles} />
        </TestMemoryRouter>
      </div>,
    )

    await user.click(screen.getByRole('button', { name: /arthur santos/i }))

    const accountsTrigger = screen.getByRole('button', { name: /contas salvas de arthur santos/i })
    accountsTrigger.getBoundingClientRect = () => ({
      x: 24,
      y: 540,
      left: 24,
      top: 540,
      right: 220,
      bottom: 588,
      width: 196,
      height: 48,
      toJSON: () => ({}),
    })

    await user.click(accountsTrigger)

    const submenu = await screen.findByRole('menu', { name: 'Contas salvas' })

    await waitFor(() => {
      expect(submenu.style.position).toBe('fixed')
    })

    expect(container.querySelector('[data-app-theme-scope]')?.contains(submenu)).toBe(true)
    expect(submenu.style.left).toBe('210px')
    expect(submenu.style.top).toBe('428px')
    expect(submenu.style.maxHeight).toBe('776px')
  })

  it('keeps the accounts submenu inside the viewport when it would overflow downward', async () => {
    const user = userEvent.setup()

    render(
      <TestMemoryRouter>
        <SidebarAccountMenu styles={styles} />
      </TestMemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /arthur santos/i }))

    const accountsTrigger = screen.getByRole('button', { name: /contas salvas de arthur santos/i })
    accountsTrigger.getBoundingClientRect = () => ({
      x: 24,
      y: 760,
      left: 24,
      top: 760,
      right: 220,
      bottom: 808,
      width: 196,
      height: 48,
      toJSON: () => ({}),
    })

    await user.click(accountsTrigger)

    const submenu = await screen.findByRole('menu', { name: 'Contas salvas' })
    submenu.getBoundingClientRect = () => ({
      x: 228,
      y: 760,
      left: 228,
      top: 760,
      right: 508,
      bottom: 1180,
      width: 280,
      height: 420,
      toJSON: () => ({}),
    })

    fireEvent(window, new Event('resize'))

    await waitFor(() => {
      expect(submenu.style.top).toBe('368px')
    })

    expect(submenu.style.maxHeight).toBe('776px')
  })

  it('switches to another saved account from the submenu', async () => {
    const user = userEvent.setup()
    authState.switchAccount.mockResolvedValue({
      user: {
        id: 'user-2',
      },
    })

    render(
      <TestMemoryRouter>
        <SidebarAccountMenu styles={styles} />
      </TestMemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /arthur santos/i }))
    await user.click(screen.getByRole('button', { name: /contas salvas de arthur santos/i }))
    await user.click(await screen.findByRole('menuitemradio', { name: /bruna costa/i }))

    await waitFor(() => {
      expect(authState.switchAccount).toHaveBeenCalledWith('user-2')
    })
  })

  it('does not trigger a switch when selecting the already active account', async () => {
    const user = userEvent.setup()

    render(
      <TestMemoryRouter>
        <SidebarAccountMenu styles={styles} />
      </TestMemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /arthur santos/i }))
    await user.click(screen.getByRole('button', { name: /contas salvas de arthur santos/i }))
    await user.click(await screen.findByRole('menuitemradio', { name: /arthur santos/i }))

    expect(authState.switchAccount).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.queryByRole('menu', { name: 'Contas salvas' })).not.toBeInTheDocument()
    })
  })

  it('opens the accounts submenu on click', async () => {
    const user = userEvent.setup()

    render(
      <TestMemoryRouter>
        <SidebarAccountMenu styles={styles} />
      </TestMemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /arthur santos/i }))
    await user.click(screen.getByRole('button', { name: /contas salvas de arthur santos/i }))

    expect(await screen.findByRole('menu', { name: 'Contas salvas' })).toBeInTheDocument()
  })

  it('uses the centralized logout redirect flow from the sidebar menu', async () => {
    const user = userEvent.setup()

    render(
      <TestMemoryRouter>
        <SidebarAccountMenu styles={styles} />
      </TestMemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /arthur santos/i }))
    await user.click(await screen.findByRole('menuitem', { name: 'Sair' }))

    expect(authState.logout).toHaveBeenCalledWith({
      redirectTo: '/login',
      replace: true,
    })
  })
})
