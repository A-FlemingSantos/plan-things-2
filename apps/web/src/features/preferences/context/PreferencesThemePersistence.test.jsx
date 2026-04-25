import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { PreferencesProvider, usePreferences } from './PreferencesContext.jsx'

const { apiRequestMock, patchSessionMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  patchSessionMock: vi.fn(),
}))

vi.mock('../../auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    currentUser: {
      id: '00000000-0000-0000-0000-000000000001',
      locale: 'pt-BR',
      timeZone: 'America/Sao_Paulo',
    },
    accessToken: 'test-token',
    isAuthenticated: true,
    isDemoSession: false,
    patchSession: patchSessionMock,
  }),
}))

vi.mock('../../../shared/api/apiClient.js', () => ({
  apiRequest: apiRequestMock,
}))

function Harness() {
  const { generalPreferences, updateGeneral } = usePreferences()

  return (
    <div>
      <div data-testid="theme">{generalPreferences.theme}</div>
      <button type="button" onClick={() => updateGeneral({ theme: 'dark' })}>Set dark</button>
    </div>
  )
}

describe('PreferencesProvider theme persistence', () => {
  it('persists theme to localStorage and PATCHes backend when enabled', async () => {
    apiRequestMock.mockImplementation(async (path, options = {}) => {
      if (path === '/api/settings') {
        return {
          preferences: {
            locale: 'pt-BR',
            timeZone: 'America/Sao_Paulo',
            theme: 'system',
            dateFormat: 'dd/MM/yyyy',
            timeFormat: '24h',
          },
          notifications: {
            emailNotifs: true,
            eventReminders: true,
            deadlineAlerts: true,
          },
        }
      }

      if (path === '/api/settings/preferences') {
        return {
          locale: options.body.locale,
          timeZone: options.body.timeZone,
          theme: options.body.theme,
          dateFormat: options.body.dateFormat,
          timeFormat: options.body.timeFormat,
        }
      }

      throw new Error(`Unexpected request: ${path}`)
    })

    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/workspace']}>
        <PreferencesProvider>
          <Harness />
        </PreferencesProvider>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('system')

    await user.click(screen.getByRole('button', { name: /set dark/i }))

    expect(window.localStorage.getItem('plan-things:theme:v1:00000000-0000-0000-0000-000000000001')).toBe('dark')
    expect(apiRequestMock).toHaveBeenCalledWith('/api/settings/preferences', expect.objectContaining({
      method: 'PATCH',
      body: expect.objectContaining({ theme: 'dark' }),
    }))
  })
})
