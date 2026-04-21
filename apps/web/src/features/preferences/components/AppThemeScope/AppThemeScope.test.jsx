import { act, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AppThemeScope from './AppThemeScope.jsx'

let mockedThemePreference = 'system'

vi.mock('../../context/PreferencesContext.jsx', async () => {
  const actual = await vi.importActual('../../context/PreferencesContext.jsx')

  return {
    ...actual,
    usePreferences: () => ({
      generalPreferences: { theme: mockedThemePreference },
    }),
  }
})

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

describe('AppThemeScope', () => {
  it('applies dark when preference is dark', () => {
    mockedThemePreference = 'dark'

    const { container } = render(
      <AppThemeScope>
        <div data-testid="child" />
      </AppThemeScope>,
    )

    expect(container.firstChild).toHaveAttribute('data-theme', 'dark')
    expect(container.firstChild).toHaveAttribute('data-theme-preference', 'dark')
  })

  it('supports a preference override prop', () => {
    mockedThemePreference = 'dark'

    const { matchMedia } = createMatchMediaStub({ matches: false })
    window.matchMedia = matchMedia

    const { container } = render(
      <AppThemeScope preference="system">
        <div data-testid="child" />
      </AppThemeScope>,
    )

    expect(container.firstChild).toHaveAttribute('data-theme', 'light')
    expect(container.firstChild).toHaveAttribute('data-theme-preference', 'system')
  })

  it('resolves system theme from matchMedia and reacts to changes', () => {
    mockedThemePreference = 'system'

    const { matchMedia, mediaQuery } = createMatchMediaStub({ matches: false })
    window.matchMedia = matchMedia

    const { container } = render(
      <AppThemeScope>
        <div data-testid="child" />
      </AppThemeScope>,
    )

    expect(container.firstChild).toHaveAttribute('data-theme', 'light')

    act(() => {
      mediaQuery.matches = true
      mediaQuery.dispatch()
    })

    expect(container.firstChild).toHaveAttribute('data-theme', 'dark')
    expect(container.firstChild).toHaveAttribute('data-theme-preference', 'system')
  })
})
