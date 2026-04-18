import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useAuth } from './features/auth/context/AuthContext.jsx'
import Auth from './features/auth/pages/Auth/Auth.jsx'
import PasswordRecovery from './features/auth/pages/PasswordRecovery/PasswordRecovery.jsx'
import CanvasPage from './features/canvas/pages/CanvasPage/CanvasPage.jsx'
import CalendarPage from './features/calendar/pages/CalendarPage/CalendarPage.jsx'
import FilesPage from './features/files/pages/FilesPage/FilesPage.jsx'
import { INFO_PAGES } from './features/info/data/infoPages.js'
import InfoPage from './features/info/pages/InfoPage.jsx'
import LandingPage from './features/landing/pages/LandingPage.jsx'
import SettingsPage from './features/settings/pages/SettingsPage/SettingsPage.jsx'
import KanbanBoard from './features/workspace/pages/KanbanBoard/KanbanBoard.jsx'
import Workspace from './features/workspace/pages/Workspace/Workspace.jsx'
import {
  buildCanvasPath,
  buildWorkspaceBoardPath,
  LEGACY_PLAN_ROUTE_ALIASES,
  ROUTE_ALIASES,
  ROUTES,
} from './shared/config/routes.js'

function LegacyPlanRedirect({ buildPath }) {
  const { planId } = useParams()

  return <Navigate to={buildPath(planId)} replace />
}

function AppBootstrapScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px',
        background: 'linear-gradient(180deg, #f7f4ec 0%, #f2f6fb 100%)',
        color: '#1f1f1f',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Carregando sua sessão...</p>
        <p style={{ margin: '8px 0 0', color: '#5f646d' }}>Preparando a aplicação com os dados mais recentes.</p>
      </div>
    </div>
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
