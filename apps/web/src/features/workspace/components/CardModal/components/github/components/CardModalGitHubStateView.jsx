import { Loader } from 'lucide-react'
import { SiGithub } from 'react-icons/si'

/**
 * Shared full-panel state view for loading / disconnected / error /
 * permission-denied / empty states. Purely presentational: the caller
 * decides which state to render and supplies the copy + optional action.
 *
 * @param {{
 *   styles: Record<string, string>,
 *   icon?: React.ComponentType<{ size?: number, strokeWidth?: number }>,
 *   spinning?: boolean,
 *   title?: string,
 *   message?: string,
 *   actionLabel?: string,
 *   onAction?: () => void,
 *   actionDisabled?: boolean,
 *   primaryAction?: boolean,
 * }} props
 */
export default function CardModalGitHubStateView({
  styles,
  icon: Icon = SiGithub,
  spinning = false,
  title,
  message,
  actionLabel,
  onAction,
  actionDisabled = false,
  primaryAction = false,
}) {
  return (
    <div className={styles.stateView} role="status">
      <span className={`${styles.stateIcon} ${spinning ? styles.stateIconSpinning : ''}`} aria-hidden="true">
        {spinning ? <Loader size={22} strokeWidth={1.75} /> : <Icon size={20} strokeWidth={1.75} />}
      </span>
      {title ? <p className={styles.stateTitle}>{title}</p> : null}
      {message ? <p className={styles.stateMessage}>{message}</p> : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          className={`${styles.stateAction} ${primaryAction ? styles.statePrimaryAction : ''}`}
          onClick={onAction}
          disabled={actionDisabled}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
