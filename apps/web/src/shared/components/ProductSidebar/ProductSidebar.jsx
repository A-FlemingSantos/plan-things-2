import {
  House,
  Inbox,
  LayoutTemplate,
  LibraryBig,
  BookOpenText,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  X,
} from 'lucide-react'
import {
  WORKSPACE_PRIMARY_NAV_ITEMS,
  WORKSPACE_SETTINGS_NAV_ITEM,
} from '../../config/workspaceNavigation.js'
import { WorkspaceIconGlyph, normalizeWorkspaceIconKey } from '../WorkspaceIconBadge/WorkspaceIconBadge.jsx'
import styles from './ProductSidebar.module.css'

const NAV_ICONS = {
  home: House,
  teams: Users,
  templates: LayoutTemplate,
  inbox: Inbox,
  library: LibraryBig,
  knowledge: BookOpenText,
  settings: Settings,
}

function CloseIcon() {
  return <X size={16} strokeWidth={1.75} aria-hidden="true" />
}

export default function ProductSidebar({
  mode = 'desktop',
  className = '',
  collapsed,
  onToggleCollapse,
  activeNav,
  workspaceName = 'Workspace',
  workspaceIconKey = null,
  showCollapseButton = true,
  headerControl = null,
  ariaLabel = 'Navegação principal',
}) {
  const resolvedWorkspaceIconKey = normalizeWorkspaceIconKey(workspaceIconKey)
  const CollapseToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose
  const collapseToggleLabel = collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'

  const renderNavItem = (item) => {
    const Icon = NAV_ICONS[item.id]
    const isActive = activeNav === item.id

    return (
      <button
        type="button"
        key={item.id}
        className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
        aria-current={isActive ? 'page' : undefined}
        aria-label={item.label}
        title={collapsed ? item.label : undefined}
        data-sidebar-nav-item
      >
        <span className={styles.navIcon} data-sidebar-nav-icon>
          {Icon ? <Icon size={16} strokeWidth={1.75} aria-hidden="true" /> : null}
        </span>
        <span className={styles.navLabel} data-sidebar-nav-label>{item.label}</span>
      </button>
    )
  }

  return (
    <aside
      className={[
        mode === 'desktop' ? styles.sidebar : '',
        mode === 'desktop' && collapsed ? styles.sidebarCollapsed : '',
        mode === 'drawer' ? styles.drawerSidebar : '',
        className,
      ].filter(Boolean).join(' ')}
      data-product-sidebar
      data-sidebar-mode={mode}
      data-collapsed={collapsed ? 'true' : 'false'}
      aria-label={ariaLabel}
    >
      <div className={styles.sidebarTop} data-sidebar-top>
        <div className={styles.workspaceRow} data-sidebar-workspace-row>
          <div className={styles.workspaceBrand} data-sidebar-workspace-brand>
            <span className={styles.workspaceLogo} data-sidebar-workspace-avatar title={workspaceName}>
              <WorkspaceIconGlyph iconKey={resolvedWorkspaceIconKey} />
            </span>
            <span className={styles.workspaceName} data-sidebar-workspace-name>{workspaceName}</span>
          </div>

          {headerControl || (mode === 'drawer' && showCollapseButton ? (
            <button
              type="button"
              className={styles.collapseBtn}
              onClick={onToggleCollapse}
              aria-label="Fechar menu de navegação"
              data-sidebar-drawer-close-button
            >
              <span className={styles.collapseBtnIcon} data-sidebar-collapse-icon>
                <CloseIcon />
              </span>
            </button>
          ) : null)}
        </div>

        <nav className={styles.nav} aria-label="Navegação do workspace" data-sidebar-nav>
          {WORKSPACE_PRIMARY_NAV_ITEMS.map(renderNavItem)}
        </nav>
      </div>

      <div className={styles.sidebarBottom} data-sidebar-bottom>
        {mode === 'desktop' && showCollapseButton ? (
          <button
            type="button"
            className={styles.navItem}
            onClick={onToggleCollapse}
            aria-label={collapseToggleLabel}
            title={collapsed ? collapseToggleLabel : undefined}
            data-sidebar-collapse-button
          >
            <span className={styles.navIcon} data-sidebar-collapse-icon>
              <CollapseToggleIcon size={16} strokeWidth={1.75} aria-hidden="true" />
            </span>
          </button>
        ) : null}

        <div className={styles.divider} aria-hidden="true" />
        <nav className={styles.nav} aria-label="Configurações">
          {renderNavItem(WORKSPACE_SETTINGS_NAV_ITEM)}
        </nav>
      </div>
    </aside>
  )
}
