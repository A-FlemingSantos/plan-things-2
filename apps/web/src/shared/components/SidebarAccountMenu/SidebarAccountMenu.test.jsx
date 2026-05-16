import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
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
      <MemoryRouter>
        <SidebarAccountMenu styles={styles} collapsed />
      </MemoryRouter>,
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

    expect(menu.style.left).toBe('56px')
    expect(menu.style.top).toBe('400px')
    expect(menu.style.width).toBe('220px')
  })

  it('opens the secondary accounts menu from the active account header', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <SidebarAccountMenu styles={styles} />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /arthur santos/i }))
    await user.hover(screen.getByRole('button', { name: /contas salvas de arthur santos/i }))

    expect(await screen.findByRole('menu', { name: 'Contas salvas' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /arthur santos/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /bruna costa/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Adicionar conta' })).toBeInTheDocument()
  })

  it('switches to another saved account from the submenu', async () => {
    const user = userEvent.setup()
    authState.switchAccount.mockResolvedValue({
      user: {
        id: 'user-2',
      },
    })

    render(
      <MemoryRouter>
        <SidebarAccountMenu styles={styles} />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /arthur santos/i }))
    await user.hover(screen.getByRole('button', { name: /contas salvas de arthur santos/i }))
    await user.click(await screen.findByRole('menuitemradio', { name: /bruna costa/i }))

    await waitFor(() => {
      expect(authState.switchAccount).toHaveBeenCalledWith('user-2')
    })
  })

  it('opens the accounts submenu on click when hover is not used', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <SidebarAccountMenu styles={styles} />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /arthur santos/i }))
    fireEvent.click(screen.getByRole('button', { name: /contas salvas de arthur santos/i }))

    expect(await screen.findByRole('menu', { name: 'Contas salvas' })).toBeInTheDocument()
  })

  it('uses the centralized logout redirect flow from the sidebar menu', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <SidebarAccountMenu styles={styles} />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /arthur santos/i }))
    await user.click(await screen.findByRole('menuitem', { name: 'Sair' }))

    expect(authState.logout).toHaveBeenCalledWith({
      redirectTo: '/login',
      replace: true,
    })
  })
})
