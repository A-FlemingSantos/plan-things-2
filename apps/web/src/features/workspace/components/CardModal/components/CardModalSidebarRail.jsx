import { SIDEBAR_PANEL_OPTIONS } from '../utils/sidebarPanelOptions.js'

export default function CardModalSidebarRail({
  styles,
  iconSize,
  iconStroke,
  isMutating,
  isActivitySidebarOpen,
  sidebarPanel,
  onSelectPanel,
}) {
  return SIDEBAR_PANEL_OPTIONS.map(({ id, label, Icon }) => {
    const isActive = isActivitySidebarOpen && sidebarPanel === id

    return (
      <button
        key={id}
        type="button"
        className={`${styles.cmSidebarToggleBtn} ${isActive ? styles.cmSidebarRailBtnActive : ''}`}
        onClick={() => onSelectPanel(id)}
        disabled={isMutating}
        title={label}
        aria-label={`Painel ${label}`}
        aria-pressed={isActive}
      >
        {id === 'github' ? (
          <Icon size={iconSize + 1} aria-hidden="true" />
        ) : (
          <Icon size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
        )}
      </button>
    )
  })
}
