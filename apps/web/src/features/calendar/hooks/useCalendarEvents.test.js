import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../../auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    accessToken: 'token',
    isAuthenticated: true,
    isDemoSession: false,
  }),
}))

vi.mock('../../preferences/context/PreferencesContext.jsx', () => ({
  usePreferences: () => ({
    generalPreferences: {
      timezone: 'America/Sao_Paulo',
    },
  }),
}))

vi.mock('../../../shared/api/apiClient.js', () => ({
  apiRequest: vi.fn(),
}))

const { useCalendarEvents } = await import('./useCalendarEvents.js')
const { apiRequest } = await import('../../../shared/api/apiClient.js')

describe('useCalendarEvents', () => {
  beforeEach(() => {
    apiRequest.mockReset()
  })

  it('does not fetch when enabled=false', async () => {
    const { result } = renderHook(() => useCalendarEvents({ enabled: false }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(apiRequest).not.toHaveBeenCalled()
    expect(result.current.filteredEvents).toEqual([])
  })

  it('filters generatedFromCard events when includeGeneratedFromCard=false', async () => {
    apiRequest.mockResolvedValueOnce([
      {
        id: 'generated-1',
        title: 'Gerado do card',
        generatedFromCard: true,
        startsAt: { iso: '2026-04-20T13:00:00-03:00' },
        endsAt: { iso: '2026-04-20T14:00:00-03:00' },
      },
      {
        id: 'internal-1',
        title: 'Interno',
        generatedFromCard: false,
        startsAt: { iso: '2026-04-20T09:00:00-03:00' },
        endsAt: { iso: '2026-04-20T10:00:00-03:00' },
      },
    ])

    const { result } = renderHook(() => useCalendarEvents({
      includeGeneratedFromCard: false,
      enrichGeneratedCardKinds: false,
    }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.events.map((event) => event.id)).toEqual(['internal-1'])
    expect(apiRequest).toHaveBeenCalledTimes(1)
  })

  it('skips plan board enrichment when enrichGeneratedCardKinds=false', async () => {
    apiRequest.mockImplementation(async (path) => {
      if (path === '/api/calendar/events') {
        return [
          {
            id: 'generated-2',
            title: 'Gerado sem kind',
            generatedFromCard: true,
            planId: 'plan-1',
            linkedCardId: 'card-1',
            startsAt: { iso: '2026-04-20T13:00:00-03:00' },
            endsAt: { iso: '2026-04-20T14:00:00-03:00' },
          },
        ]
      }
      throw new Error(`Unexpected apiRequest path: ${path}`)
    })

    const { result } = renderHook(() => useCalendarEvents({ enrichGeneratedCardKinds: false }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(apiRequest).toHaveBeenCalledTimes(1)
    expect(apiRequest).toHaveBeenCalledWith('/api/calendar/events', expect.any(Object))
  })
})
