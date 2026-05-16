import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext.jsx'
import { buildAuthRedirectState } from '../../../features/auth/utils/authRedirect.js'
import {
  DEFAULT_LOCAL_PREFERENCES,
  readStoredLocalPreferences,
  resolveInitialRouteForState,
} from '../../../features/preferences/context/PreferencesContext.jsx'
import { ROUTES } from '../../config/routes.js'
import { getWorkspacePlanLabel } from '../../utils/workspaceSubscriptionPlans.js'
import AuthenticatedAvatar from '../AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import SidebarUserCard from '../SidebarUserCard/SidebarUserCard.jsx'
import menuStyles from './SidebarAccountMenu.module.css'

const COLLAPSED_MENU_WIDTH = 220
const COLLAPSED_MENU_FALLBACK_HEIGHT = 320
const COLLAPSED_MENU_GAP = 12
const COLLAPSED_MENU_MARGIN = 12

function UserIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 12c0-2.2 2.2-4 5-4s5 1.8 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}

function AddUserIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 12c0-2 1.8-3.5 4.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10 8.5v4M8 10.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}

function UpgradeIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2l1.8 3.6L13 6.3l-3 2.9.7 4.1L7 11.2 3.3 13.3l.7-4.1-3-2.9 4.2-.7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
}

function SettingsIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}

function LogOutIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M9.5 9.5L12 7l-2.5-2.5M5.5 7H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function ChevronRightIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2.5L8.5 7 5 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

const MENU_ITEMS = [
  { id: 'profile', label: 'Meu perfil', Icon: UserIcon, danger: false },
  { id: 'upgrade', label: 'Upgrade', Icon: UpgradeIcon, danger: false },
  { id: 'settings', label: 'Configurações', Icon: SettingsIcon, danger: false },
  { id: 'logout', label: 'Sair', Icon: LogOutIcon, danger: true },
]

export default function SidebarAccountMenu({
  styles,
  collapsed,
  name = 'Arthur Santos',
  email = 'arthur@planthings.com',
  plan = 'Professional',
  initials = 'AS',
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
  const [collapsedMenuPosition, setCollapsedMenuPosition] = useState(null)
  const containerRef = useRef(null)
  const menuRef = useRef(null)
  const menuIdRef = useRef(`sidebar-account-menu-${Math.random().toString(36).slice(2, 10)}`)
  const accountsMenuIdRef = useRef(`sidebar-account-submenu-${Math.random().toString(36).slice(2, 10)}`)
  const resolvedName = currentUser?.fullName ?? name
  const resolvedEmail = currentUser?.email ?? email
  const resolvedAvatarUrl = currentUser?.avatarUrl ?? null
  const resolvedInitials = currentUser?.fullName
    ? currentUser.fullName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    : initials
  const resolvedPlanLabel = workspace?.subscriptionPlan ? getWorkspacePlanLabel(workspace.subscriptionPlan) : plan
  const orderedAccounts = useMemo(() => {
    const accounts = Array.isArray(savedAccounts) ? [...savedAccounts] : []
    accounts.sort((left, right) => {
      if (left.accountId === activeAccountId) return -1
      if (right.accountId === activeAccountId) return 1
      return 0
    })
    return accounts
  }, [activeAccountId, savedAccounts])

  const updateCollapsedMenuPosition = useCallback((anchorRectOverride = null) => {
    if (!collapsed) {
      setCollapsedMenuPosition(null)
      return
    }

    const anchorRect = anchorRectOverride
      ?? containerRef.current?.querySelector('[data-sidebar-user-button]')?.getBoundingClientRect()

    if (!anchorRect) return

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const menuRect = menuRef.current?.getBoundingClientRect()
    const menuWidth = menuRect?.width || COLLAPSED_MENU_WIDTH
    const menuHeight = menuRect?.height || COLLAPSED_MENU_FALLBACK_HEIGHT
    const nextLeft = Math.min(
      anchorRect.right + COLLAPSED_MENU_GAP,
      viewportWidth - menuWidth - COLLAPSED_MENU_MARGIN,
    )
    const preferredTop = anchorRect.bottom - menuHeight
    const maxTop = Math.max(COLLAPSED_MENU_MARGIN, viewportHeight - menuHeight - COLLAPSED_MENU_MARGIN)
    const nextTop = Math.min(
      Math.max(preferredTop, COLLAPSED_MENU_MARGIN),
      maxTop,
    )

    setCollapsedMenuPosition({
      left: Math.max(COLLAPSED_MENU_MARGIN, nextLeft),
      top: nextTop,
      width: menuWidth,
    })
  }, [collapsed])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
        setAccountsOpen(false)
        setSwitchError('')
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setAccountsOpen(false)
        setSwitchError('')
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
    if (!open || !collapsed) return

    updateCollapsedMenuPosition()

    const handleViewportChange = () => updateCollapsedMenuPosition()

    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [collapsed, open, updateCollapsedMenuPosition])

  const handleToggle = (event) => {
    setOpen((currentOpen) => {
      const nextOpen = !currentOpen

      if (nextOpen && collapsed) {
        updateCollapsedMenuPosition(event.currentTarget.getBoundingClientRect())
      }

      if (!nextOpen) {
        setCollapsedMenuPosition(null)
        setAccountsOpen(false)
        setSwitchError('')
      }

      return nextOpen
    })
  }

  const collapsedMenuStyle = collapsed && collapsedMenuPosition
    ? {
        position: 'fixed',
        left: `${collapsedMenuPosition.left}px`,
        top: `${collapsedMenuPosition.top}px`,
        width: `${collapsedMenuPosition.width}px`,
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
    setCollapsedMenuPosition(null)
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

  const resolveAccountHomeRoute = (accountId) => {
    if (!accountId) {
      return ROUTES.workspace
    }

    return resolveInitialRouteForState({
      localPreferences: readStoredLocalPreferences(accountId) ?? DEFAULT_LOCAL_PREFERENCES,
      lastContext: null,
    })
  }

  const handleOpenAddAccount = () => {
    setOpen(false)
    setAccountsOpen(false)
    setSwitchError('')
    setCollapsedMenuPosition(null)
    navigate(ROUTES.login, {
      state: buildAuthRedirectState(location, {
        authMode: 'add-account',
      }),
    })
  }

  const handleAccountsToggle = () => {
    setAccountsOpen((currentOpen) => !currentOpen)
    setSwitchError('')
  }

  const handleAccountsMouseEnter = () => {
    setAccountsOpen(true)
    setSwitchError('')
  }

  const handleSwitchAccount = async (accountId) => {
    setSwitchingAccountId(accountId)
    setSwitchError('')

    try {
      const nextSession = await switchAccount(accountId)
      setOpen(false)
      setAccountsOpen(false)
      setCollapsedMenuPosition(null)
      navigate(resolveAccountHomeRoute(nextSession?.user?.id ?? accountId))
    } catch (error) {
      setSwitchError(error?.message ?? 'Nao foi possivel trocar de conta.')
    } finally {
      setSwitchingAccountId(null)
    }
  }

  return (
    <div ref={containerRef} className={menuStyles.container}>
      <SidebarUserCard
        styles={styles}
        collapsed={collapsed}
        name={resolvedName}
        plan={resolvedPlanLabel}
        initials={resolvedInitials}
        avatarUrl={resolvedAvatarUrl}
        active={open}
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuIdRef.current}
      >
        {open && (
          <div
            ref={menuRef}
            id={menuIdRef.current}
            className={[
              menuStyles.menu,
              collapsed ? menuStyles.menuCollapsed : '',
              collapsed ? menuStyles.menuDetached : '',
            ].filter(Boolean).join(' ')}
            role="menu"
            style={collapsedMenuStyle}
          >
            <button
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
                <ChevronRightIcon />
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
                <span className={menuStyles.icon}><Icon /></span>
                {label}
              </button>
            ))}

            {accountsOpen && (
              <div
                id={accountsMenuIdRef.current}
                className={menuStyles.submenu}
                role="menu"
                aria-label="Contas salvas"
              >
                <div className={menuStyles.submenuHeader}>Contas salvas</div>
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
                      <AuthenticatedAvatar
                        className={menuStyles.avatar}
                        imageClassName="authenticatedAvatarImage"
                        avatarUrl={account.user?.avatarUrl ?? null}
                        fallback={accountInitials}
                        title={account.user?.fullName ?? 'Conta'}
                      />
                      <span className={menuStyles.accountIdentity}>
                        <span className={menuStyles.accountNameRow}>
                          <span className={menuStyles.accountName}>{account.user?.fullName ?? 'Conta sem nome'}</span>
                          {isActive ? <span className={menuStyles.accountBadge}>Ativa</span> : null}
                        </span>
                        <span className={menuStyles.accountEmail}>{account.user?.email ?? 'Sem e-mail'}</span>
                      </span>
                    </button>
                  )
                })}

                <div className={menuStyles.divider} />

                <button
                  type="button"
                  className={menuStyles.item}
                  role="menuitem"
                  disabled={switchingAccountId !== null}
                  onClick={handleOpenAddAccount}
                >
                  <span className={menuStyles.icon}><AddUserIcon /></span>
                  Adicionar conta
                </button>

                {switchError ? (
                  <div className={menuStyles.submenuError} role="status">
                    {switchError}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </SidebarUserCard>
    </div>
  )
}
