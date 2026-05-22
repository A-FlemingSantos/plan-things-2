import { useNavigate } from 'react-router-dom'
import InviteNotifications from '../../../features/workspace/components/InviteNotifications/InviteNotifications.jsx'
import { ROUTES } from '../../config/routes.js'
import AuthenticatedAvatar from '../AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import PlanPageHeader from '../PlanPageHeader/PlanPageHeader.jsx'
import SidebarAccountMenu from '../SidebarAccountMenu/SidebarAccountMenu.jsx'
import styles from './WorkspaceHeader.module.css'

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M5.9 1.6h2.2l.4 1.2c.2.1.5.2.7.3l1.1-.5 1.5 1.5-.5 1.1c.1.2.2.5.3.7l1.2.4v2.2l-1.2.4c-.1.2-.2.5-.3.7l.5 1.1-1.5 1.5-1.1-.5c-.2.1-.5.2-.7.3l-.4 1.2H5.9l-.4-1.2a4 4 0 0 1-.7-.3l-1.1.5-1.5-1.5.5-1.1a4 4 0 0 1-.3-.7l-1.2-.4V5.9l1.2-.4c.1-.2.2-.5.3-.7l-.5-1.1 1.5-1.5 1.1.5c.2-.1.5-.2.7-.3z"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="7" r="1.75" stroke="currentColor" strokeWidth="1.15" />
    </svg>
  )
}

function WorkspaceTitleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="5.1" cy="4.9" r="1.75" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="10.9" cy="4.9" r="1.75" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="5.1" cy="10.7" r="1.75" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="10.9" cy="10.7" r="1.75" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export default function WorkspaceHeader({
  title = 'Workspace',
  icon = <WorkspaceTitleIcon />,
  sticky = false,
  compact = false,
  className = '',
}) {
  const navigate = useNavigate()

  const openSettingsSection = (section = null) => {
    const params = new URLSearchParams()
    if (section) params.set('section', section)
    navigate(`${ROUTES.settings}${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const headerClassName = [
    styles.workspaceHeader,
    compact ? styles.workspaceHeaderCompact : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <PlanPageHeader
      title={title}
      icon={icon}
      sticky={sticky}
      tone="solid"
      titleSize="medium"
      className={headerClassName}
      actions={(
        <div className={styles.workspaceHeaderActions}>
          <InviteNotifications
            wrapClassName={styles.workspaceHeaderNotificationWrap}
            triggerClassName={styles.workspaceHeaderIconButton}
            badgeClassName={styles.workspaceHeaderNotificationBadge}
            panelClassName={styles.workspaceHeaderNotificationsPanel}
          />
          <button
            type="button"
            className={styles.workspaceHeaderIconButton}
            aria-label="Abrir configurações da Workspace"
            onClick={() => openSettingsSection('workspace')}
          >
            <SettingsIcon />
          </button>
          <SidebarAccountMenu
            styles={styles}
            collapsed
            menuPlacement="below"
            renderTrigger={({ resolvedName, resolvedAvatarUrl, resolvedInitials, triggerProps }) => (
              <button
                {...triggerProps}
                className={styles.workspaceHeaderProfileButton}
                aria-label="Abrir menu da conta"
              >
                <AuthenticatedAvatar
                  avatarUrl={resolvedAvatarUrl}
                  className={styles.workspaceHeaderAvatar}
                  imageClassName={styles.workspaceHeaderAvatarImage}
                  alt=""
                  title={resolvedName}
                  fallback={(
                    <span className={styles.workspaceHeaderAvatarFallback}>
                      {resolvedInitials}
                    </span>
                  )}
                />
              </button>
            )}
          />
        </div>
      )}
    />
  )
}
