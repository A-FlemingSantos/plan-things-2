import { useEffect, useMemo, useState } from 'react'
import { normalizeThemePreference, usePreferences } from '../../context/PreferencesContext.jsx'

function getSystemPrefersDark() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveEffectiveTheme(preference) {
  if (preference === 'dark') return 'dark'
  if (preference === 'light') return 'light'
  return getSystemPrefersDark() ? 'dark' : 'light'
}

export default function AppThemeScope({ children, enabled = true, className = '' }) {
  const { generalPreferences } = usePreferences()
  const themePreference = useMemo(
    () => normalizeThemePreference(generalPreferences?.theme) ?? 'system',
    [generalPreferences?.theme],
  )
  const [effectiveTheme, setEffectiveTheme] = useState(() => resolveEffectiveTheme(themePreference))

  useEffect(() => {
    if (!enabled) return

    setEffectiveTheme(resolveEffectiveTheme(themePreference))

    if (themePreference !== 'system') return
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light')

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [enabled, themePreference])

  if (!enabled) {
    return children
  }

  return (
    <div
      data-theme={effectiveTheme}
      data-theme-preference={themePreference}
      data-app-theme-scope
      style={{ colorScheme: effectiveTheme }}
      className={className}
    >
      {children}
    </div>
  )
}

