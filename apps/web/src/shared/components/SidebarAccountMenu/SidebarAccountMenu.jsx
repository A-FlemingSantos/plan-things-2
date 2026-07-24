import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronRight,
  CircleFadingArrowUp,
  LogOut,
  Plus,
  Settings,
  User,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext.jsx'
import { buildAuthRedirectState, resolveAccountHomeRoute } from '../../../features/auth/utils/authRedirect.js'
import { ROUTES } from '../../config/routes.js'
import { getWorkspacePlanLabel } from '../../utils/workspaceSubscriptionPlans.js'
import AuthenticatedAvatar from '../AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import SidebarUserCard from '../SidebarUserCard/SidebarUserCard.jsx'
import menuStyles from './SidebarAccountMenu.module.css'

const COLLAPSED_MENU_WIDTH = 220
const EXPANDED_MENU_HORIZONTAL_INSET = 10
const MENU_FALLBACK_HEIGHT = 320
const MENU_MARGIN = 12
const MENU_VERTICAL_OFFSET = 6
const DOCK_MENU_GAP = 14
const DOCK_MENU_MIN_WIDTH = 300
const SUBMENU_FALLBACK_WIDTH = 280
const SUBMENU_FALLBACK_HEIGHT = 160
const SUBMENU_OVERLAP = 10
const SUBMENU_MARGIN = 12

const MENU_ITEM_ICON_SIZE = 14
const MENU_ITEM_ICON_STROKE = 1.75

const MENU_ITEMS = [
  { id: 'profile', label: 'Meu perfil', Icon: User, danger: false },
  { id: 'upgrade', label: 'Upgrade', Icon: CircleFadingArrowUp, danger: false },
  { id: 'settings', label: 'Configurações', Icon: Settings, danger: false },
  { id: 'logout', label: 'Sair', Icon: LogOut, danger: true },
]

export default function SidebarAccountMenu({
  styles,
  collapsed,
  name = 'Arthur Santos',
  email = 'arthur@planthings.com',
  plan = 'Professional',
  initials = 'AS',
  menuPlacement = 'above',
  menuPresentation = 'avatar',
  dockAnchorRef = null,
  onOpenChange = null,
  renderTrigger = null,
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    currentUser,
    workspace,
    activeAccountId,
    savedAccounts,
    isAuthenticated,
    switchAccount,
    logout,
  } = useAuth()
  const [open, setOpen] = useState(false)
  const [accountsOpen, setAccountsOpen] = useState(false)
  const [switchingAccountId, setSwitchingAccountId] = useState(null)
  const [switchError, setSwitchError] = useState('')
  const [menuPosition, setMenuPosition] = useState(null)
  const [accountsMenuPosition, setAccountsMenuPosition] = useState(null)
  const containerRef = useRef(null)
  const menuRef = useRef(null)
  const accountsTriggerRef = useRef(null)
  const accountsMenuRef = useRef(null)
  const menuIdRef = useRef(`sidebar-account-menu-${Math.random().toString(36).slice(2, 10)}`)
  const accountsMenuIdRef = useRef(`sidebar-account-submenu-${Math.random().toString(36).slice(2, 10)}`)
  const resolvedName = currentUser?.fullName ?? name
  const resolvedEmail = currentUser?.email ?? email
  const resolvedAvatarUrl = currentUser?.avatarUrl ?? null
  const resolvedInitials = currentUser?.fullName
    ? currentUser.fullName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    : initials
  const resolvedPlanLabel = workspace?.subscriptionPlan ? getWorkspacePlanLabel(workspace.subscriptionPlan) : plan
  const portalRoot = containerRef.current?.closest('[data-app-theme-scope]') ?? document.body
  const orderedAccounts = useMemo(() => {
    const accounts = Array.isArray(savedAccounts) ? [...savedAccounts] : []
    accounts.sort((left, right) => {
      if (left.accountId === activeAccountId) return -1
      if (right.accountId === activeAccountId) return 1
      return 0
    })
    return accounts
  }, [activeAccountId, savedAccounts])

  const updateMenuPosition = useCallback((anchorRectOverride = null) => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const menuRect = menuRef.current?.getBoundingClientRect()

    if (menuPresentation === 'dock') {
      const dockRect = dockAnchorRef?.current?.getBoundingClientRect?.()
      if (!dockRect) return

      const menuWidth = Math.min(
        Math.max(DOCK_MENU_MIN_WIDTH, Math.round(dockRect.width)),
        viewportWidth - (MENU_MARGIN * 2),
      )
      const menuHeight = menuRect?.height || MENU_FALLBACK_HEIGHT
      const centerX = Math.round(dockRect.left + (dockRect.width / 2))
      const preferredTop = Math.round(dockRect.top - menuHeight - DOCK_MENU_GAP)
      const maxTop = Math.max(MENU_MARGIN, viewportHeight - menuHeight - MENU_MARGIN)
      const nextTop = Math.min(Math.max(preferredTop, MENU_MARGIN), maxTop)

      setMenuPosition({
        position: 'fixed',
        left: `${centerX}px`,
        top: nextTop,
        width: menuWidth,
        transform: 'translateX(-50%)',
      })
      return
    }

    const anchorRect = anchorRectOverride
      ?? containerRef.current?.querySelector('[data-sidebar-user-button]')?.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()

    if (!anchorRect || !containerRect) return
    const preferredWidth = collapsed
      ? COLLAPSED_MENU_WIDTH
      : Math.max(180, containerRect.width - (EXPANDED_MENU_HORIZONTAL_INSET * 2))
    const menuWidth = Math.min(
      menuRect?.width || preferredWidth,
      viewportWidth - (MENU_MARGIN * 2),
    )
    const menuHeight = menuRect?.height || MENU_FALLBACK_HEIGHT
    const preferredLeft = collapsed
      ? anchorRect.left
      : containerRect.left + EXPANDED_MENU_HORIZONTAL_INSET
    const minimumLeft = collapsed ? MENU_MARGIN : EXPANDED_MENU_HORIZONTAL_INSET
    const nextLeft = Math.min(
      Math.max(preferredLeft, minimumLeft),
      viewportWidth - menuWidth - MENU_MARGIN,
    )
    const preferredTop = menuPlacement === 'below'
      ? anchorRect.bottom + MENU_VERTICAL_OFFSET
      : anchorRect.top - menuHeight - MENU_VERTICAL_OFFSET
    const maxTop = Math.max(MENU_MARGIN, viewportHeight - menuHeight - MENU_MARGIN)
    const nextTop = Math.min(
      Math.max(preferredTop, MENU_MARGIN),
      maxTop,
    )

    setMenuPosition({
      position: 'fixed',
      left: `${nextLeft}px`,
      top: nextTop,
      width: menuWidth,
      transform: undefined,
    })
  }, [collapsed, dockAnchorRef, menuPlacement, menuPresentation])

  const updateAccountsMenuPosition = useCallback((anchorRectOverride = null) => {
    const anchorRect = anchorRectOverride
      ?? accountsTriggerRef.current?.getBoundingClientRect?.()

    if (!anchorRect) return

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const submenuRect = accountsMenuRef.current?.getBoundingClientRect?.()
    const menuWidth = submenuRect?.width || SUBMENU_FALLBACK_WIDTH
    const menuHeight = submenuRect?.height || SUBMENU_FALLBACK_HEIGHT
    const availableHeight = Math.max(160, viewportHeight - (SUBMENU_MARGIN * 2))
    const visibleHeight = Math.min(menuHeight, availableHeight)
    const width = Math.min(menuWidth, viewportWidth - (SUBMENU_MARGIN * 2))
    const rightAlignedLeft = anchorRect.right - SUBMENU_OVERLAP
    const leftAlignedLeft = anchorRect.left - width + SUBMENU_OVERLAP
    const preferredLeft = rightAlignedLeft + width <= viewportWidth - SUBMENU_MARGIN
      ? rightAlignedLeft
      : leftAlignedLeft >= SUBMENU_MARGIN
        ? leftAlignedLeft
        : Math.max(
            SUBMENU_MARGIN,
            Math.min(rightAlignedLeft, viewportWidth - width - SUBMENU_MARGIN),
          )
    const preferredTop = anchorRect.bottom - visibleHeight
    const top = Math.max(
      SUBMENU_MARGIN,
      Math.min(preferredTop, viewportHeight - visibleHeight - SUBMENU_MARGIN),
    )

    setAccountsMenuPosition({
      position: 'fixed',
      left: `${preferredLeft}px`,
      top: `${top}px`,
      width: `${width}px`,
      maxHeight: `${availableHeight}px`,
    })
  }, [])

  useEffect(() => {
    const handlePointerDown = (event) => {
      const clickedInsideContainer = containerRef.current?.contains(event.target) ?? false
      const clickedInsideMenu = menuRef.current?.contains(event.target) ?? false
      const clickedInsideAccountsMenu = accountsMenuRef.current?.contains(event.target) ?? false

      if (!clickedInsideContainer && !clickedInsideMenu && !clickedInsideAccountsMenu) {
        setOpen(false)
        setAccountsOpen(false)
        setSwitchError('')
        setAccountsMenuPosition(null)
        setMenuPosition(null)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setAccountsOpen(false)
        setSwitchError('')
        setAccountsMenuPosition(null)
        setMenuPosition(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    onOpenChange?.(open)
  }, [onOpenChange, open])

  useLayoutEffect(() => {
    if (!open) return

    updateMenuPosition()

    const handleViewportChange = () => updateMenuPosition()

    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    let dockObserver = null
    const dockElement = menuPresentation === 'dock' ? dockAnchorRef?.current : null
    if (dockElement && typeof ResizeObserver === 'function') {
      dockObserver = new ResizeObserver(() => updateMenuPosition())
      dockObserver.observe(dockElement)
    }

    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
      dockObserver?.disconnect()
    }
  }, [collapsed, dockAnchorRef, menuPresentation, open, updateMenuPosition])

  useLayoutEffect(() => {
    if (!open || !accountsOpen) return

    updateAccountsMenuPosition()

    const handleViewportChange = () => updateAccountsMenuPosition()

    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [accountsOpen, open, orderedAccounts.length, switchError, updateAccountsMenuPosition])

  const handleToggle = () => {
    setOpen((currentOpen) => {
      const nextOpen = !currentOpen

      if (nextOpen && (collapsed || menuPresentation === 'dock')) {
        setMenuPosition(null)
      }

      if (!nextOpen) {
        setMenuPosition(null)
        setAccountsMenuPosition(null)
        setAccountsOpen(false)
        setSwitchError('')
      }

      return nextOpen
    })
  }

  const resolvedMenuStyle = menuPosition
    ? {
        position: menuPosition.position,
        left: menuPosition.left,
        top: `${menuPosition.top}px`,
        width: `${menuPosition.width}px`,
        transform: menuPosition.transform,
      }
    : undefined

  const openSettingsSection = (section) => {
    const params = new URLSearchParams()
    if (section) {
      params.set('section', section)
    }

    const target = `${ROUTES.settings}${params.toString() ? `?${params.toString()}` : ''}`

    if (location.pathname === ROUTES.settings) {
      navigate(target, {
        replace: true,
        state: location.state,
      })
      return
    }

    navigate(target, {
      state: {
        backgroundLocation: location,
      },
    })
  }

  const handleItemClick = (id) => {
    setOpen(false)
    setAccountsOpen(false)
    setSwitchError('')
    setMenuPosition(null)
    setAccountsMenuPosition(null)
    if (id === 'logout' && isAuthenticated) {
      logout({
        redirectTo: ROUTES.login,
        replace: true,
      })
    } else if (id === 'profile') {
      openSettingsSection('account')
    } else if (id === 'upgrade') {
      openSettingsSection('workspace')
    } else if (id === 'settings') {
      openSettingsSection(null)
    }
  }

  const handleOpenAddAccount = () => {
    setOpen(false)
    setAccountsOpen(false)
    setSwitchError('')
    setMenuPosition(null)
    setAccountsMenuPosition(null)
    navigate(ROUTES.login, {
      replace: true,
      state: buildAuthRedirectState(location, {
        authMode: 'add-account',
      }, {
        includeRedirectTo: false,
      }),
    })
  }

  const handleAccountsToggle = () => {
    setAccountsOpen((currentOpen) => {
      const nextOpen = !currentOpen
      if (!nextOpen) {
        setAccountsMenuPosition(null)
      }
      return nextOpen
    })
    setSwitchError('')
  }

  const handleAccountsMouseEnter = () => {
    setAccountsOpen(true)
    setSwitchError('')
  }

  const handleSwitchAccount = async (accountId) => {
    const targetAccountId = accountId ? String(accountId) : null

    if (targetAccountId && targetAccountId === activeAccountId) {
      setOpen(false)
      setAccountsOpen(false)
      setMenuPosition(null)
      setAccountsMenuPosition(null)
      setSwitchError('')
      return
    }

    setSwitchingAccountId(targetAccountId)
    setSwitchError('')

    try {
      const nextSession = await switchAccount(targetAccountId)
      setOpen(false)
      setAccountsOpen(false)
      setMenuPosition(null)
      setAccountsMenuPosition(null)
      navigate(resolveAccountHomeRoute(nextSession?.user?.id ?? targetAccountId), { replace: true })
    } catch (error) {
      setSwitchError(error?.message ?? 'Nao foi possivel trocar de conta.')
    } finally {
      setSwitchingAccountId(null)
    }
  }

  const triggerProps = {
    type: 'button',
    onClick: handleToggle,
    'data-sidebar-user-button': true,
    'aria-expanded': open,
    'aria-haspopup': 'menu',
    'aria-controls': menuIdRef.current,
  }

  return (
    <div ref={containerRef} className={menuStyles.container}>
      {typeof renderTrigger === 'function'
        ? renderTrigger({
            open,
            resolvedName,
            resolvedEmail,
            resolvedPlanLabel,
            resolvedAvatarUrl,
            resolvedInitials,
            triggerProps,
          })
        : (
          <SidebarUserCard
            styles={styles}
            collapsed={collapsed}
            name={resolvedName}
            plan={resolvedPlanLabel}
            initials={resolvedInitials}
            avatarUrl={resolvedAvatarUrl}
            active={open}
            {...triggerProps}
          />
        )}

      {open && typeof document !== 'undefined'
        ? createPortal(
          <div
            ref={menuRef}
            id={menuIdRef.current}
            className={[
              menuStyles.menu,
              menuPresentation === 'dock' ? menuStyles.menuDock : '',
              collapsed && menuPresentation !== 'dock' ? menuStyles.menuCollapsed : '',
            ].filter(Boolean).join(' ')}
            role="menu"
            style={resolvedMenuStyle}
          >
            <button
              ref={accountsTriggerRef}
              type="button"
              className={[
                menuStyles.headerButton,
                accountsOpen ? menuStyles.headerButtonActive : '',
              ].filter(Boolean).join(' ')}
              onMouseEnter={handleAccountsMouseEnter}
              onClick={handleAccountsToggle}
              aria-label={`Contas salvas de ${resolvedName}`}
              aria-expanded={accountsOpen}
              aria-haspopup="menu"
              aria-controls={accountsMenuIdRef.current}
            >
              <div className={menuStyles.header}>
                <AuthenticatedAvatar
                  className={menuStyles.avatar}
                  imageClassName="authenticatedAvatarImage"
                  avatarUrl={resolvedAvatarUrl}
                  fallback={resolvedInitials}
                  title={resolvedName}
                />
                <div className={menuStyles.identity}>
                  <p className={menuStyles.name}>{resolvedName}</p>
                  <p className={menuStyles.email}>{resolvedEmail}</p>
                </div>
              </div>
              <span
                className={[
                  menuStyles.headerChevron,
                  accountsOpen ? menuStyles.headerChevronOpen : '',
                ].filter(Boolean).join(' ')}
                aria-hidden="true"
              >
                <ChevronRight size={MENU_ITEM_ICON_SIZE} strokeWidth={MENU_ITEM_ICON_STROKE} aria-hidden="true" />
              </span>
            </button>

            <div className={menuStyles.divider} />

            {MENU_ITEMS.map(({ id, label, Icon, danger }, index) => (
              <button
                key={id}
                type="button"
                className={[
                  menuStyles.item,
                  danger ? menuStyles.itemDanger : '',
                ].filter(Boolean).join(' ')}
                role="menuitem"
                style={{ animationDelay: `${index * 28}ms` }}
                onClick={() => handleItemClick(id)}
              >
                <span className={menuStyles.icon}>
                  <Icon size={MENU_ITEM_ICON_SIZE} strokeWidth={MENU_ITEM_ICON_STROKE} aria-hidden="true" />
                </span>
                {label}
              </button>
            ))}
          </div>,
          portalRoot,
        )
        : null}

      {open && accountsOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={accountsMenuRef}
              id={accountsMenuIdRef.current}
              className={[
                menuStyles.submenu,
                menuPresentation === 'dock' ? menuStyles.submenuDock : '',
              ].filter(Boolean).join(' ')}
              role="menu"
              aria-label="Contas salvas"
              style={accountsMenuPosition ?? undefined}
            >
              {orderedAccounts.map((account) => {
                const accountInitials = account.user?.fullName
                  ? account.user.fullName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
                  : 'PT'
                const isActive = account.accountId === activeAccountId
                const isBusy = switchingAccountId === account.accountId

                return (
                  <button
                    key={account.accountId}
                    type="button"
                    className={[
                      menuStyles.accountItem,
                      isActive ? menuStyles.accountItemActive : '',
                      isBusy ? menuStyles.accountItemBusy : '',
                    ].filter(Boolean).join(' ')}
                    role="menuitemradio"
                    aria-checked={isActive}
                    disabled={switchingAccountId !== null}
                    onClick={() => handleSwitchAccount(account.accountId)}
                  >
                    <span className={menuStyles.accountMain}>
                      <AuthenticatedAvatar
                        className={[menuStyles.avatar, menuStyles.accountAvatar].join(' ')}
                        imageClassName="authenticatedAvatarImage"
                        avatarUrl={account.user?.avatarUrl ?? null}
                        fallback={accountInitials}
                        title={account.user?.fullName ?? 'Conta'}
                      />
                      <span className={menuStyles.accountIdentity}>
                        <span className={menuStyles.accountNameRow}>
                          <span className={menuStyles.accountName}>{account.user?.fullName ?? 'Conta sem nome'}</span>
                        </span>
                      </span>
                    </span>
                    <span
                      className={[
                        menuStyles.accountCheck,
                        isActive ? menuStyles.accountCheckVisible : '',
                      ].filter(Boolean).join(' ')}
                      aria-hidden="true"
                    >
                      <Check size={MENU_ITEM_ICON_SIZE} strokeWidth={MENU_ITEM_ICON_STROKE} aria-hidden="true" />
                    </span>
                  </button>
                )
              })}

              <div className={[menuStyles.divider, menuStyles.submenuDivider].join(' ')} />

              <button
                type="button"
                className={[menuStyles.item, menuStyles.addAccountItem].join(' ')}
                role="menuitem"
                disabled={switchingAccountId !== null}
                onClick={handleOpenAddAccount}
              >
                <span className={[menuStyles.icon, menuStyles.addAccountIcon].join(' ')}>
                  <Plus size={16} strokeWidth={MENU_ITEM_ICON_STROKE} aria-hidden="true" />
                </span>
                Adicionar conta
              </button>

              {switchError ? (
                <div className={menuStyles.submenuError} role="status">
                  {switchError}
                </div>
              ) : null}
            </div>,
            portalRoot,
          )
        : null}
    </div>
  )
}
