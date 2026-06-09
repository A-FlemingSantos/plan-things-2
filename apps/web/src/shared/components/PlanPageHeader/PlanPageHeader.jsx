import styles from './PlanPageHeader.module.css'

export default function PlanPageHeader({
  title,
  titleContent = null,
  centerContent = null,
  meta = null,
  icon = null,
  titleAccessory = null,
  actions = null,
  sticky = false,
  tone = 'solid',
  titleSize = 'medium',
  hideOnMobile = false,
  className = '',
}) {
  const headerClassName = [
    styles.header,
    centerContent ? styles.headerWithCenter : '',
    sticky ? styles.sticky : '',
    tone === 'frosted' ? styles.toneFrosted : styles.toneSolid,
    hideOnMobile ? styles.hideOnMobile : '',
    className,
  ].filter(Boolean).join(' ')

  const titleClassName = [
    styles.title,
    titleSize === 'large'
      ? styles.titleLarge
      : titleSize === 'small'
        ? styles.titleSmall
        : styles.titleMedium,
    titleContent ? styles.titleCustom : '',
  ].join(' ')

  const titleRowClassName = [
    styles.titleRow,
    titleSize === 'large' ? styles.titleRowLarge : '',
  ].filter(Boolean).join(' ')

  return (
    <header className={headerClassName}>
      <div className={styles.left}>
        <div className={titleRowClassName}>
          {titleContent ? (
            <h1 className={titleClassName}>{titleContent}</h1>
          ) : (
            <>
              {icon ? <span className={styles.icon}>{icon}</span> : null}
              <h1 className={titleClassName}>{title}</h1>
            </>
          )}
          {titleAccessory}
          {meta ? <span className={styles.meta}>{meta}</span> : null}
        </div>
      </div>

      {centerContent ? <div className={styles.center}>{centerContent}</div> : null}

      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  )
}
