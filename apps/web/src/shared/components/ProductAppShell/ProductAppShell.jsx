import shellStyles from './ProductAppShell.module.css'

export default function ProductAppShell({
  contentClassName,
  contentTag = 'div',
  children,
}) {
  const ContentTag = contentTag

  return (
    <div className={shellStyles.shell} data-app-shell>
      <ContentTag
        className={[shellStyles.content, contentClassName].filter(Boolean).join(' ')}
        data-app-shell-content
      >
        {children}
      </ContentTag>
    </div>
  )
}
