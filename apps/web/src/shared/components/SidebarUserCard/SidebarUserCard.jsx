import AuthenticatedAvatar from '../AuthenticatedAvatar/AuthenticatedAvatar.jsx'

export default function SidebarUserCard({
  styles,
  collapsed,
  name = 'Arthur Santos',
  plan = 'Professional',
  initials = 'AS',
  avatarUrl = null,
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
    <div className={styles.userSection} data-sidebar-user-section>
      {children}
      <button
        type="button"
        className={buttonClassName}
        onClick={onClick}
        data-sidebar-user-button
        {...buttonProps}
      >
        <AuthenticatedAvatar
          className={styles.userAvatar}
          imageClassName="authenticatedAvatarImage"
          avatarUrl={avatarUrl}
          fallback={initials}
          title={name}
          data-sidebar-user-avatar
        />
        <span className={styles.userDetails} data-sidebar-user-details>
          <span className={styles.userName} data-sidebar-user-name>{name}</span>
          <span className={styles.userPlan} data-sidebar-user-plan>{plan}</span>
        </span>
      </button>
    </div>
  )
}
