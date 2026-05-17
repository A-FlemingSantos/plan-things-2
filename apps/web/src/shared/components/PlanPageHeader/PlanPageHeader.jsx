import styles from './PlanPageHeader.module.css'

export default function PlanPageHeader({
  title,
  meta = null,
  icon = null,
  actions = null,
  sticky = false,
  tone = 'solid',
  titleSize = 'medium',
  hideOnMobile = false,
}) {
  const headerClassName = [
    styles.header,
    sticky ? styles.sticky : '',
    tone === 'frosted' ? styles.toneFrosted : styles.toneSolid,
    hideOnMobile ? styles.hideOnMobile : '',
  ].filter(Boolean).join(' ')

  const titleClassName = [
    styles.title,
    titleSize === 'large' ? styles.titleLarge : styles.titleMedium,
  ].join(' ')

  const titleRowClassName = [
    styles.titleRow,
    titleSize === 'large' ? styles.titleRowLarge : '',
  ].filter(Boolean).join(' ')

  return (
    <header className={headerClassName}>
      <div className={styles.left}>
        <div className={titleRowClassName}>
          {icon ? <span className={styles.icon}>{icon}</span> : null}
          <h1 className={titleClassName}>{title}</h1>
          {meta ? <span className={styles.meta}>{meta}</span> : null}
        </div>
      </div>

      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  )
}
