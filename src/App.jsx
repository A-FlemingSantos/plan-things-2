import Auth from './features/auth/pages/Auth/Auth.jsx'
import CanvasPage from './features/canvas/pages/CanvasPage/CanvasPage.jsx'
import { INFO_PAGES } from './features/info/data/infoPages.js'
import InfoPage from './features/info/pages/InfoPage.jsx'
import LandingPage from './features/landing/pages/LandingPage.jsx'
import KanbanBoard from './features/workspace/pages/KanbanBoard/KanbanBoard.jsx'
import Workspace from './features/workspace/pages/Workspace/Workspace.jsx'

export default function App() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
  const isWorkspacePath = pathname === '/workspace' || pathname === '/app'
  const isBoardPath =
    pathname === '/workspace/board' ||
    pathname === '/app/board' ||
    pathname === '/kanban' ||
    pathname.startsWith('/kanban/')
  const isCanvasPath =
    pathname === '/canvas' ||
    pathname.startsWith('/canvas/') ||
    pathname === '/workspace/canvas' ||
    pathname === '/app/canvas'

  if (pathname === '/login' || pathname === '/cadastro') {
    return <Auth initialMode={pathname === '/cadastro' ? 'register' : 'login'} />
  }

  if (isWorkspacePath) {
    return <Workspace />
  }

  if (isBoardPath) {
    return <KanbanBoard />
  }

  if (isCanvasPath) {
    return <CanvasPage />
  }

  if (INFO_PAGES[pathname]) {
    return <InfoPage {...INFO_PAGES[pathname]} />
  }

  return <LandingPage />
}
