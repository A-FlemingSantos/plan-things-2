import { useState } from 'react'
import ProductSidebar from '../ProductSidebar/ProductSidebar.jsx'

export default function ProductAppShell({
  styles,
  navItems,
  activeNav,
  onNavItemClick,
  LogoIcon,
  CollapseIcon,
  ChevronIcon,
  HintIcon,
  secondaryContent = null,
  bottomContent = null,
  workspaceName,
  workspaceInitial,
  contentClassName,
  contentTag = 'div',
  children,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const ContentTag = contentTag
  const resolvedSecondaryContent =
    typeof secondaryContent === 'function' ? secondaryContent({ collapsed }) : secondaryContent
  const resolvedBottomContent =
    typeof bottomContent === 'function' ? bottomContent({ collapsed }) : bottomContent

  return (
    <div className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ''}`}>
      <ProductSidebar
        styles={styles}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        activeNav={activeNav}
        onNavItemClick={onNavItemClick}
        navItems={navItems}
        LogoIcon={LogoIcon}
        CollapseIcon={CollapseIcon}
        ChevronIcon={ChevronIcon}
        HintIcon={HintIcon}
        secondaryContent={resolvedSecondaryContent}
        bottomContent={resolvedBottomContent}
        workspaceName={workspaceName}
        workspaceInitial={workspaceInitial}
      />

      <ContentTag className={contentClassName}>
        {children}
      </ContentTag>
    </div>
  )
}
