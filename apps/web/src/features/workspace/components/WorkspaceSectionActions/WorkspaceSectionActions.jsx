import { WORKSPACE_SECTION_ACTIONS } from '../WorkspaceIcons/WorkspaceIcons.jsx'
import styles from '../../pages/Workspace/Workspace.module.css'

export default function WorkspaceSectionActions() {
  return (
    <div className={styles.workspaceSectionActions}>
      {WORKSPACE_SECTION_ACTIONS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={styles.workspaceSectionAction}
          aria-label={label}
        >
          <span className={styles.workspaceSectionActionIcon} aria-hidden="true">
            <Icon />
          </span>
          <span className={styles.workspaceSectionActionLabel}>{label}</span>
        </button>
      ))}
    </div>
  )
}
