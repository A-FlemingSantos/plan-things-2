import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { useAuth } from './features/auth/context/AuthContext.jsx'
import { usePreferences } from './features/preferences/context/PreferencesContext.jsx'
import Auth from './features/auth/pages/Auth/Auth.jsx'
import OAuthCallback from './features/auth/pages/OAuthCallback/OAuthCallback.jsx'
import PasswordRecovery from './features/auth/pages/PasswordRecovery/PasswordRecovery.jsx'
import CalendarPage from './features/calendar/pages/CalendarPage/CalendarPage.jsx'
import FilesPage from './features/files/pages/FilesPage/FilesPage.jsx'
import { INFO_PAGES } from './features/info/data/infoPages.js'
import InfoPage from './features/info/pages/InfoPage.jsx'
import LandingPage from './features/landing/pages/LandingPage.jsx'
import AppThemeScope from './features/preferences/components/AppThemeScope/AppThemeScope.jsx'
import SettingsPage from './features/settings/pages/SettingsPage/SettingsPage.jsx'
import KanbanBoard from './features/workspace/pages/KanbanBoard/KanbanBoard.jsx'
import InviteAccept from './features/workspace/pages/InviteAccept/InviteAccept.jsx'
import Workspace from './features/workspace/pages/Workspace/Workspace.jsx'
import {
  buildWorkspaceBoardPath,
  isInternalAppPath,
  LEGACY_PLAN_ROUTE_ALIASES,
  normalizePathname,
  ROUTE_ALIASES,
  ROUTES,
  toRouteLocation,
} from './shared/config/routes.js'

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
  const isInternalPath = isInternalAppPath(location.pathname)

  return (
    <AppThemeScope preference={isInternalPath ? null : 'system'}>
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
  const { resolveInitialRoute } = usePreferences()
  const location = useLocation()
  const callbackBackgroundLocation = normalizePathname(location.pathname) === ROUTES.settings
    ? toRouteLocation(new URLSearchParams(location.search).get('background'))
    : null
  const stateBackgroundLocation = normalizePathname(location.pathname) === ROUTES.settings
    ? toRouteLocation(
        location.state?.backgroundLocation?.pathname
          ? `${location.state.backgroundLocation.pathname}${location.state.backgroundLocation.search ?? ''}${location.state.backgroundLocation.hash ?? ''}`
          : null,
      )
    : null
  const modalBackgroundLocation = normalizePathname(location.pathname) === ROUTES.settings
    ? (
        stateBackgroundLocation
        ?? callbackBackgroundLocation
        ?? {
          pathname: resolveInitialRoute(),
          search: '',
          hash: '',
        }
      )
    : null
  const renderedLocation = modalBackgroundLocation ?? location

  if (!isReady) {
    return <AppBootstrapScreen />
  }

  return (
    <>
      <Routes location={renderedLocation}>
        <Route
          path={ROUTES.home}
          element={(
            <AppThemeScope preference="system">
              <LandingPage />
            </AppThemeScope>
          )}
        />
        <Route
          path={ROUTES.login}
          element={(
            <AppThemeScope preference="system">
              <Auth initialMode="login" />
            </AppThemeScope>
          )}
        />
        <Route
          path={ROUTES.register}
          element={(
            <AppThemeScope preference="system">
              <Auth initialMode="register" />
            </AppThemeScope>
          )}
        />
        <Route
          path={ROUTES.oauthCallback}
          element={(
            <AppThemeScope preference="system">
              <OAuthCallback />
            </AppThemeScope>
          )}
        />
        <Route
          path={ROUTES.forgot}
          element={(
            <AppThemeScope preference="system">
              <PasswordRecovery mode="forgot" />
            </AppThemeScope>
          )}
        />
        <Route
          path={ROUTES.reset}
          element={(
            <AppThemeScope preference="system">
              <PasswordRecovery mode="reset" />
            </AppThemeScope>
          )}
        />
        <Route
          path="/plans/invites/:token"
          element={(
            <AppThemeScope preference="system">
              <InviteAccept />
            </AppThemeScope>
          )}
        />
        <Route path="/app" element={<PreferredAppEntryRedirect />} />
        <Route path={ROUTES.workspace} element={<Workspace />} />
        <Route path={ROUTES.workspaceBoard} element={<KanbanBoard />} />
        <Route path={`${ROUTES.workspaceBoard}/:planId`} element={<KanbanBoard />} />
        <Route path={ROUTES.calendar} element={<CalendarPage />} />
        <Route path={`${ROUTES.files}/*`} element={<FilesPage />} />
        {Object.entries(INFO_PAGES).map(([path, page]) => (
          <Route
            key={path}
            path={path}
            element={(
              <AppThemeScope preference="system">
                <InfoPage {...page} />
              </AppThemeScope>
            )}
          />
        ))}

        {LEGACY_PLAN_ROUTE_ALIASES.board.map((path) => (
          <Route
            key={path}
            path={path}
            element={<LegacyPlanRedirect buildPath={buildWorkspaceBoardPath} />}
          />
        ))}

        {ROUTE_ALIASES.map(({ from, to }) => (
          <Route key={from} path={from} element={<Navigate to={to} replace />} />
        ))}

        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Routes>

      {normalizePathname(location.pathname) === ROUTES.settings ? (
        <Routes>
          <Route path={ROUTES.settings} element={<SettingsPage modal backgroundLocation={modalBackgroundLocation} />} />
        </Routes>
      ) : null}
    </>
  )
}
