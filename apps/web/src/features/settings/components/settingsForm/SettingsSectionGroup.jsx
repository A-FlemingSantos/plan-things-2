import styles from '../../pages/SettingsPage/SettingsPage.module.css'

export default function SettingsSectionGroup({ title, children }) {
  return (
    <div className={styles.sectionGroup}>
      <p className={styles.sectionGroupTitle}>{title}</p>
      <div className={styles.sectionGroupBody}>{children}</div>
    </div>
  )
}
