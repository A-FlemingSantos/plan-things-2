import styles from './Workspace.module.css'

export default function WorkspaceSection({
  title,
  subtitle,
  actions = null,
  children,
  className = '',
  contentClassName = '',
  id,
}) {
  return (
    <section
      id={id}
      className={[styles.sectionCard, className].filter(Boolean).join(' ')}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <div className={styles.sectionCardHeader}>
        <div className={styles.sectionCardHeading}>
          <h2 id={id ? `${id}-title` : undefined} className={styles.sectionCardTitle}>
            {title}
          </h2>
          {subtitle ? (
            <p className={styles.sectionCardSubtitle}>{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className={styles.sectionCardActions}>{actions}</div>
        ) : null}
      </div>
      <div className={[styles.sectionCardBody, contentClassName].filter(Boolean).join(' ')}>
        {children}
      </div>
    </section>
  )
}
