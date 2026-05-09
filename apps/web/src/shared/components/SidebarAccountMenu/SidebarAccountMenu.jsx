import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext.jsx'
import { ROUTES } from '../../config/routes.js'
import { getWorkspacePlanLabel } from '../../utils/workspaceSubscriptionPlans.js'
import AuthenticatedAvatar from '../AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import SidebarUserCard from '../SidebarUserCard/SidebarUserCard.jsx'
import menuStyles from './SidebarAccountMenu.module.css'

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

const MENU_ITEMS = [
  { id: 'profile', label: 'Meu perfil', Icon: UserIcon, danger: false },
  { id: 'add', label: 'Adicionar conta', Icon: AddUserIcon, danger: false },
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
  const { currentUser, workspace, isAuthenticated, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const menuIdRef = useRef(`sidebar-account-menu-${Math.random().toString(36).slice(2, 10)}`)
  const resolvedName = currentUser?.fullName ?? name
  const resolvedEmail = currentUser?.email ?? email
  const resolvedAvatarUrl = currentUser?.avatarUrl ?? null
  const resolvedInitials = currentUser?.fullName
    ? currentUser.fullName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    : initials
  const resolvedPlanLabel = workspace?.subscriptionPlan ? getWorkspacePlanLabel(workspace.subscriptionPlan) : plan

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleItemClick = (id) => {
    setOpen(false)
    if (id === 'logout' && isAuthenticated) {
      logout()
      navigate(ROUTES.login)
    } else if (id === 'settings') {
      if (location.pathname !== ROUTES.settings) {
        navigate(ROUTES.settings, {
          state: {
            backgroundLocation: location,
          },
        })
      }
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
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuIdRef.current}
      >
        {open && (
          <div
            id={menuIdRef.current}
            className={[
              menuStyles.menu,
              collapsed ? menuStyles.menuCollapsed : '',
            ].filter(Boolean).join(' ')}
            role="menu"
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
          </div>
        )}
      </SidebarUserCard>
    </div>
  )
}
