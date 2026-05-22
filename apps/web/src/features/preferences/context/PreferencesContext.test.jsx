import { describe, expect, it } from 'vitest'
import {
  formatClockTimeWithPreferences,
  formatCompactDayMonthWithPreferences,
  formatDateTimeWithPreferences,
  formatDateWithPreferences,
  formatMonthLabelWithPreferences,
  formatTimeWithPreferences,
  resolveInitialRouteForState,
} from './PreferencesContext.jsx'

describe('PreferencesContext helpers', () => {
  it('resolveInitialRouteForState prioritizes last context when enabled and valid', () => {
    const nextRoute = resolveInitialRouteForState({
      localPreferences: {
        homePage: 'workspace',
        openLastCtx: true,
      },
      lastContext: '/calendar',
    })

    expect(nextRoute).toBe('/calendar')
  })

  it('resolveInitialRouteForState falls back to homePage when last context is invalid or disabled', () => {
    const withInvalidContext = resolveInitialRouteForState({
      localPreferences: {
        homePage: 'files',
        openLastCtx: true,
      },
      lastContext: '/help',
    })

    const withDisabledLastContext = resolveInitialRouteForState({
      localPreferences: {
        homePage: 'workspace',
        openLastCtx: false,
      },
      lastContext: '/calendar',
    })

    expect(withInvalidContext).toBe('/workspace')
    expect(withDisabledLastContext).toBe('/workspace')
  })

  it('formatDateWithPreferences respects configured date formats', () => {
    const value = '2026-08-03T13:45:00Z'

    expect(formatDateWithPreferences(value, {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      dateFormat: 'dd/MM/yyyy',
    })).toBe('03/08/2026')

    expect(formatDateWithPreferences(value, {
      language: 'en-US',
      timezone: 'America/New_York',
      dateFormat: 'MM/dd/yyyy',
    })).toBe('08/03/2026')

    expect(formatDateWithPreferences(value, {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      dateFormat: 'yyyy-MM-dd',
    })).toBe('2026-08-03')
  })

  it('formatTimeWithPreferences respects 24h and 12h clocks', () => {
    const value = '2026-08-03T13:45:00Z'

    const hour24 = formatTimeWithPreferences(value, {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      timeFormat: '24h',
    })
    const hour12 = formatTimeWithPreferences(value, {
      language: 'en-US',
      timezone: 'America/New_York',
      timeFormat: '12h',
    })

    expect(hour24).toContain('10:45')
    expect(hour12).toMatch(/9:45\s?(AM|am)/)
  })

  it('formatClockTimeWithPreferences formats wall-clock time without timezone conversion', () => {
    const hour24 = formatClockTimeWithPreferences('09:30', {
      language: 'pt-BR',
      timezone: 'America/New_York',
      timeFormat: '24h',
    })
    const hour12 = formatClockTimeWithPreferences('09:30', {
      language: 'en-US',
      timezone: 'America/New_York',
      timeFormat: '12h',
    })

    expect(hour24).toContain('09:30')
    expect(hour12).toMatch(/9:30\s?(AM|am)/)
  })

  it('formats datetime, month labels and compact day/month using locale and timezone', () => {
    const value = '2026-08-03T13:45:00Z'

    const dateTime = formatDateTimeWithPreferences(value, {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      dateFormat: 'dd/MM/yyyy',
      timeFormat: '24h',
    })

    const monthLabel = formatMonthLabelWithPreferences(value, {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
    })

    const compact = formatCompactDayMonthWithPreferences(value, {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
    })

    expect(dateTime).toContain('03/08/2026')
    expect(dateTime).toContain('10:45')
    expect(monthLabel).toMatch(/^Agosto de 2026$/)
    expect(compact).toBe('3 ago')
  })
})
