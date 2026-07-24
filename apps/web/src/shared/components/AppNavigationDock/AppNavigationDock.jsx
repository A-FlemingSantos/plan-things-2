import { House, KanbanSquare, Settings, Sparkles } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import AppThemeScope from '../../../features/preferences/components/AppThemeScope/AppThemeScope.jsx'
import InviteNotifications from '../../../features/workspace/components/InviteNotifications/InviteNotifications.jsx'
import { normalizePathname, ROUTES } from '../../config/routes.js'
import AuthenticatedAvatar from '../AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import { Dock, DockItem, DockSeparator } from '../Dock/Dock.jsx'
import SidebarAccountMenu from '../SidebarAccountMenu/SidebarAccountMenu.jsx'
import styles from './AppNavigationDock.module.css'

const NAV_ITEMS = [
  { id: 'home', label: 'Início', to: ROUTES.workspace, Icon: House },
  { id: 'intelligence', label: 'Intelligence', to: ROUTES.workspaceChat, Icon: Sparkles },
  { id: 'boards', label: 'Quadros', to: ROUTES.workspaceBoard, Icon: KanbanSquare },
  { id: 'settings', label: 'Configurações', to: ROUTES.settings, Icon: Settings },
]

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

          <DockItem>
            <InviteNotifications
              wrapClassName={styles.notificationWrap}
              triggerClassName={styles.notificationButton}
              badgeClassName={styles.notificationBadge}
              panelClassName={styles.notificationsPanel}
            />
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
