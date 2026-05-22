import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext.jsx'
import { usePreferences } from '../../../features/preferences/context/PreferencesContext.jsx'
import {
  resolveKanbanAccentColor,
  resolveKanbanAccentForeground,
} from '../../../features/workspace/data/kanbanColorPalette.js'
import InviteNotifications from '../../../features/workspace/components/InviteNotifications/InviteNotifications.jsx'
import { ROUTES } from '../../config/routes.js'
import AuthenticatedAvatar from '../AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import PlanPageHeader from '../PlanPageHeader/PlanPageHeader.jsx'
import SidebarAccountMenu from '../SidebarAccountMenu/SidebarAccountMenu.jsx'
import styles from './WorkspaceHeader.module.css'

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M5.9 1.6h2.2l.4 1.2c.2.1.5.2.7.3l1.1-.5 1.5 1.5-.5 1.1c.1.2.2.5.3.7l1.2.4v2.2l-1.2.4c-.1.2-.2.5-.3.7l.5 1.1-1.5 1.5-1.1-.5c-.2.1-.5.2-.7.3l-.4 1.2H5.9l-.4-1.2a4 4 0 0 1-.7-.3l-1.1.5-1.5-1.5.5-1.1a4 4 0 0 1-.3-.7l-1.2-.4V5.9l1.2-.4c.1-.2.2-.5.3-.7l-.5-1.1 1.5-1.5 1.1.5c.2-.1.5-.2.7-.3z"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="7" r="1.75" stroke="currentColor" strokeWidth="1.15" />
    </svg>
  )
}

function WorkspaceTitleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="5.1" cy="4.9" r="1.75" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="10.9" cy="4.9" r="1.75" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="5.1" cy="10.7" r="1.75" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="10.9" cy="10.7" r="1.75" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M3 4.5 6 7.5l3-3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BoardsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="3" width="4" height="10" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
      <rect x="6.4" y="3" width="4" height="6.6" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
      <rect x="11.3" y="3" width="3.2" height="8.5" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function TemplatesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8.6 2.3H13a1.5 1.5 0 0 1 1.5 1.5v8.4a1.5 1.5 0 0 1-1.5 1.5H4.6a1.5 1.5 0 0 1-1.5-1.5V7.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.3 2.8h4.4M4.5 1v4.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.2 7.1 8 2.6l5.8 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.6 6.6v6.2h8.8V6.6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6.5 12.8V8.9h3v3.9" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function MembersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.4 13c0-1.95 1.63-3.4 3.6-3.4s3.6 1.45 3.6 3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11 4.2a1.8 1.8 0 1 1 0 3.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10.8 9.9c1.5.2 2.8 1.3 2.8 3.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function PlusMiniIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8.7 1.8 4.9 7.3h2.5l-.7 6.1 4-5.6H8.2l.5-6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function WorkspaceHeader({
  title = 'Workspace',
  icon = <WorkspaceTitleIcon />,
  sticky = false,
  compact = false,
  className = '',
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, workspace } = useAuth()
  const { localPreferences } = usePreferences()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const titleMenuId = useId()
  const titleMenuWrapRef = useRef(null)

  const openSettingsSection = (section = null) => {
    const params = new URLSearchParams()
    if (section) params.set('section', section)
    navigate(`${ROUTES.settings}${params.toString() ? `?${params.toString()}` : ''}`)
  }

  useEffect(() => {
    if (!isMenuOpen) return undefined

    const handlePointerDown = (event) => {
      if (titleMenuWrapRef.current?.contains(event.target)) return
      setIsMenuOpen(false)
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname, location.search, location.hash])

  const currentPrimaryItem = useMemo(() => (
    location.pathname.startsWith(ROUTES.workspaceBoard) ? 'boards' : 'home'
  ), [location.pathname])

  const topMenuItems = useMemo(() => ([
    { id: 'boards', label: 'Quadros', Icon: BoardsIcon },
    { id: 'templates', label: 'Templates', Icon: TemplatesIcon },
    { id: 'home', label: 'Início', Icon: HomeIcon },
  ]), [])

  const workspaceMenuItems = useMemo(() => ([
    { id: 'workspace-boards', label: 'Quadros', Icon: BoardsIcon },
    { id: 'workspace-members', label: 'Membros', Icon: MembersIcon, trailing: <PlusMiniIcon /> },
    { id: 'workspace-settings', label: 'Configurações', Icon: SettingsIcon },
  ]), [])

  const workspaceLabel = workspace?.name?.trim() || 'Área de trabalho pessoal'
  const workspaceBadgeLabel = (
    workspaceLabel.match(/[\p{L}\p{N}]/u)?.[0]
    || currentUser?.fullName?.match(/[\p{L}\p{N}]/u)?.[0]
    || 'W'
  ).toUpperCase()

  const handlePlaceholderMenuAction = () => {
    setIsMenuOpen(false)
  }

  const accentPreference = localPreferences?.kanbanAccentColor ?? ''
  const titleMenuAccentStyle = {
    '--workspace-header-accent': accentPreference
      ? resolveKanbanAccentColor(accentPreference)
      : 'var(--text-1)',
    '--workspace-header-accent-foreground': accentPreference
      ? resolveKanbanAccentForeground(accentPreference)
      : 'var(--text-inverse)',
  }

  const titleContent = (
    <span
      ref={titleMenuWrapRef}
      className={styles.workspaceHeaderTitleMenuWrap}
      style={titleMenuAccentStyle}
    >
      <button
        type="button"
        className={styles.workspaceHeaderTitleButton}
        aria-haspopup="dialog"
        aria-controls={titleMenuId}
        aria-expanded={isMenuOpen}
        aria-label={`Abrir menu da Workspace em ${title}`}
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        {icon ? <span className={styles.workspaceHeaderTitleButtonIcon}>{icon}</span> : null}
        <span className={styles.workspaceHeaderTitleButtonLabel}>{title}</span>
        <span
          className={`${styles.workspaceHeaderTitleButtonChevron} ${isMenuOpen ? styles.workspaceHeaderTitleButtonChevronOpen : ''}`}
          aria-hidden="true"
        >
          <ChevronDownIcon />
        </span>
      </button>

      {isMenuOpen ? (
        <div
          id={titleMenuId}
          className={styles.workspaceHeaderMenu}
          role="dialog"
          aria-modal="false"
          aria-label="Menu principal da Workspace"
        >
          <div className={styles.workspaceHeaderMenuPrimaryList}>
            {topMenuItems.map(({ id, label, Icon }) => {
              const isActive = id === currentPrimaryItem

              return (
                <button
                  key={id}
                  type="button"
                  className={`${styles.workspaceHeaderMenuPrimaryItem} ${isActive ? styles.workspaceHeaderMenuPrimaryItemActive : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={handlePlaceholderMenuAction}
                >
                  <span className={styles.workspaceHeaderMenuItemIcon} aria-hidden="true">
                    <Icon />
                  </span>
                  <span>{label}</span>
                </button>
              )
            })}
          </div>

          <div className={styles.workspaceHeaderMenuDivider} />

          <section className={styles.workspaceHeaderMenuSection} aria-label="Área de trabalho">
            <span className={styles.workspaceHeaderMenuSectionLabel}>Área de trabalho</span>

            <button
              type="button"
              className={styles.workspaceHeaderMenuWorkspaceCard}
              onClick={handlePlaceholderMenuAction}
            >
              <span className={styles.workspaceHeaderMenuWorkspaceBadge} aria-hidden="true">
                {workspaceBadgeLabel}
              </span>
              <span className={styles.workspaceHeaderMenuWorkspaceMeta}>
                <span className={styles.workspaceHeaderMenuWorkspaceName}>{workspaceLabel}</span>
                <span className={styles.workspaceHeaderMenuWorkspaceType}>Pessoal</span>
              </span>
              <span className={styles.workspaceHeaderMenuWorkspaceChevron} aria-hidden="true">
                <ChevronDownIcon />
              </span>
            </button>

            <div className={styles.workspaceHeaderMenuSubList}>
              {workspaceMenuItems.map(({ id, label, Icon, trailing = null }) => (
                <button
                  key={id}
                  type="button"
                  className={styles.workspaceHeaderMenuSubItem}
                  onClick={handlePlaceholderMenuAction}
                >
                  <span className={styles.workspaceHeaderMenuItemIcon} aria-hidden="true">
                    <Icon />
                  </span>
                  <span className={styles.workspaceHeaderMenuSubItemLabel}>{label}</span>
                  {trailing ? (
                    <span className={styles.workspaceHeaderMenuTrailing} aria-hidden="true">
                      {trailing}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>

          <div className={styles.workspaceHeaderMenuPromo}>
            <div className={styles.workspaceHeaderMenuPromoBody}>
              <p className={styles.workspaceHeaderMenuPromoTitle}>Teste o Plan Things Premium</p>
              <p className={styles.workspaceHeaderMenuPromoText}>
                Desbloqueie automações, Intelligence expandido e organização avançada em uma única área.
              </p>
              <button
                type="button"
                className={styles.workspaceHeaderMenuPromoAction}
                onClick={handlePlaceholderMenuAction}
              >
                Disponível em breve
              </button>
            </div>
            <span className={styles.workspaceHeaderMenuPromoMark} aria-hidden="true">
              <SparkIcon />
            </span>
          </div>
        </div>
      ) : null}
    </span>
  )

  const headerClassName = [
    styles.workspaceHeader,
    compact ? styles.workspaceHeaderCompact : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <PlanPageHeader
      title={title}
      titleContent={titleContent}
      sticky={sticky}
      tone="solid"
      titleSize="medium"
      className={headerClassName}
      actions={(
        <div className={styles.workspaceHeaderActions}>
          <InviteNotifications
            wrapClassName={styles.workspaceHeaderNotificationWrap}
            triggerClassName={styles.workspaceHeaderIconButton}
            badgeClassName={styles.workspaceHeaderNotificationBadge}
            panelClassName={styles.workspaceHeaderNotificationsPanel}
          />
          <button
            type="button"
            className={styles.workspaceHeaderIconButton}
            aria-label="Abrir configurações da Workspace"
            onClick={() => openSettingsSection('workspace')}
          >
            <SettingsIcon />
          </button>
          <SidebarAccountMenu
            styles={styles}
            collapsed
            menuPlacement="below"
            renderTrigger={({ resolvedName, resolvedAvatarUrl, resolvedInitials, triggerProps }) => (
              <button
                {...triggerProps}
                className={styles.workspaceHeaderProfileButton}
                aria-label="Abrir menu da conta"
              >
                <AuthenticatedAvatar
                  avatarUrl={resolvedAvatarUrl}
                  className={styles.workspaceHeaderAvatar}
                  imageClassName={styles.workspaceHeaderAvatarImage}
                  alt=""
                  title={resolvedName}
                  fallback={(
                    <span className={styles.workspaceHeaderAvatarFallback}>
                      {resolvedInitials}
                    </span>
                  )}
                />
              </button>
            )}
          />
        </div>
      )}
    />
  )
}
