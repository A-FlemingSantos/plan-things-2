import { useEffect, useState } from 'react'
import { useAuth } from '../../../features/auth/context/AuthContext.jsx'
import ProductSidebar from '../ProductSidebar/ProductSidebar.jsx'

const SIDEBAR_STORAGE_KEY = 'plan-things:sidebar-collapsed'
const SETTINGS_STORAGE_PREFIX = 'plan-things:settings:v1:'

function readLocalSettings(userId) {
  if (!userId || typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(`${SETTINGS_STORAGE_PREFIX}${userId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
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
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false

    const persistedSidebarValue = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (persistedSidebarValue !== null) {
      return persistedSidebarValue === 'true'
    }

    const localSettings = readLocalSettings(currentUser?.id)
    return localSettings?.collapsedByDefault === true
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!currentUser?.id) return
    if (window.localStorage.getItem(SIDEBAR_STORAGE_KEY) !== null) return

    const localSettings = readLocalSettings(currentUser.id)
    if (typeof localSettings?.collapsedByDefault === 'boolean') {
      setCollapsed(localSettings.collapsedByDefault)
    }
  }, [currentUser?.id])

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
