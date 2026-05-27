import { render } from '@testing-library/react'
import { TestMemoryRouter } from './testRouter.jsx'
import { describe, expect, it, vi } from 'vitest'
import App from '../App.jsx'
import { PreferencesProvider } from '../features/preferences/context/PreferencesContext.jsx'

function createMatchMediaStub({ matches = false } = {}) {
  const listeners = new Set()

  const mediaQuery = {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((eventName, handler) => {
      if (eventName === 'change') listeners.add(handler)
    }),
    removeEventListener: vi.fn((eventName, handler) => {
      if (eventName === 'change') listeners.delete(handler)
    }),
    addListener: vi.fn((handler) => listeners.add(handler)),
    removeListener: vi.fn((handler) => listeners.delete(handler)),
    dispatch() {
      for (const handler of listeners) handler()
    },
  }

  return {
    mediaQuery,
    matchMedia: vi.fn(() => mediaQuery),
  }
}

vi.mock('../features/auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    accessToken: null,
    currentUser: null,
    workspace: null,
    isAuthenticated: false,
    isDemoSession: false,
    isReady: true,
    patchSession: vi.fn(),
  }),
}))

describe('Public routes theme policy', () => {
  it('forces system theme on /login even when a saved theme exists', () => {
    window.localStorage.setItem('plan-things:theme:v1:anonymous', 'dark')

    const { matchMedia } = createMatchMediaStub({ matches: false })
    window.matchMedia = matchMedia

    render(
      <TestMemoryRouter initialEntries={['/login']}>
        <PreferencesProvider>
          <App />
        </PreferencesProvider>
      </TestMemoryRouter>,
    )

    const scope = document.querySelector('[data-app-theme-scope]')
    expect(scope).not.toBeNull()
    expect(scope).toHaveAttribute('data-theme', 'light')
    expect(scope).toHaveAttribute('data-theme-preference', 'system')
    expect(document.documentElement.dataset.appColorScheme).toBe('light')
  })
})

