import { useEffect, useState } from 'react'
import { BookOpen, House, KanbanSquare, Settings } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SiGithub } from 'react-icons/si'
import AppThemeScope from '../../../features/preferences/components/AppThemeScope/AppThemeScope.jsx'
import {
  rememberDocsRoute,
  resolveDocsDockPath,
} from '../../../features/docs/utils/lastDocsRoute.js'
import { normalizePathname, ROUTES } from '../../config/routes.js'
import { navigateToSettingsSection } from '../../utils/settingsNavigation.js'
import { Dock, DockItem, DockSeparator } from '../Dock/Dock.jsx'
import SidebarAccountMenu from '../SidebarAccountMenu/SidebarAccountMenu.jsx'
import styles from './AppNavigationDock.module.css'

const NAV_ITEMS = [
  { id: 'home', label: 'Início', to: ROUTES.workspace, Icon: House },
  { id: 'docs', label: 'Docs', to: ROUTES.docs, Icon: BookOpen },
  { id: 'boards', label: 'Quadros', to: ROUTES.workspaceBoard, Icon: KanbanSquare },
]

const GITHUB_ITEM = {
  id: 'github',
  label: 'GitHub',
  section: 'integrations',
}

const SETTINGS_ITEM = {
  id: 'settings',
  label: 'Configurações',
}

function isSettingsSectionActive(pathname, search, section) {
  if (normalizePathname(pathname) !== ROUTES.settings) return false

  return new URLSearchParams(search).get('section') === section
}

function isRouteActive(pathname, route) {
  const normalizedPathname = normalizePathname(pathname)
  const normalizedRoute = normalizePathname(route)

  if (normalizedRoute === ROUTES.workspace) {
    return normalizedPathname === normalizedRoute
  }

  return (
    normalizedPathname === normalizedRoute
    || normalizedPathname.startsWith(`${normalizedRoute}/`)
  )
}

function NavLinkItem({ label, to, Icon, pathname, activeTo = to }) {
  const active = isRouteActive(pathname, activeTo)

  return (
    <DockItem active={active}>
      <Link
        to={to}
        className={styles.link}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
      >
        <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
      </Link>
    </DockItem>
  )
}

function SettingsPanelItem({ label, section = null, active, onOpen }) {
  return (
    <DockItem active={active}>
      <button
        type="button"
        className={styles.link}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        onClick={() => onOpen(section)}
      >
        {section === 'integrations' ? (
          <SiGithub size={16} aria-hidden="true" />
        ) : (
          <Settings size={16} strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>
    </DockItem>
  )
}

export default function AppNavigationDock({ navigationPathname = null } = {}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [docsPath, setDocsPath] = useState(() => resolveDocsDockPath())
  const contentPathname = navigationPathname ?? location.pathname
  const githubActive = isSettingsSectionActive(location.pathname, location.search, 'integrations')
  const settingsActive = normalizePathname(location.pathname) === ROUTES.settings && !githubActive
  const [homeItem, docsItem, boardsItem] = NAV_ITEMS
  const openSettingsPanel = (section) => {
    navigateToSettingsSection(navigate, location, section)
  }

  useEffect(() => {
    rememberDocsRoute(location.pathname)
    setDocsPath(resolveDocsDockPath())
  }, [location.pathname])

  return (
    <AppThemeScope className={styles.themeScope}>
      <nav className={styles.positioner} data-app-navigation-dock aria-label="Navegação principal">
        <div className={styles.dockAnchor}>
          <Dock className={styles.navigationDock} size={34}>
          <NavLinkItem {...homeItem} pathname={contentPathname} />

          <NavLinkItem
            {...docsItem}
            to={docsPath}
            activeTo={ROUTES.docs}
            pathname={contentPathname}
          />

          <NavLinkItem {...boardsItem} pathname={contentPathname} />

          <DockSeparator />

          <SettingsPanelItem
            {...GITHUB_ITEM}
            active={githubActive}
            onOpen={openSettingsPanel}
          />

          <SettingsPanelItem
            {...SETTINGS_ITEM}
            active={settingsActive}
            onOpen={openSettingsPanel}
          />

          <DockItem expanded={accountMenuOpen}>
            <SidebarAccountMenu
              styles={styles}
              collapsed
              menuPresentation="dock"
              onOpenChange={setAccountMenuOpen}
            />
          </DockItem>
        </Dock>
        </div>
      </nav>
    </AppThemeScope>
  )
}
