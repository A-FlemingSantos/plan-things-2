import { Link } from 'react-router-dom'
import { ROUTES } from '../../config/routes.js'

export default function ProductSidebar({
  styles,
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
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.sidebarTop}>
        <div className={styles.logoRow}>
          <Link to={ROUTES.workspace} className={styles.sidebarLogo}>
            <span className={styles.sidebarLogoMark}><LogoIcon /></span>
            <span className={styles.sidebarLogoText}>Plan Things</span>
          </Link>
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            <span className={`${styles.collapseBtnIcon} ${collapsed ? styles.collapseBtnFlipped : ''}`}>
              <CollapseIcon />
            </span>
          </button>
        </div>

        <button
          type="button"
          className={`${styles.workspacePicker} ${collapsed ? styles.workspacePickerHidden : ''}`}
          aria-label={`Workspace atual: ${workspaceName}`}
        >
          <span className={styles.wsAvatar}>{workspaceInitial}</span>
          <span className={styles.wsName}>{workspaceName}</span>
          <span className={styles.wsChevron}><ChevronIcon /></span>
        </button>

        <nav className={styles.nav} aria-label="Navegação principal do workspace">
          {navItems.map(({ id, label, Icon, hint }) => (
            <button
              type="button"
              key={id}
              className={`${styles.navItem} ${activeNav === id ? styles.navItemActive : ''}`}
              onClick={() => onNavItemClick(id)}
              aria-current={activeNav === id ? 'page' : undefined}
              aria-label={label}
              title={collapsed ? label : undefined}
            >
              <span className={styles.navIcon}><Icon /></span>
              <span className={styles.navLabel}>{label}</span>
              {hint && !collapsed && HintIcon ? (
                <span className={styles.navHintIcon}><HintIcon /></span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      {secondaryContent ? (
        <div style={secondaryWrapperStyle}>
          {secondaryContent}
        </div>
      ) : null}

      {bottomContent ? (
        <div style={bottomWrapperStyle}>
          {bottomContent}
        </div>
      ) : null}
    </aside>
  )
}
