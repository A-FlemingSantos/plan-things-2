import { useEffect, useState } from 'react'
import { AlignStartHorizontal, BookOpen, House, Settings } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SiGithub } from 'react-icons/si'

import { useAuth } from '../../../features/auth/context/AuthContext.jsx'
import AppThemeScope from '../../../features/preferences/components/AppThemeScope/AppThemeScope.jsx'
import {
  rememberDocsRoute,
  resolveDocsDockPath,
} from '../../../features/docs/utils/lastDocsRoute.js'
import { usePlans } from '../../../features/workspace/context/PlansContext.jsx'
import { useAppChrome } from '../../context/AppChromeContext.jsx'
import { normalizePathname, ROUTES } from '../../config/routes.js'
import { navigateToSettingsSection } from '../../utils/settingsNavigation.js'
import AuthenticatedAvatar from '../AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import SidebarAccountMenu from '../SidebarAccountMenu/SidebarAccountMenu.jsx'
import { resolveAuthenticatedPageBreadcrumb } from './resolveAuthenticatedPageBreadcrumb.js'
import styles from './AuthenticatedAppHeader.module.css'

const NAV_ITEMS = [
  { id: 'workspace', label: 'Workspace', to: ROUTES.workspace, Icon: House },
  { id: 'docs', label: 'Docs', to: ROUTES.docs, Icon: BookOpen },
  { id: 'plan', label: 'Plano', to: ROUTES.workspaceBoard, Icon: AlignStartHorizontal },
]

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

function BreadcrumbItem({ item }) {
  if (item.current || !item.to) {
    return (
      <span className={styles.breadcrumbCurrent} aria-current="page">
        {item.label}
      </span>
    )
  }

  return (
    <Link className={styles.breadcrumbLink} to={item.to}>
      {item.label}
    </Link>
  )
}

function PrimaryNavLink({ label, to, Icon, pathname, activeTo = to }) {
  const active = isRouteActive(pathname, activeTo)

  return (
    <Link
      to={to}
      className={[styles.iconButton, active ? styles.iconButtonActive : ''].filter(Boolean).join(' ')}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
    </Link>
  )
}

function HeaderIconButton({ label, active, children, onClick }) {
  return (
    <button
      type="button"
      className={[styles.iconButton, active ? styles.iconButtonActive : ''].filter(Boolean).join(' ')}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default function AuthenticatedAppHeader({ pathname }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { workspace } = useAuth()
  const { plans } = usePlans()
  const { pageBreadcrumbLabel } = useAppChrome()
  const [docsPath, setDocsPath] = useState(() => resolveDocsDockPath())
  const githubActive = isSettingsSectionActive(location.pathname, location.search, 'integrations')
  const settingsActive = normalizePathname(location.pathname) === ROUTES.settings && !githubActive
  const [workspaceItem, docsItem, planItem] = NAV_ITEMS
  const { items } = resolveAuthenticatedPageBreadcrumb({
    pathname,
    workspaceName: workspace?.name,
    plans,
    documentTitle: pageBreadcrumbLabel,
  })
  const openSettingsPanel = (section) => {
    navigateToSettingsSection(navigate, location, section)
  }

  useEffect(() => {
    rememberDocsRoute(location.pathname)
    setDocsPath(resolveDocsDockPath())
  }, [location.pathname])

  return (
    <AppThemeScope className={styles.themeScope}>
      <header className={styles.header} data-authenticated-app-header>
        <div className={styles.leading}>
          <nav className={styles.primaryNav} aria-label="Navegação principal">
            <PrimaryNavLink {...workspaceItem} pathname={pathname} />
            <PrimaryNavLink
              {...docsItem}
              to={docsPath}
              activeTo={ROUTES.docs}
              pathname={pathname}
            />
            <PrimaryNavLink {...planItem} pathname={pathname} />
          </nav>

          <span className={styles.pipe} aria-hidden="true">|</span>

          <nav className={styles.breadcrumb} aria-label="Localização atual">
            {items.map((item, index) => (
              <span key={`${item.label}-${item.to ?? 'current'}`} className={styles.breadcrumbSegment}>
                {index > 0 ? (
                  <span className={styles.separator} aria-hidden="true">/</span>
                ) : null}
                <BreadcrumbItem item={item} />
              </span>
            ))}
          </nav>
        </div>

        <div className={styles.trailing}>
          <HeaderIconButton
            label="GitHub"
            active={githubActive}
            onClick={() => openSettingsPanel('integrations')}
          >
            <SiGithub size={16} aria-hidden="true" />
          </HeaderIconButton>

          <HeaderIconButton
            label="Configurações"
            active={settingsActive}
            onClick={() => openSettingsPanel()}
          >
            <Settings size={16} strokeWidth={1.75} aria-hidden="true" />
          </HeaderIconButton>

          <SidebarAccountMenu
            styles={styles}
            collapsed
            menuPlacement="below"
            renderTrigger={({ triggerProps, resolvedName, resolvedAvatarUrl, resolvedInitials }) => (
              <button
                {...triggerProps}
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
        </div>
      </header>
    </AppThemeScope>
  )
}
