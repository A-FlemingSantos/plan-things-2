import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuth } from '../../../features/auth/context/AuthContext.jsx'
import { useResponsiveViewport } from '../../hooks/useResponsiveViewport.js'
import { useWorkspaceNavigation } from '../../hooks/useWorkspaceNavigation.js'
import ProductSidebar from '../ProductSidebar/ProductSidebar.jsx'
import shellStyles from './ProductAppShell.module.css'

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
  contentClassName,
  contentTag = 'div',
  mobileTitle = 'Workspace',
  mobileTitleMeta = null,
  mobileActions = null,
  mobileDrawerAriaLabel = 'Navegação principal',
  children,
}) {
  const { workspace, currentUser } = useAuth()
  const location = useLocation()
  const { isMobile } = useResponsiveViewport()
  const { activeNav } = useWorkspaceNavigation()
  const sidebarStorageKey = useMemo(
    () => buildSidebarStorageKey(currentUser?.id),
    [currentUser?.id],
  )
  const [collapsed, setCollapsed] = useState(() => (
    readSidebarCollapsedState(sidebarStorageKey)
  ))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const ContentTag = contentTag
  const resolvedWorkspaceName = workspace?.name?.trim() || 'Área de trabalho pessoal'
  const resolvedWorkspaceIconKey = workspace?.iconKey ?? null
  const resolvedMobileActions =
    typeof mobileActions === 'function'
      ? mobileActions({ closeDrawer: () => setDrawerOpen(false), isMobile })
      : mobileActions

  useEffect(() => {
    if (isMobile) {
      setCollapsed(false)
      return
    }

    setCollapsed(readSidebarCollapsedState(sidebarStorageKey))
  }, [isMobile, sidebarStorageKey])

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    if (!isMobile || !drawerOpen || typeof document === 'undefined') return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [drawerOpen, isMobile])

  useEffect(() => {
    if (!isMobile || !drawerOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [drawerOpen, isMobile])

  const handleToggleCollapse = () => {
    if (isMobile) {
      setDrawerOpen((value) => !value)
      return
    }

    setCollapsed((value) => {
      const next = !value
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(sidebarStorageKey, String(next))
      }
      return next
    })
  }

  const shellClassName = [
    shellStyles.shell,
    !isMobile && collapsed ? shellStyles.shellCollapsed : '',
    isMobile ? shellStyles.shellMobile : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={shellClassName} data-app-shell data-mobile={isMobile ? 'true' : 'false'}>
      {isMobile ? (
        <>
          <header className="productAppShellHeader">
            <div className="productAppShellHeaderLeft">
              <button
                type="button"
                className="productAppShellIconButton"
                onClick={() => setDrawerOpen(true)}
                aria-label="Abrir menu de navegação"
              >
                <Menu size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>

              <div className="productAppShellHeaderText">
                <div className="productAppShellHeaderTitleRow">
                  <h1 className="productAppShellHeaderTitle">{mobileTitle}</h1>
                  {mobileTitleMeta ? <span className="productAppShellHeaderMeta">{mobileTitleMeta}</span> : null}
                </div>
              </div>
            </div>

            {resolvedMobileActions ? (
              <div className="productAppShellHeaderActions">
                {resolvedMobileActions}
              </div>
            ) : null}
          </header>

          <div
            className={`productAppShellOverlay ${drawerOpen ? 'productAppShellOverlayOpen' : ''}`}
            aria-hidden={drawerOpen ? 'false' : 'true'}
            onClick={() => setDrawerOpen(false)}
          />

          <div
            className={`productAppShellDrawer ${drawerOpen ? 'productAppShellDrawerOpen' : ''}`}
            aria-hidden={drawerOpen ? 'false' : 'true'}
          >
            <ProductSidebar
              mode="drawer"
              className="productAppShellDrawerSidebar"
              collapsed={false}
              onToggleCollapse={() => setDrawerOpen(false)}
              activeNav={activeNav}
              workspaceName={resolvedWorkspaceName}
              workspaceIconKey={resolvedWorkspaceIconKey}
              showCollapseButton
              ariaLabel={mobileDrawerAriaLabel}
            />
          </div>
        </>
      ) : null}

      {!isMobile ? (
        <ProductSidebar
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
          activeNav={activeNav}
          workspaceName={resolvedWorkspaceName}
          workspaceIconKey={resolvedWorkspaceIconKey}
        />
      ) : null}

      <ContentTag className={[shellStyles.content, contentClassName].filter(Boolean).join(' ')} data-app-shell-content>
        {children}
      </ContentTag>
    </div>
  )
}
