import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { useAuth } from './features/auth/context/AuthContext.jsx'
import { buildAuthRedirectState, resolveAccountHomeRoute } from './features/auth/utils/authRedirect.js'
import { readSessionModeFromAuthState } from './features/auth/utils/sessionMode.js'
import { usePreferences } from './features/preferences/context/PreferencesContext.jsx'
import Auth from './features/auth/pages/Auth/Auth.jsx'
import OAuthCallback from './features/auth/pages/OAuthCallback/OAuthCallback.jsx'
import PasswordRecovery from './features/auth/pages/PasswordRecovery/PasswordRecovery.jsx'
import { INFO_PAGES } from './features/info/data/infoPages.js'
import InfoPage from './features/info/pages/InfoPage.jsx'
import LandingPage from './features/landing/pages/LandingPage.jsx'
import AppThemeScope from './features/preferences/components/AppThemeScope/AppThemeScope.jsx'
import DocsHomePage from './features/docs/pages/DocsHomePage/DocsHomePage.jsx'
import DocsPage from './features/docs/pages/DocsPage/DocsPage.jsx'
import DocInviteAccept from './features/docs/pages/DocInviteAccept/DocInviteAccept.jsx'
import SettingsPage from './features/settings/pages/SettingsPage/SettingsPage.jsx'
import KanbanBoard from './features/workspace/pages/KanbanBoard/KanbanBoard.jsx'
import InviteAccept from './features/workspace/pages/InviteAccept/InviteAccept.jsx'
import Workspace from './features/workspace/pages/Workspace/Workspace.jsx'
import AuthenticatedAppHeader from './shared/components/AuthenticatedAppHeader/AuthenticatedAppHeader.jsx'
import LoadingScreen from './shared/components/Loader/LoadingScreen.jsx'
import { AppChromeProvider, useAppChrome } from './shared/context/AppChromeContext.jsx'
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

function KanbanBoardRoute() {
  const { planId } = useParams()
  const auth = useAuth()
  const location = useLocation()
  const sessionMode = readSessionModeFromAuthState(auth)

  if (!planId && sessionMode === 'anonymous') {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={buildAuthRedirectState(location)}
      />
    )
  }

  return <KanbanBoard />
}

function AppBootstrapScreen() {
  const location = useLocation()
  const isInternalPath = isInternalAppPath(location.pathname)

  return (
    <AppThemeScope preference={isInternalPath ? null : 'system'}>
      <LoadingScreen
        variant="fullscreen"
        label="Carregando sua sessão"
      />
    </AppThemeScope>
  )
}

export function resolveRouteTransitionKey(pathname) {
  const normalized = normalizePathname(pathname)
  if (normalized === ROUTES.workspaceBoard || normalized.startsWith(`${ROUTES.workspaceBoard}/`)) {
    return ROUTES.workspaceBoard
  }
  return normalized
}

export default function App() {
  return (
    <AppChromeProvider>
      <AppShell />
    </AppChromeProvider>
  )
}

function AppShell() {
  const auth = useAuth()
  const { isLoadingScreenActive } = useAppChrome()
  const isReady = auth.isReady
  const pendingLogoutRedirect = auth.pendingLogoutRedirect ?? null
  const clearPendingLogoutRedirect = auth.clearPendingLogoutRedirect ?? (() => {})
  const pendingAccountRedirect = auth.pendingAccountRedirect ?? null
  const clearPendingAccountRedirect = auth.clearPendingAccountRedirect ?? (() => {})
  const { resolveInitialRoute } = usePreferences()
  const location = useLocation()
  const sessionMode = readSessionModeFromAuthState(auth)
  const normalizedPathname = normalizePathname(location.pathname)
  const pendingAccountRedirectTo = pendingAccountRedirect?.accountId
    ? resolveAccountHomeRoute(pendingAccountRedirect.accountId)
    : null
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
  const routeTransitionKey = resolveRouteTransitionKey(renderedLocation.pathname)
  const showAuthenticatedChrome = sessionMode !== 'anonymous'
    && isInternalAppPath(renderedLocation.pathname)
  const showAuthenticatedHeader = showAuthenticatedChrome && !isLoadingScreenActive

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

  useEffect(() => {
    if (!pendingAccountRedirectTo) {
      return
    }

    if (sessionMode === 'anonymous') {
      clearPendingAccountRedirect()
      return
    }

    const targetPathname = normalizePathname(new URL(pendingAccountRedirectTo, 'https://planthings.local').pathname)
    if (normalizedPathname === targetPathname) {
      clearPendingAccountRedirect()
    }
  }, [clearPendingAccountRedirect, normalizedPathname, pendingAccountRedirectTo, sessionMode])

  if (!isReady || sessionMode === 'boot') {
    return <AppBootstrapScreen />
  }

  if (pendingLogoutRedirect) {
    const targetPathname = normalizePathname(new URL(pendingLogoutRedirect.to, 'https://planthings.local').pathname)
    if (normalizedPathname !== targetPathname) {
      return <Navigate to={pendingLogoutRedirect.to} replace={pendingLogoutRedirect.replace} />
    }
  }

  if (pendingAccountRedirectTo && sessionMode !== 'anonymous') {
    const targetPathname = normalizePathname(new URL(pendingAccountRedirectTo, 'https://planthings.local').pathname)
    if (normalizedPathname !== targetPathname) {
      return <Navigate to={pendingAccountRedirectTo} replace={pendingAccountRedirect.replace !== false} />
    }
  }

  return (
    <>
      <LayoutGroup>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={routeTransitionKey}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
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
                path={ROUTES.planInvite}
                element={(
                  <RequireSession notice="Faça login para aceitar o convite.">
                    <AppThemeScope preference="system">
                      <InviteAccept />
                    </AppThemeScope>
                  </RequireSession>
                )}
              />
              <Route
                path={ROUTES.planJoin}
                element={(
                  <RequireSession notice="Faça login para entrar no plano.">
                    <AppThemeScope preference="system">
                      <InviteAccept variant="share-link" />
                    </AppThemeScope>
                  </RequireSession>
                )}
              />
              <Route path="/app" element={<RequireSession><PreferredAppEntryRedirect /></RequireSession>} />
              <Route path={ROUTES.workspace} element={<RequireSession><Workspace /></RequireSession>} />
              <Route path={`${ROUTES.workspaceBoard}/:planId?`} element={<KanbanBoardRoute />} />
              <Route
                path={ROUTES.calendar}
                element={(
                  <RequireSession>
                    <Navigate to={ROUTES.workspaceBoard} replace state={{ boardViewMode: 'calendar' }} />
                  </RequireSession>
                )}
              />
              <Route path={`${ROUTES.files}/*`} element={<RequireSession><Navigate to={ROUTES.workspace} replace /></RequireSession>} />
              <Route path={ROUTES.docs} element={<RequireSession><DocsHomePage /></RequireSession>} />
              <Route path={ROUTES.docsInvite} element={<RequireSession notice="Faça login para aceitar o convite."><DocInviteAccept /></RequireSession>} />
              <Route path={ROUTES.docsDoc} element={<RequireSession><DocsPage /></RequireSession>} />
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
          </motion.div>
        </AnimatePresence>

        {showAuthenticatedHeader ? (
          <AuthenticatedAppHeader pathname={renderedLocation.pathname} />
        ) : null}
      </LayoutGroup>

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
