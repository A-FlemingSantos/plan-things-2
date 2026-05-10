import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { useAuth } from './features/auth/context/AuthContext.jsx'
import { buildAuthRedirectState } from './features/auth/utils/authRedirect.js'
import { readSessionModeFromAuthState } from './features/auth/utils/sessionMode.js'
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
  const { resolveInitialRoute } = usePreferences()

  return <Navigate to={resolveInitialRoute()} replace />
}

function RequireSession({ children, notice = '' }) {
  const auth = useAuth()
  const location = useLocation()
  const sessionMode = readSessionModeFromAuthState(auth)

  if (sessionMode === 'anonymous') {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={buildAuthRedirectState(location, notice ? { notice } : {})}
      />
    )
  }

  return children
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
  const auth = useAuth()
  const isReady = auth.isReady
  const pendingLogoutRedirect = auth.pendingLogoutRedirect ?? null
  const clearPendingLogoutRedirect = auth.clearPendingLogoutRedirect ?? (() => {})
  const { resolveInitialRoute } = usePreferences()
  const location = useLocation()
  const sessionMode = readSessionModeFromAuthState(auth)
  const normalizedPathname = normalizePathname(location.pathname)
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

  useEffect(() => {
    if (sessionMode !== 'anonymous') {
      clearPendingLogoutRedirect()
      return
    }

    if (!pendingLogoutRedirect) {
      return
    }

    const targetPathname = normalizePathname(new URL(pendingLogoutRedirect.to, 'https://planthings.local').pathname)
    if (normalizedPathname === targetPathname) {
      clearPendingLogoutRedirect()
    }
  }, [clearPendingLogoutRedirect, normalizedPathname, pendingLogoutRedirect, sessionMode])

  if (!isReady || sessionMode === 'boot') {
    return <AppBootstrapScreen />
  }

  if (pendingLogoutRedirect) {
    const targetPathname = normalizePathname(new URL(pendingLogoutRedirect.to, 'https://planthings.local').pathname)
    if (normalizedPathname !== targetPathname) {
      return <Navigate to={pendingLogoutRedirect.to} replace={pendingLogoutRedirect.replace} />
    }
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
            <RequireSession notice="Faça login para aceitar o convite.">
              <AppThemeScope preference="system">
                <InviteAccept />
              </AppThemeScope>
            </RequireSession>
          )}
        />
        <Route path="/app" element={<RequireSession><PreferredAppEntryRedirect /></RequireSession>} />
        <Route path={ROUTES.workspace} element={<RequireSession><Workspace /></RequireSession>} />
        <Route path={ROUTES.workspaceBoard} element={<RequireSession><KanbanBoard /></RequireSession>} />
        <Route path={`${ROUTES.workspaceBoard}/:planId`} element={<RequireSession><KanbanBoard /></RequireSession>} />
        <Route path={ROUTES.calendar} element={<RequireSession><CalendarPage /></RequireSession>} />
        <Route path={`${ROUTES.files}/*`} element={<RequireSession><FilesPage /></RequireSession>} />
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
          <Route
            path={ROUTES.settings}
            element={(
              <RequireSession>
                <SettingsPage modal backgroundLocation={modalBackgroundLocation} />
              </RequireSession>
            )}
          />
        </Routes>
      ) : null}
    </>
  )
}
