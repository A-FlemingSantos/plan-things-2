import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SidebarAccountMenu from './SidebarAccountMenu.jsx'

const authState = vi.hoisted(() => ({
  currentUser: {
    fullName: 'Arthur Santos',
    email: 'arthur@example.com',
    avatarUrl: null,
  },
  workspace: {
    subscriptionPlan: 'BASIC',
  },
  isAuthenticated: true,
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

    const menu = screen.getByRole('menu')

    await waitFor(() => {
      expect(menu.style.position).toBe('fixed')
    })

    expect(menu.style.left).toBe('56px')
    expect(menu.style.top).toBe('400px')
    expect(menu.style.width).toBe('220px')
  })
})
