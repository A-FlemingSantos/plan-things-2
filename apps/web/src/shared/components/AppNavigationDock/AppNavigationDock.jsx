import { useState } from 'react'
import { BookOpen, House, KanbanSquare, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { SiGithub } from 'react-icons/si'
import AppThemeScope from '../../../features/preferences/components/AppThemeScope/AppThemeScope.jsx'
import { normalizePathname, ROUTES } from '../../config/routes.js'
import { Dock, DockItem, DockSeparator } from '../Dock/Dock.jsx'
import SidebarAccountMenu from '../SidebarAccountMenu/SidebarAccountMenu.jsx'
import styles from './AppNavigationDock.module.css'

const NAV_ITEMS = [
  { id: 'home', label: 'Início', to: ROUTES.workspace, Icon: House },
  { id: 'boards', label: 'Quadros', to: ROUTES.workspaceBoard, Icon: KanbanSquare },
]

const PLACEHOLDER_ITEM = {
  id: 'placeholder',
  label: 'Em breve',
  Icon: BookOpen,
}

const GITHUB_ITEM = {
  id: 'github',
  label: 'GitHub',
  to: `${ROUTES.settings}?section=integrations`,
}

const SETTINGS_ITEM = {
  id: 'settings',
  label: 'Configurações',
  to: ROUTES.settings,
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

function NavLinkItem({ label, to, Icon, pathname }) {
  const active = isRouteActive(pathname, to)

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

export default function AppNavigationDock({ navigationPathname = null } = {}) {
  const location = useLocation()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const contentPathname = navigationPathname ?? location.pathname
  const githubActive = isSettingsSectionActive(location.pathname, location.search, 'integrations')
  const settingsActive = normalizePathname(location.pathname) === ROUTES.settings && !githubActive
  const PlaceholderIcon = PLACEHOLDER_ITEM.Icon
  const [homeItem, boardsItem] = NAV_ITEMS

  return (
    <AppThemeScope className={styles.themeScope}>
      <nav className={styles.positioner} data-app-navigation-dock aria-label="Navegação principal">
        <div className={styles.dockAnchor}>
          <Dock className={styles.navigationDock} size={34}>
          <NavLinkItem {...homeItem} pathname={contentPathname} />

          <DockItem>
            <button
              type="button"
              className={styles.link}
              aria-label={PLACEHOLDER_ITEM.label}
              disabled
            >
              <PlaceholderIcon size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </DockItem>

          <NavLinkItem {...boardsItem} pathname={contentPathname} />

          <DockSeparator />

          <DockItem active={githubActive}>
            <Link
              to={GITHUB_ITEM.to}
              className={styles.link}
              aria-label={GITHUB_ITEM.label}
              aria-current={githubActive ? 'page' : undefined}
            >
              <SiGithub size={16} aria-hidden="true" />
            </Link>
          </DockItem>

          <DockItem active={settingsActive}>
            <Link
              to={SETTINGS_ITEM.to}
              className={styles.link}
              aria-label={SETTINGS_ITEM.label}
              aria-current={settingsActive ? 'page' : undefined}
            >
              <Settings size={16} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </DockItem>

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
