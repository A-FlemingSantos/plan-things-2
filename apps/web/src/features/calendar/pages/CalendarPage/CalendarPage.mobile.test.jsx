import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestMemoryRouter } from '../../../../test/testRouter.jsx'
import { describe, expect, it, vi } from 'vitest'
import CalendarPage from './CalendarPage.jsx'
import { installMatchMediaController } from '../../../../test/matchMedia.js'

const preferencesMock = vi.hoisted(() => ({
  generalPreferences: {
    language: 'pt-BR',
    timezone: 'UTC',
  },
  formatIntl: (value, options) => new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    ...options,
  }).format(value),
  formatClockTime: (value) => value,
  formatMonthLabel: (value) => new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(value),
}))

const calendarEventsMock = vi.hoisted(() => ({
  calendarSources: [
    { id: 'arthur', name: 'Arthur Fleming', color: '#4290da' },
  ],
  filteredEvents: [],
  isLoading: false,
  loadError: null,
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
}))

vi.mock('../../../preferences/context/PreferencesContext.jsx', () => ({
  usePreferences: () => preferencesMock,
}))

vi.mock('../../hooks/useCalendarEvents.js', () => ({
  useCalendarEvents: () => calendarEventsMock,
}))

vi.mock('../../../../shared/components/ProductAppShell/ProductAppShell.jsx', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../../workspace/components/InviteNotifications/InviteNotifications.jsx', () => ({
  default: () => null,
}))

vi.mock('../../../preferences/components/AppThemeScope/AppThemeScope.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

function renderCalendar() {
  return render(
    <TestMemoryRouter>
      <CalendarPage />
    </TestMemoryRouter>,
  )
}

describe('CalendarPage mobile month view', () => {
  it('keeps the month view selected after tapping Mês on mobile', async () => {
    installMatchMediaController(390)
    const user = userEvent.setup()

    renderCalendar()

    expect(screen.getByText('Vista diária')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mês' }))

    await waitFor(() => {
      expect(screen.getByText('Vista mensal')).toBeInTheDocument()
    })

    expect(screen.queryByText('Vista diária')).not.toBeInTheDocument()
  })
})
