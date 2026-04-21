import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { normalizeThemePreference, usePreferences } from '../../context/PreferencesContext.jsx'

let rootThemeScopeMountCount = 0
let rootThemeScopePreviousState = null

function getSystemPrefersDark() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveEffectiveTheme(preference) {
  if (preference === 'dark') return 'dark'
  if (preference === 'light') return 'light'
  return getSystemPrefersDark() ? 'dark' : 'light'
}

function snapshotRootThemeScopeState() {
  if (typeof document === 'undefined') return null

  const html = document.documentElement
  const body = document.body

  return {
    htmlDataset: html?.dataset?.appColorScheme ?? null,
    bodyDataset: body?.dataset?.appColorScheme ?? null,
    htmlColorScheme: html?.style?.colorScheme ?? '',
    bodyColorScheme: body?.style?.colorScheme ?? '',
  }
}

function applyRootThemeScope(theme) {
  if (typeof document === 'undefined') return

  const html = document.documentElement
  const body = document.body

  if (html) {
    html.dataset.appColorScheme = theme
    html.style.colorScheme = theme
  }

  if (body) {
    body.dataset.appColorScheme = theme
    body.style.colorScheme = theme
  }
}

function restoreRootThemeScope(previous) {
  if (typeof document === 'undefined') return

  const html = document.documentElement
  const body = document.body

  if (html) {
    if (previous?.htmlDataset == null) delete html.dataset.appColorScheme
    else html.dataset.appColorScheme = previous.htmlDataset
    html.style.colorScheme = previous?.htmlColorScheme ?? ''
  }

  if (body) {
    if (previous?.bodyDataset == null) delete body.dataset.appColorScheme
    else body.dataset.appColorScheme = previous.bodyDataset
    body.style.colorScheme = previous?.bodyColorScheme ?? ''
  }
}

export default function AppThemeScope({ children, enabled = true, className = '' }) {
  const { generalPreferences } = usePreferences()
  const themePreference = useMemo(
    () => normalizeThemePreference(generalPreferences?.theme) ?? 'system',
    [generalPreferences?.theme],
  )
  const [effectiveTheme, setEffectiveTheme] = useState(() => resolveEffectiveTheme(themePreference))

  useLayoutEffect(() => {
    if (!enabled) return undefined
    if (typeof document === 'undefined') return undefined

    if (rootThemeScopeMountCount === 0) {
      rootThemeScopePreviousState = snapshotRootThemeScopeState()
    }

    rootThemeScopeMountCount += 1
    applyRootThemeScope(effectiveTheme)

    return () => {
      rootThemeScopeMountCount = Math.max(0, rootThemeScopeMountCount - 1)
      if (rootThemeScopeMountCount === 0) {
        restoreRootThemeScope(rootThemeScopePreviousState)
        rootThemeScopePreviousState = null
      }
    }
  }, [enabled, effectiveTheme])

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
