import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../features/auth/context/AuthContext.jsx'
import ProductSidebar from '../ProductSidebar/ProductSidebar.jsx'

const SIDEBAR_STORAGE_PREFIX = 'plan-things:sidebar-collapsed:v1:'

function buildSidebarStorageKey(userId) {
  return `${SIDEBAR_STORAGE_PREFIX}${userId || 'anonymous'}`
}

function readSidebarCollapsedState(storageKey) {
  if (typeof window === 'undefined') return false

  const persistedSidebarValue = window.localStorage.getItem(storageKey)
  return persistedSidebarValue === 'true'
}

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
  const sidebarStorageKey = useMemo(
    () => buildSidebarStorageKey(currentUser?.id),
    [currentUser?.id],
  )
  const [collapsed, setCollapsed] = useState(() => (
    readSidebarCollapsedState(sidebarStorageKey)
  ))
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
    setCollapsed(readSidebarCollapsedState(sidebarStorageKey))
  }, [sidebarStorageKey])

  const handleToggleCollapse = () => {
    setCollapsed((value) => {
      const next = !value
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(sidebarStorageKey, String(next))
      }
      return next
    })
  }

  return (
    <div className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ''}`}>
      <ProductSidebar
        styles={styles}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
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
