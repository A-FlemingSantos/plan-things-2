import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext.jsx'
import { useResponsiveViewport } from '../../hooks/useResponsiveViewport.js'
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

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
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
  workspaceIconKey,
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
  const sidebarStorageKey = useMemo(
    () => buildSidebarStorageKey(currentUser?.id),
    [currentUser?.id],
  )
  const [collapsed, setCollapsed] = useState(() => (
    readSidebarCollapsedState(sidebarStorageKey)
  ))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const ContentTag = contentTag
  const resolvedWorkspaceName = workspaceName ?? workspace?.name ?? 'Workspace'
  const resolvedWorkspaceIconKey = workspaceIconKey ?? workspace?.iconKey ?? null
  const resolvedWorkspaceInitial = workspaceInitial
    ?? workspace?.name?.trim()?.charAt(0)?.toUpperCase()
    ?? currentUser?.fullName?.trim()?.charAt(0)?.toUpperCase()
    ?? 'P'
  const resolvedSecondaryContent =
    typeof secondaryContent === 'function'
      ? secondaryContent({ collapsed, isMobile, closeDrawer: () => setDrawerOpen(false) })
      : secondaryContent
  const resolvedBottomContent =
    typeof bottomContent === 'function'
      ? bottomContent({ collapsed, isMobile, closeDrawer: () => setDrawerOpen(false) })
      : bottomContent
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
  }, [location.pathname])

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
    styles.shell,
    !isMobile && collapsed ? styles.shellCollapsed : '',
    isMobile ? 'productAppShellMobile' : '',
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
                <MenuIcon />
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
              styles={styles}
              mode="drawer"
              className="productAppShellDrawerSidebar"
              collapsed={false}
              onToggleCollapse={() => setDrawerOpen(false)}
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
              workspaceIconKey={resolvedWorkspaceIconKey}
              showCollapseButton={false}
              ariaLabel={mobileDrawerAriaLabel}
              headerControl={(
                <button
                  type="button"
                  className={styles.collapseBtn}
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Fechar menu de navegação"
                  data-sidebar-collapse-button
                >
                  <span className={styles.collapseBtnIcon} data-sidebar-collapse-icon>
                    <CloseIcon />
                  </span>
                </button>
              )}
            />
          </div>
        </>
      ) : null}

      {!isMobile ? (
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
          workspaceIconKey={resolvedWorkspaceIconKey}
        />
      ) : null}

      <ContentTag className={contentClassName} data-app-shell-content>
        {children}
      </ContentTag>
    </div>
  )
}
