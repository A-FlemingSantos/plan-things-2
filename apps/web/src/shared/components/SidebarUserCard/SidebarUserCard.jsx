export default function SidebarUserCard({
  styles,
  collapsed,
  name = 'Arthur Santos',
  plan = 'Professional',
  initials = 'AS',
  active = false,
  onClick,
  children = null,
  ...buttonProps
}) {
  const buttonClassName = [
    styles.userBtn,
    active ? styles.userBtnActive : '',
    collapsed ? styles.userBtnCollapsed : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.userSection}>
      {children}
      <button
        type="button"
        className={buttonClassName}
        onClick={onClick}
        {...buttonProps}
      >
        <span className={styles.userAvatar}>{initials}</span>
        <span className={styles.userDetails}>
          <span className={styles.userName}>{name}</span>
          <span className={styles.userPlan}>{plan}</span>
        </span>
      </button>
    </div>
  )
}
