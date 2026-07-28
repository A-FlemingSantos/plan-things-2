export default function CardModalSidebarEmptyState({
  styles,
  icon: Icon,
  iconSize = 22,
  iconStroke = 1.75,
  title,
  message,
  action,
}) {
  return (
    <div className={styles.cmSidebarPanelEmptyState} role="status">
      <span className={styles.cmSidebarPanelEmptyStateIcon} aria-hidden="true">
        <Icon size={iconSize} strokeWidth={iconStroke} />
      </span>
      {title ? <p className={styles.cmSidebarPanelEmptyStateTitle}>{title}</p> : null}
      {message ? <p className={styles.cmSidebarPanelEmptyStateMessage}>{message}</p> : null}
      {action ? <div className={styles.cmSidebarPanelEmptyStateAction}>{action}</div> : null}
    </div>
  )
}
