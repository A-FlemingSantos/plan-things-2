import Auth from './features/auth/pages/Auth/Auth.jsx'
import { INFO_PAGES } from './features/info/data/infoPages.js'
import InfoPage from './features/info/pages/InfoPage.jsx'
import LandingPage from './features/landing/pages/LandingPage.jsx'
import Workspace from './features/workspace/pages/Workspace/Workspace.jsx'

export default function App() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'

  if (pathname === '/login' || pathname === '/cadastro') {
    return <Auth initialMode={pathname === '/cadastro' ? 'register' : 'login'} />
  }

  if (pathname === '/workspace' || pathname === '/app') {
    return <Workspace />
  }

  if (INFO_PAGES[pathname]) {
    return <InfoPage {...INFO_PAGES[pathname]} />
  }

  return <LandingPage />
}
