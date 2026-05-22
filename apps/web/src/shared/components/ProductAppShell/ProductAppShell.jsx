export default function ProductAppShell({
  styles,
  contentClassName,
  contentTag = 'div',
  children,
}) {
  const ContentTag = contentTag

  return (
    <div className={styles.shell} data-app-shell>
      <ContentTag className={contentClassName} style={{ gridColumn: '1 / -1' }} data-app-shell-content>
        {children}
      </ContentTag>
    </div>
  )
}
