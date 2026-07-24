import { BookOpen, House, KanbanSquare, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import AppThemeScope from '../../../features/preferences/components/AppThemeScope/AppThemeScope.jsx'
import { normalizePathname, ROUTES } from '../../config/routes.js'
import AuthenticatedAvatar from '../AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import { Dock, DockItem, DockSeparator } from '../Dock/Dock.jsx'
import SidebarAccountMenu from '../SidebarAccountMenu/SidebarAccountMenu.jsx'
import styles from './AppNavigationDock.module.css'

const NAV_ITEMS = [
  { id: 'home', label: 'Início', to: ROUTES.workspace, Icon: House },
  { id: 'intelligence', label: 'Intelligence', to: ROUTES.workspaceChat, Icon: BookOpen },
  { id: 'boards', label: 'Quadros', to: ROUTES.workspaceBoard, Icon: KanbanSquare },
]

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

function GitHubIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 1.4a6.6 6.6 0 0 0-2.1 12.85c.33.06.45-.14.45-.32v-1.2c-1.82.4-2.2-.77-2.2-.77-.3-.74-.73-.94-.73-.94-.6-.41.05-.4.05-.4.66.05 1 .67 1 .67.6 1 .15.52 1.5.4.05-.43.23-.73.42-.89-1.45-.16-2.98-.72-2.98-3.22 0-.71.25-1.3.67-1.75-.07-.16-.29-.82.06-1.7 0 0 .55-.18 1.8.67a6.26 6.26 0 0 1 3.28 0c1.24-.85 1.79-.67 1.79-.67.35.88.13 1.54.06 1.7.42.45.67 1.04.67 1.75 0 2.5-1.53 3.06-2.99 3.22.24.2.45.61.45 1.24v1.84c0 .18.12.38.46.31A6.6 6.6 0 0 0 8 1.4Z"
        fill="currentColor"
      />
    </svg>
  )
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

export default function AppNavigationDock() {
  const location = useLocation()
  const githubActive = isSettingsSectionActive(location.pathname, location.search, 'integrations')
  const settingsActive = normalizePathname(location.pathname) === ROUTES.settings && !githubActive

  return (
    <AppThemeScope className={styles.themeScope}>
      <nav className={styles.positioner} data-app-navigation-dock aria-label="Navegação principal">
        <Dock className={styles.navigationDock} size={34}>
          {NAV_ITEMS.map(({ id, label, to, Icon }) => {
            const active = isRouteActive(location.pathname, to)

            return (
              <DockItem key={id} active={active}>
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
          })}

          <DockSeparator />

          <DockItem active={githubActive}>
            <Link
              to={GITHUB_ITEM.to}
              className={styles.link}
              aria-label={GITHUB_ITEM.label}
              aria-current={githubActive ? 'page' : undefined}
            >
              <GitHubIcon size={17} />
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

          <DockItem>
            <SidebarAccountMenu
              styles={styles}
              collapsed
              menuPlacement="above"
              renderTrigger={({ resolvedName, resolvedAvatarUrl, resolvedInitials, triggerProps }) => (
                <button
                  {...triggerProps}
                  type="button"
                  className={styles.accountButton}
                  aria-label="Abrir menu da conta"
                >
                  <AuthenticatedAvatar
                    avatarUrl={resolvedAvatarUrl}
                    className={styles.avatar}
                    imageClassName={styles.avatarImage}
                    alt=""
                    title={resolvedName}
                    fallback={(
                      <span className={styles.avatarFallback}>
                        {resolvedInitials}
                      </span>
                    )}
                  />
                </button>
              )}
            />
          </DockItem>
        </Dock>
      </nav>
    </AppThemeScope>
  )
}
