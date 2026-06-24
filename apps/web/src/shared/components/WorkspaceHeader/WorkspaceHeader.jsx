import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Settings } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext.jsx'
import { usePreferences } from '../../../features/preferences/context/PreferencesContext.jsx'
import {
  resolveKanbanAccentColor,
  resolveKanbanAccentForeground,
} from '../../../features/workspace/data/kanbanColorPalette.js'
import InviteNotifications from '../../../features/workspace/components/InviteNotifications/InviteNotifications.jsx'
import { ROUTES } from '../../config/routes.js'
import {
  BoardsIcon,
  MembersIcon,
  PlusMiniIcon,
  SparkIcon,
  TemplatesIcon,
  WorkspaceChevronDownIcon,
  WorkspaceHomeIcon,
  WorkspaceSettingsIcon,
  WorkspaceTitleIcon,
} from '../icons/index.js'
import AuthenticatedAvatar from '../AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import PlanPageHeader from '../PlanPageHeader/PlanPageHeader.jsx'
import SidebarAccountMenu from '../SidebarAccountMenu/SidebarAccountMenu.jsx'
import styles from './WorkspaceHeader.module.css'

export default function WorkspaceHeader({
  title = 'Workspace',
  icon = <WorkspaceTitleIcon />,
  centerContent = null,
  sticky = false,
  compact = false,
  className = '',
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, workspace } = useAuth()
  const { localPreferences } = usePreferences()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isWorkspaceSectionExpanded, setIsWorkspaceSectionExpanded] = useState(true)
  const titleMenuId = useId()
  const workspaceSectionContentId = useId()
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
    { id: 'home', label: 'Início', Icon: WorkspaceHomeIcon },
  ]), [])

  const workspaceMenuItems = useMemo(() => ([
    { id: 'workspace-boards', label: 'Quadros', Icon: BoardsIcon },
    { id: 'workspace-members', label: 'Membros', Icon: MembersIcon, trailing: <PlusMiniIcon /> },
    { id: 'workspace-settings', label: 'Configurações', Icon: WorkspaceSettingsIcon },
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
          <WorkspaceChevronDownIcon />
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
              aria-expanded={isWorkspaceSectionExpanded}
              aria-controls={workspaceSectionContentId}
              onClick={() => setIsWorkspaceSectionExpanded((expanded) => !expanded)}
            >
              <span className={styles.workspaceHeaderMenuWorkspaceBadge} aria-hidden="true">
                {workspaceBadgeLabel}
              </span>
              <span className={styles.workspaceHeaderMenuWorkspaceMeta}>
                <span className={styles.workspaceHeaderMenuWorkspaceName}>{workspaceLabel}</span>
                <span className={styles.workspaceHeaderMenuWorkspaceType}>Pessoal</span>
              </span>
              <span className={styles.workspaceHeaderMenuWorkspaceChevron} aria-hidden="true">
                <WorkspaceChevronDownIcon />
              </span>
            </button>

            <div
              id={workspaceSectionContentId}
              className={`${styles.workspaceHeaderMenuSubListShell} ${isWorkspaceSectionExpanded ? '' : styles.workspaceHeaderMenuSubListShellCollapsed}`}
            >
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
      centerContent={centerContent}
      sticky={sticky}
      tone="solid"
      titleSize="small"
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
            <Settings size={14} strokeWidth={1.75} aria-hidden="true" />
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
