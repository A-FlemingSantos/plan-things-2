import { Navigate, Route, Routes } from 'react-router-dom'
import Auth from './features/auth/pages/Auth/Auth.jsx'
import CanvasPage from './features/canvas/pages/CanvasPage/CanvasPage.jsx'
import FilesPage from './features/files/pages/FilesPage/FilesPage.jsx'
import { INFO_PAGES } from './features/info/data/infoPages.js'
import InfoPage from './features/info/pages/InfoPage.jsx'
import LandingPage from './features/landing/pages/LandingPage.jsx'
import KanbanBoard from './features/workspace/pages/KanbanBoard/KanbanBoard.jsx'
import Workspace from './features/workspace/pages/Workspace/Workspace.jsx'
import { ROUTE_ALIASES, ROUTES } from './shared/config/routes.js'

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<LandingPage />} />
      <Route path={ROUTES.login} element={<Auth initialMode="login" />} />
      <Route path={ROUTES.register} element={<Auth initialMode="register" />} />
      <Route path={ROUTES.workspace} element={<Workspace />} />
      <Route path={ROUTES.workspaceBoard} element={<KanbanBoard />} />
      <Route path={`${ROUTES.workspaceBoard}/:planId`} element={<KanbanBoard />} />
      <Route path={ROUTES.canvas} element={<CanvasPage />} />
      <Route path={`${ROUTES.canvas}/:planId`} element={<CanvasPage />} />
      <Route path={`${ROUTES.files}/*`} element={<FilesPage />} />

      {Object.entries(INFO_PAGES).map(([path, page]) => (
        <Route key={path} path={path} element={<InfoPage {...page} />} />
      ))}

      {ROUTE_ALIASES.map(({ from, to }) => (
        <Route key={from} path={from} element={<Navigate to={to} replace />} />
      ))}

      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  )
}
