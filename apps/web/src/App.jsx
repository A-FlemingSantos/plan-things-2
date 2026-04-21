import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { useAuth } from './features/auth/context/AuthContext.jsx'
import { usePreferences } from './features/preferences/context/PreferencesContext.jsx'
import Auth from './features/auth/pages/Auth/Auth.jsx'
import PasswordRecovery from './features/auth/pages/PasswordRecovery/PasswordRecovery.jsx'
import CanvasPage from './features/canvas/pages/CanvasPage/CanvasPage.jsx'
import CalendarPage from './features/calendar/pages/CalendarPage/CalendarPage.jsx'
import FilesPage from './features/files/pages/FilesPage/FilesPage.jsx'
import { INFO_PAGES } from './features/info/data/infoPages.js'
import InfoPage from './features/info/pages/InfoPage.jsx'
import LandingPage from './features/landing/pages/LandingPage.jsx'
import AppThemeScope from './features/preferences/components/AppThemeScope/AppThemeScope.jsx'
import SettingsPage from './features/settings/pages/SettingsPage/SettingsPage.jsx'
import KanbanBoard from './features/workspace/pages/KanbanBoard/KanbanBoard.jsx'
import Workspace from './features/workspace/pages/Workspace/Workspace.jsx'
import {
  buildCanvasPath,
  buildWorkspaceBoardPath,
  LEGACY_PLAN_ROUTE_ALIASES,
  normalizePathname,
  ROUTE_ALIASES,
  ROUTES,
} from './shared/config/routes.js'

function isInternalAppPath(pathname) {
  const normalized = normalizePathname(pathname ?? '')

  if (!normalized) return false

  if (normalized === '/app') return true

  const internalBases = [
    ROUTES.workspace,
    ROUTES.workspaceBoard,
    ROUTES.canvas,
    ROUTES.calendar,
    ROUTES.files,
    ROUTES.settings,
  ]

  for (const base of internalBases) {
    if (normalized === base || normalized.startsWith(`${base}/`)) return true
  }

  for (const { from } of ROUTE_ALIASES) {
    const aliasPath = normalizePathname(from)
    if (normalized === aliasPath || normalized.startsWith(`${aliasPath}/`)) return true
  }

  const legacyPrefixes = [
    ...LEGACY_PLAN_ROUTE_ALIASES.board,
    ...LEGACY_PLAN_ROUTE_ALIASES.canvas,
  ]
    .map((pattern) => pattern.replace('/:planId', ''))
    .map((path) => normalizePathname(path))

  for (const prefix of legacyPrefixes) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) return true
  }

  return false
}

function LegacyPlanRedirect({ buildPath }) {
  const { planId } = useParams()

  return <Navigate to={buildPath(planId)} replace />
}

function PreferredAppEntryRedirect() {
  const { isAuthenticated } = useAuth()
  const { resolveInitialRoute } = usePreferences()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.workspace} replace />
  }

  return <Navigate to={resolveInitialRoute()} replace />
}

function AppBootstrapScreen() {
  const location = useLocation()
  const enableTheme = isInternalAppPath(location.pathname)

  return (
    <AppThemeScope enabled={enableTheme}>
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '32px',
          background: 'linear-gradient(180deg, var(--surface-2) 0%, var(--app-bg) 100%)',
          color: 'var(--text-1)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Carregando sua sessão...</p>
          <p style={{ margin: '8px 0 0', color: 'var(--text-2)' }}>Preparando a aplicação com os dados mais recentes.</p>
        </div>
      </div>
    </AppThemeScope>
  )
}

export default function App() {
  const { isReady } = useAuth()

  if (!isReady) {
    return <AppBootstrapScreen />
  }

  return (
    <Routes>
      <Route path={ROUTES.home} element={<LandingPage />} />
      <Route path={ROUTES.login} element={<Auth initialMode="login" />} />
      <Route path={ROUTES.register} element={<Auth initialMode="register" />} />
      <Route path={ROUTES.forgot} element={<PasswordRecovery mode="forgot" />} />
      <Route path={ROUTES.reset} element={<PasswordRecovery mode="reset" />} />
      <Route path="/app" element={<PreferredAppEntryRedirect />} />
      <Route path={ROUTES.workspace} element={<Workspace />} />
      <Route path={ROUTES.workspaceBoard} element={<KanbanBoard />} />
      <Route path={`${ROUTES.workspaceBoard}/:planId`} element={<KanbanBoard />} />
      <Route path={ROUTES.canvas} element={<CanvasPage />} />
      <Route path={`${ROUTES.canvas}/:planId`} element={<CanvasPage />} />
      <Route path={ROUTES.calendar} element={<CalendarPage />} />
      <Route path={`${ROUTES.files}/*`} element={<FilesPage />} />
      <Route path={ROUTES.settings} element={<SettingsPage />} />

      {Object.entries(INFO_PAGES).map(([path, page]) => (
        <Route key={path} path={path} element={<InfoPage {...page} />} />
      ))}

      {LEGACY_PLAN_ROUTE_ALIASES.board.map((path) => (
        <Route
          key={path}
          path={path}
          element={<LegacyPlanRedirect buildPath={buildWorkspaceBoardPath} />}
        />
      ))}

      {LEGACY_PLAN_ROUTE_ALIASES.canvas.map((path) => (
        <Route
          key={path}
          path={path}
          element={<LegacyPlanRedirect buildPath={buildCanvasPath} />}
        />
      ))}

      {ROUTE_ALIASES.map(({ from, to }) => (
        <Route key={from} path={from} element={<Navigate to={to} replace />} />
      ))}

      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  )
}
