import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { apiRequest } from '../../../shared/api/apiClient.js'
import { ROUTES, normalizePathname } from '../../../shared/config/routes.js'

export const LOCAL_SETTINGS_STORAGE_PREFIX = 'plan-things:settings:v1:'
export const THEME_STORAGE_PREFIX = 'plan-things:theme:v1:'
const LAST_CONTEXT_STORAGE_PREFIX = 'plan-things:last-context:v1:'

export const DEFAULT_LOCAL_PREFERENCES = {
  homePage: 'workspace',
  openLastCtx: true,
  confirmDestructiveActions: true,
  liquidGlass: false,
  showCurrentPlanSection: true,
}

export const DEFAULT_GENERAL_PREFERENCES = {
  language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  dateFormat: 'dd/MM/yyyy',
  timeFormat: '24h',
  theme: 'system',
}

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  emailNotifs: true,
  eventReminders: true,
  deadlineAlerts: true,
}

const TRACKABLE_CONTEXT_PREFIXES = [
  ROUTES.workspaceBoard,
  ROUTES.workspace,
  ROUTES.canvas,
  ROUTES.calendar,
  ROUTES.files,
]

const PreferencesContext = createContext(null)

function toDate(value) {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'object' && value !== null && typeof value.iso === 'string') {
    return toDate(value.iso)
  }

  if (typeof value === 'number' || typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

function normalizeLocaleTag(value) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) return null

  try {
    return Intl.getCanonicalLocales(normalized)[0] ?? null
  } catch {
    return null
  }
}

function normalizeTimeZoneId(value) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) return null

  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: normalized }).resolvedOptions().timeZone
  } catch {
    return null
  }
}

function isPathInside(basePath, pathname) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`)
}

function isTrackableContextPath(pathname) {
  const normalized = normalizePathname(pathname)
  return TRACKABLE_CONTEXT_PREFIXES.some((prefix) => isPathInside(prefix, normalized))
}

function isValidLastContextPath(pathname) {
  const normalized = normalizePathname(pathname)
  return TRACKABLE_CONTEXT_PREFIXES.some((prefix) => isPathInside(prefix, normalized))
}

export function buildLocalSettingsStorageKey(userId) {
  if (!userId) return null
  return `${LOCAL_SETTINGS_STORAGE_PREFIX}${userId}`
}

export function buildThemeStorageKey(userId) {
  return `${THEME_STORAGE_PREFIX}${userId || 'anonymous'}`
}

function buildLastContextStorageKey(userId) {
  if (!userId) return null
  return `${LAST_CONTEXT_STORAGE_PREFIX}${userId}`
}

function readStoredJson(key) {
  if (!key || typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function writeStoredJson(key, value) {
  if (!key || typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function normalizeThemePreference(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!normalized) return null
  if (normalized === 'system' || normalized === 'light' || normalized === 'dark') return normalized
  return null
}

export function readStoredTheme(userId) {
  const key = buildThemeStorageKey(userId)
  if (!key || typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(key)
    return normalizeThemePreference(raw)
  } catch {
    return null
  }
}

function writeStoredTheme(userId, theme) {
  const key = buildThemeStorageKey(userId)
  if (!key || typeof window === 'undefined') return
  window.localStorage.setItem(key, theme)
}

export function readStoredLocalPreferences(userId) {
  const key = buildLocalSettingsStorageKey(userId)
  const parsed = readStoredJson(key)

  if (!parsed) {
    return null
  }

  return {
    homePage: parsed.homePage ?? DEFAULT_LOCAL_PREFERENCES.homePage,
    openLastCtx: parsed.openLastCtx ?? DEFAULT_LOCAL_PREFERENCES.openLastCtx,
    confirmDestructiveActions: parsed.confirmDestructiveActions ?? DEFAULT_LOCAL_PREFERENCES.confirmDestructiveActions,
    liquidGlass: parsed.liquidGlass ?? DEFAULT_LOCAL_PREFERENCES.liquidGlass,
    showCurrentPlanSection: parsed.showCurrentPlanSection ?? DEFAULT_LOCAL_PREFERENCES.showCurrentPlanSection,
  }
}

function writeStoredLocalPreferences(userId, preferences) {
  const key = buildLocalSettingsStorageKey(userId)
  if (!key) return

  writeStoredJson(key, {
    homePage: preferences.homePage,
    openLastCtx: preferences.openLastCtx,
    confirmDestructiveActions: preferences.confirmDestructiveActions,
    liquidGlass: preferences.liquidGlass,
    showCurrentPlanSection: preferences.showCurrentPlanSection,
  })
}

function readStoredLastContext(userId) {
  const key = buildLastContextStorageKey(userId)
  if (!key || typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(key)
  if (!raw) return null

  const normalized = normalizePathname(raw)
  return isValidLastContextPath(normalized) ? normalized : null
}

function writeStoredLastContext(userId, pathname) {
  const key = buildLastContextStorageKey(userId)
  if (!key || typeof window === 'undefined') return
  window.localStorage.setItem(key, normalizePathname(pathname))
}

function mapHomePageToRoute(homePage) {
  if (homePage === 'canvas') return ROUTES.canvas
  if (homePage === 'calendar') return ROUTES.calendar
  if (homePage === 'files') return ROUTES.files
  return ROUTES.workspace
}

export function resolveInitialRouteForState({
  localPreferences = DEFAULT_LOCAL_PREFERENCES,
  lastContext = null,
}) {
  const preferredHomeRoute = mapHomePageToRoute(localPreferences.homePage)
  if (!localPreferences.openLastCtx) return preferredHomeRoute
  if (lastContext && isValidLastContextPath(lastContext)) return normalizePathname(lastContext)
  return preferredHomeRoute
}

function normalizeGeneralPreferences(source = {}) {
  const language = normalizeLocaleTag(source.language ?? source.locale ?? source.localeTag)
    ?? DEFAULT_GENERAL_PREFERENCES.language
  const timezone = normalizeTimeZoneId(source.timezone ?? source.timeZone)
    ?? DEFAULT_GENERAL_PREFERENCES.timezone
  const theme = normalizeThemePreference(source.theme)
    ?? DEFAULT_GENERAL_PREFERENCES.theme

  return {
    language,
    timezone,
    dateFormat: source.dateFormat ?? DEFAULT_GENERAL_PREFERENCES.dateFormat,
    timeFormat: source.timeFormat ?? DEFAULT_GENERAL_PREFERENCES.timeFormat,
    theme,
  }
}

function normalizeNotificationPreferences(source = {}) {
  return {
    emailNotifs: source.emailNotifs ?? DEFAULT_NOTIFICATION_PREFERENCES.emailNotifs,
    eventReminders: source.eventReminders ?? DEFAULT_NOTIFICATION_PREFERENCES.eventReminders,
    deadlineAlerts: source.deadlineAlerts ?? DEFAULT_NOTIFICATION_PREFERENCES.deadlineAlerts,
  }
}

function capitalizeFirst(value) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function normalizeShortMonthLabel(value) {
  return value.replace('.', '').trim().toLowerCase()
}

function resolveFormattingPreferences(preferences = {}) {
  return normalizeGeneralPreferences(preferences)
}

export function formatDateWithPreferences(value, preferences = {}) {
  const date = toDate(value)
  if (!date) return ''

  const { language, timezone, dateFormat } = resolveFormattingPreferences(preferences)
  const parts = new Intl.DateTimeFormat(language, {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date)

  const partByType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const day = partByType.day ?? ''
  const month = partByType.month ?? ''
  const year = partByType.year ?? ''

  if (dateFormat === 'MM/dd/yyyy') {
    return `${month}/${day}/${year}`
  }

  if (dateFormat === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`
  }

  return `${day}/${month}/${year}`
}

export function formatTimeWithPreferences(value, preferences = {}) {
  const date = toDate(value)
  if (!date) return ''

  const { language, timezone, timeFormat } = resolveFormattingPreferences(preferences)
  return new Intl.DateTimeFormat(language, {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  }).format(date)
}

export function formatClockTimeWithPreferences(timeValue, preferences = {}) {
  const [hoursRaw = '00', minutesRaw = '00'] = String(timeValue || '00:00').split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return ''
  }

  const { language, timeFormat } = resolveFormattingPreferences(preferences)
  const date = new Date(Date.UTC(2000, 0, 1, hours, minutes, 0, 0))

  return new Intl.DateTimeFormat(language, {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  }).format(date)
}

export function formatDateTimeWithPreferences(value, preferences = {}) {
  const dateText = formatDateWithPreferences(value, preferences)
  const timeText = formatTimeWithPreferences(value, preferences)
  if (!dateText) return ''
  if (!timeText) return dateText
  return `${dateText} ${timeText}`
}

export function formatMonthLabelWithPreferences(value, preferences = {}, options = {}) {
  const date = toDate(value)
  if (!date) return ''

  const { language, timezone } = resolveFormattingPreferences(preferences)
  return capitalizeFirst(new Intl.DateTimeFormat(language, {
    timeZone: timezone,
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(date))
}

export function formatCompactDayMonthWithPreferences(value, preferences = {}) {
  const date = toDate(value)
  if (!date) return ''

  const { language, timezone } = resolveFormattingPreferences(preferences)
  const day = new Intl.DateTimeFormat(language, {
    timeZone: timezone,
    day: 'numeric',
  }).format(date)
  const month = normalizeShortMonthLabel(new Intl.DateTimeFormat(language, {
    timeZone: timezone,
    month: 'short',
  }).format(date))

  return `${day} ${month}`.trim()
}

export function PreferencesProvider({ children }) {
  const location = useLocation()
  const {
    currentUser,
    accessToken,
    isAuthenticated,
    isDemoSession,
    patchSession,
  } = useAuth()
  const backendEnabled = isAuthenticated && !isDemoSession
  const [generalPreferences, setGeneralPreferences] = useState(() => ({
    ...DEFAULT_GENERAL_PREFERENCES,
    theme:
      readStoredTheme(currentUser?.id)
      ?? readStoredTheme(null)
      ?? DEFAULT_GENERAL_PREFERENCES.theme,
  }))
  const [localPreferences, setLocalPreferences] = useState(DEFAULT_LOCAL_PREFERENCES)
  const [notificationPreferences, setNotificationPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES)
  const [isHydrating, setIsHydrating] = useState(true)
  const generalRequestRef = useRef(0)
  const notificationsRequestRef = useRef(0)
  const generalStateRef = useRef(DEFAULT_GENERAL_PREFERENCES)
  const localStateRef = useRef(DEFAULT_LOCAL_PREFERENCES)
  const notificationStateRef = useRef(DEFAULT_NOTIFICATION_PREFERENCES)

  useEffect(() => {
    generalStateRef.current = generalPreferences
  }, [generalPreferences])

  useEffect(() => {
    localStateRef.current = localPreferences
  }, [localPreferences])

  useEffect(() => {
    notificationStateRef.current = notificationPreferences
  }, [notificationPreferences])

  useEffect(() => {
    const storedLocal = readStoredLocalPreferences(currentUser?.id)
    const nextLocal = storedLocal ?? DEFAULT_LOCAL_PREFERENCES
    setLocalPreferences(nextLocal)
    localStateRef.current = nextLocal
  }, [currentUser?.id])

  useEffect(() => {
    const storedTheme = readStoredTheme(currentUser?.id)
    if (!storedTheme) return

    setGeneralPreferences((current) => {
      if (current.theme === storedTheme) return current
      return {
        ...current,
        theme: storedTheme,
      }
    })
  }, [currentUser?.id])

  useEffect(() => {
    if (!backendEnabled || !accessToken) {
      const storedTheme =
        readStoredTheme(currentUser?.id)
        ?? readStoredTheme(null)
        ?? generalStateRef.current.theme
        ?? DEFAULT_GENERAL_PREFERENCES.theme
      const fallbackGeneral = normalizeGeneralPreferences({
        language: currentUser?.locale,
        timezone: currentUser?.timeZone,
        theme: storedTheme,
      })

      setGeneralPreferences((current) => ({
        ...current,
        ...fallbackGeneral,
      }))
      setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES)
      setIsHydrating(false)
      return
    }

    let active = true
    setIsHydrating(true)

    async function hydratePreferences() {
      try {
        const snapshot = await apiRequest('/api/settings', {
          token: accessToken,
        })

        if (!active) return

        const nextGeneral = normalizeGeneralPreferences({
          language: snapshot?.preferences?.locale,
          timezone: snapshot?.preferences?.timeZone,
          theme: snapshot?.preferences?.theme,
          dateFormat: snapshot?.preferences?.dateFormat,
          timeFormat: snapshot?.preferences?.timeFormat,
        })

        const nextNotifications = normalizeNotificationPreferences(snapshot?.notifications)
        setGeneralPreferences(nextGeneral)
        writeStoredTheme(currentUser?.id, nextGeneral.theme)
        setNotificationPreferences(nextNotifications)
      } catch {
        if (!active) return

        const storedTheme =
          readStoredTheme(currentUser?.id)
          ?? readStoredTheme(null)
          ?? generalStateRef.current.theme
          ?? DEFAULT_GENERAL_PREFERENCES.theme
        setGeneralPreferences(normalizeGeneralPreferences({
          language: currentUser?.locale,
          timezone: currentUser?.timeZone,
          theme: storedTheme,
        }))
        setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES)
      } finally {
        if (active) {
          setIsHydrating(false)
        }
      }
    }

    hydratePreferences()

    return () => {
      active = false
    }
  }, [accessToken, backendEnabled, currentUser?.locale, currentUser?.timeZone])

  useEffect(() => {
    if (!currentUser?.id) return
    if (!isTrackableContextPath(location.pathname)) return
    writeStoredLastContext(currentUser.id, location.pathname)
  }, [currentUser?.id, location.pathname])

  const resolveInitialRoute = useCallback((targetUserId = currentUser?.id) => {
    if (!targetUserId) {
      return ROUTES.workspace
    }

    const storedLocal = readStoredLocalPreferences(targetUserId) ?? DEFAULT_LOCAL_PREFERENCES
    const lastContext = readStoredLastContext(targetUserId)
    return resolveInitialRouteForState({
      localPreferences: storedLocal,
      lastContext,
    })
  }, [currentUser?.id])

  const updateGeneral = useCallback(async (patch) => {
    const previous = generalStateRef.current
    const nextGeneral = normalizeGeneralPreferences({
      ...previous,
      ...patch,
    })

    setGeneralPreferences(nextGeneral)
    generalStateRef.current = nextGeneral
    writeStoredTheme(currentUser?.id, nextGeneral.theme)

    if (!backendEnabled || !accessToken) {
      return nextGeneral
    }

    const requestId = ++generalRequestRef.current

    try {
      const response = await apiRequest('/api/settings/preferences', {
        method: 'PATCH',
        token: accessToken,
        body: {
          locale: nextGeneral.language,
          timeZone: nextGeneral.timezone,
          theme: nextGeneral.theme,
          dateFormat: nextGeneral.dateFormat,
          timeFormat: nextGeneral.timeFormat,
        },
      })

      if (requestId !== generalRequestRef.current) {
        return generalStateRef.current
      }

      const persisted = normalizeGeneralPreferences({
        language: response.locale,
        timezone: response.timeZone,
        theme: response.theme,
        dateFormat: response.dateFormat,
        timeFormat: response.timeFormat,
      })

      setGeneralPreferences(persisted)
      generalStateRef.current = persisted
      writeStoredTheme(currentUser?.id, persisted.theme)
      patchSession?.({
        user: {
          locale: persisted.language,
          timeZone: persisted.timezone,
        },
      })
      return persisted
    } catch (error) {
      if (requestId === generalRequestRef.current) {
        setGeneralPreferences(previous)
        generalStateRef.current = previous
        writeStoredTheme(currentUser?.id, previous.theme)
        throw error
      }
      return generalStateRef.current
    }
  }, [accessToken, backendEnabled, currentUser?.id, patchSession])

  const updateLocal = useCallback((patch) => {
    const nextLocal = {
      ...localStateRef.current,
      ...patch,
    }

    setLocalPreferences(nextLocal)
    localStateRef.current = nextLocal
    writeStoredLocalPreferences(currentUser?.id, nextLocal)

    return nextLocal
  }, [currentUser?.id])

  const restoreLocalDefaults = useCallback(() => {
    return updateLocal(DEFAULT_LOCAL_PREFERENCES)
  }, [updateLocal])

  const updateNotifications = useCallback(async (patch) => {
    const previous = notificationStateRef.current
    const nextNotifications = normalizeNotificationPreferences({
      ...previous,
      ...patch,
    })

    setNotificationPreferences(nextNotifications)
    notificationStateRef.current = nextNotifications

    if (!backendEnabled || !accessToken) {
      return nextNotifications
    }

    const requestId = ++notificationsRequestRef.current

    try {
      const response = await apiRequest('/api/settings/notifications', {
        method: 'PATCH',
        token: accessToken,
        body: {
          emailNotifs: nextNotifications.emailNotifs,
          eventReminders: nextNotifications.eventReminders,
          deadlineAlerts: nextNotifications.deadlineAlerts,
        },
      })

      if (requestId !== notificationsRequestRef.current) {
        return notificationStateRef.current
      }

      const persisted = normalizeNotificationPreferences(response)
      setNotificationPreferences(persisted)
      notificationStateRef.current = persisted
      return persisted
    } catch (error) {
      if (requestId === notificationsRequestRef.current) {
        setNotificationPreferences(previous)
        notificationStateRef.current = previous
        throw error
      }
      return notificationStateRef.current
    }
  }, [accessToken, backendEnabled])

  const formatIntl = useCallback((value, options = {}) => {
    const date = toDate(value)
    if (!date) return ''
    return new Intl.DateTimeFormat(generalStateRef.current.language, {
      timeZone: generalStateRef.current.timezone,
      ...options,
    }).format(date)
  }, [])

  const formatDate = useCallback((value) => {
    return formatDateWithPreferences(value, generalStateRef.current)
  }, [])

  const formatTime = useCallback((value) => {
    return formatTimeWithPreferences(value, generalStateRef.current)
  }, [])

  const formatClockTime = useCallback((value) => {
    return formatClockTimeWithPreferences(value, generalStateRef.current)
  }, [])

  const formatDateTime = useCallback((value) => {
    return formatDateTimeWithPreferences(value, generalStateRef.current)
  }, [])

  const formatMonthLabel = useCallback((value, options = {}) => {
    return formatMonthLabelWithPreferences(value, generalStateRef.current, options)
  }, [])

  const formatCompactDayMonth = useCallback((value) => {
    return formatCompactDayMonthWithPreferences(value, generalStateRef.current)
  }, [])

  const value = useMemo(() => ({
    generalPreferences,
    localPreferences,
    notificationPreferences,
    isHydrating,
    updateGeneral,
    updateLocal,
    restoreLocalDefaults,
    updateNotifications,
    resolveInitialRoute,
    formatIntl,
    formatDate,
    formatTime,
    formatClockTime,
    formatDateTime,
    formatMonthLabel,
    formatCompactDayMonth,
  }), [
    formatClockTime,
    formatCompactDayMonth,
    formatDate,
    formatDateTime,
    formatIntl,
    formatMonthLabel,
    formatTime,
    generalPreferences,
    isHydrating,
    localPreferences,
    notificationPreferences,
    resolveInitialRoute,
    restoreLocalDefaults,
    updateGeneral,
    updateLocal,
    updateNotifications,
  ])

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}
