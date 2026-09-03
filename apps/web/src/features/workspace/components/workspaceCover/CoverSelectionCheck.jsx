import { CheckIcon } from '../WorkspaceIcons/WorkspaceIcons.jsx'
import styles from './CoverSelectionCheck.module.css'

export default function CoverSelectionCheck({ size = 'md' }) {
  return (
    <span className={`${styles.badge} ${styles[size]}`} aria-hidden="true">
      <CheckIcon />
    </span>
  )
}
