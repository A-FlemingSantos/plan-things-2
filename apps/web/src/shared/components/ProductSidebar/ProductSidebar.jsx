import { Link } from 'react-router-dom'
import { ROUTES } from '../../config/routes.js'
import AuthenticatedAvatar from '../AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import './ProductSidebar.css'

export default function ProductSidebar({
  styles,
  mode = 'desktop',
  className = '',
  collapsed,
  onToggleCollapse,
  activeNav,
  onNavItemClick,
  navItems,
  LogoIcon,
  CollapseIcon,
  ChevronIcon,
  HintIcon,
  secondaryContent = null,
  bottomContent = null,
  workspaceName = 'Workspace do Arthur',
  workspaceInitial = 'A',
  workspaceAvatarUrl = null,
  showCollapseButton = true,
  headerControl = null,
  ariaLabel,
}) {
  const secondaryWrapperStyle = {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  }

  const bottomWrapperStyle = {
    marginTop: 'auto',
  }

  return (
    <aside
      className={[
        mode === 'desktop' ? styles.sidebar : '',
        mode === 'desktop' && collapsed ? styles.sidebarCollapsed : '',
        className,
      ].filter(Boolean).join(' ')}
      data-product-sidebar
      data-sidebar-mode={mode}
      data-collapsed={collapsed ? 'true' : 'false'}
      aria-label={ariaLabel}
    >
      <div className={styles.sidebarTop} data-sidebar-top>
        <div className={styles.logoRow} data-sidebar-logo-row>
          <Link
            to={ROUTES.workspace}
            className={styles.sidebarLogo}
            tabIndex={collapsed ? -1 : undefined}
            aria-hidden={collapsed ? true : undefined}
            data-sidebar-logo
          >
            <span className={styles.sidebarLogoMark} data-sidebar-logo-mark><LogoIcon /></span>
            <span className={styles.sidebarLogoText} data-sidebar-logo-text>Plan Things</span>
          </Link>
          {headerControl || (showCollapseButton ? (
            <button
              type="button"
              className={styles.collapseBtn}
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
              data-sidebar-collapse-button
            >
              <span
                className={`${styles.collapseBtnIcon} ${collapsed ? styles.collapseBtnFlipped : ''}`}
                data-sidebar-collapse-icon
              >
                <CollapseIcon />
              </span>
            </button>
          ) : null)}
        </div>

        <button
          type="button"
          className={`${styles.workspacePicker} ${collapsed ? styles.workspacePickerHidden : ''}`}
          aria-label={`Workspace atual: ${workspaceName}`}
          tabIndex={collapsed ? -1 : undefined}
          aria-hidden={collapsed ? true : undefined}
          data-sidebar-workspace-picker
        >
          <AuthenticatedAvatar
            className={styles.wsAvatar}
            imageClassName="authenticatedAvatarImage"
            avatarUrl={workspaceAvatarUrl}
            fallback={workspaceInitial}
            title={workspaceName}
            data-sidebar-workspace-avatar
          />
          <span className={styles.wsName} data-sidebar-workspace-name>{workspaceName}</span>
          <span className={styles.wsChevron} data-sidebar-workspace-chevron><ChevronIcon /></span>
        </button>

        <nav className={styles.nav} aria-label="Navegação principal do workspace" data-sidebar-nav>
          {navItems.map(({ id, label, Icon, hint }) => (
            <button
              type="button"
              key={id}
              className={`${styles.navItem} ${activeNav === id ? styles.navItemActive : ''}`}
              onClick={() => onNavItemClick(id)}
              aria-current={activeNav === id ? 'page' : undefined}
              aria-label={label}
              title={collapsed ? label : undefined}
              data-sidebar-nav-item
            >
              <span className={styles.navIcon} data-sidebar-nav-icon><Icon /></span>
              <span className={styles.navLabel} data-sidebar-nav-label>{label}</span>
              {hint && !collapsed && HintIcon ? (
                <span className={styles.navHintIcon} data-sidebar-nav-hint-icon><HintIcon /></span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      {secondaryContent ? (
        <div style={secondaryWrapperStyle} data-sidebar-secondary>
          {secondaryContent}
        </div>
      ) : null}

      {bottomContent ? (
        <div style={bottomWrapperStyle} data-sidebar-bottom>
          {bottomContent}
        </div>
      ) : null}
    </aside>
  )
}
