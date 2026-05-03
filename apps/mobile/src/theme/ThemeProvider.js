import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import { mobileApiRequest } from '../services/api'
import { useAuth } from '../providers/AuthProvider'
import { applyTheme, darkTheme, lightTheme, normalizeThemePreference } from './tokens'

const MobileThemeContext = createContext(null)

function resolveEffectiveTheme(preference, systemScheme) {
  const normalized = normalizeThemePreference(preference)
  if (normalized === 'dark') return 'dark'
  if (normalized === 'light') return 'light'
  return systemScheme === 'dark' ? 'dark' : 'light'
}

function buildNavigationTheme(activeTheme) {
  return {
    dark: activeTheme.isDark,
    colors: {
      primary: activeTheme.colors.text1,
      background: activeTheme.colors.appBg,
      card: activeTheme.colors.surface1,
      text: activeTheme.colors.text1,
      border: activeTheme.colors.border1,
      notification: activeTheme.colors.red,
    },
    fonts: {
      regular: { fontFamily: undefined, fontWeight: '400' },
      medium: { fontFamily: undefined, fontWeight: '500' },
      bold: { fontFamily: undefined, fontWeight: '700' },
      heavy: { fontFamily: undefined, fontWeight: '800' },
    },
  }
}

export function MobileThemeProvider({ children }) {
  const systemScheme = useColorScheme()
  const { accessToken, isAuthenticated, isReady } = useAuth()
  const [themePreference, setThemePreferenceState] = useState('system')
  const [loadedForToken, setLoadedForToken] = useState(null)

  const effectiveTheme = resolveEffectiveTheme(themePreference, systemScheme)
  const activeTheme = effectiveTheme === 'dark' ? darkTheme : lightTheme
  applyTheme(activeTheme)

  useEffect(() => {
    if (!isReady) return
    if (!isAuthenticated || !accessToken) {
      setThemePreferenceState('system')
      setLoadedForToken(null)
      return
    }
    if (loadedForToken === accessToken) return

    let cancelled = false
    mobileApiRequest('/api/settings', { token: accessToken })
      .then((snapshot) => {
        if (cancelled) return
        setThemePreferenceState(normalizeThemePreference(snapshot?.preferences?.theme))
        setLoadedForToken(accessToken)
      })
      .catch(() => {
        if (!cancelled) setLoadedForToken(accessToken)
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, isAuthenticated, isReady, loadedForToken])

  const setThemePreference = useCallback((nextPreference) => {
    setThemePreferenceState(normalizeThemePreference(nextPreference))
  }, [])

  const value = useMemo(() => ({
    theme: activeTheme,
    themePreference,
    effectiveTheme,
    isDark: activeTheme.isDark,
    navigationTheme: buildNavigationTheme(activeTheme),
    statusBarStyle: activeTheme.isDark ? 'light' : 'dark',
    setThemePreference,
  }), [activeTheme, effectiveTheme, setThemePreference, themePreference])

  return (
    <MobileThemeContext.Provider value={value}>
      {children}
    </MobileThemeContext.Provider>
  )
}

export function useMobileTheme() {
  const context = useContext(MobileThemeContext)
  if (!context) {
    throw new Error('useMobileTheme must be used within MobileThemeProvider')
  }
  return context
}

export function useAppTheme() {
  return useMobileTheme().theme
}

export function useThemedStyles(createStyles) {
  const activeTheme = useAppTheme()
  return useMemo(() => createStyles(activeTheme), [activeTheme, createStyles])
}
