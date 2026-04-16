import { useEffect, useState } from 'react'
import { useAuth } from '../../../features/auth/context/AuthContext.jsx'
import ProductSidebar from '../ProductSidebar/ProductSidebar.jsx'

const SIDEBAR_STORAGE_KEY = 'plan-things:sidebar-collapsed'

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
  const { workspace, currentUser } = useAuth()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
  })
  const ContentTag = contentTag
  const resolvedWorkspaceName = workspaceName ?? workspace?.name ?? 'Workspace'
  const resolvedWorkspaceInitial = workspaceInitial
    ?? workspace?.name?.trim()?.charAt(0)?.toUpperCase()
    ?? currentUser?.fullName?.trim()?.charAt(0)?.toUpperCase()
    ?? 'P'
  const resolvedSecondaryContent =
    typeof secondaryContent === 'function' ? secondaryContent({ collapsed }) : secondaryContent
  const resolvedBottomContent =
    typeof bottomContent === 'function' ? bottomContent({ collapsed }) : bottomContent

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed))
  }, [collapsed])

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
        workspaceName={resolvedWorkspaceName}
        workspaceInitial={resolvedWorkspaceInitial}
      />

      <ContentTag className={contentClassName}>
        {children}
      </ContentTag>
    </div>
  )
}
