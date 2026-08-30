import { useEffect, useId, useRef, useState } from 'react'
import {
  AlignStartHorizontal,
  AlignStartVertical,
  Blocks,
  Bug,
  ChevronDown,
  EllipsisVertical,
  Funnel,
  Globe,
  Route,
  Share,
} from 'lucide-react'
import { SiGithub } from 'react-icons/si'
import MemberAvatarStack from '../MemberAvatarStack/MemberAvatarStack.jsx'
import PlanSharePopover from '../PlanSharePopover/PlanSharePopover.jsx'
import PlanGitHubIntegrationModal from '../PlanGitHubIntegrationModal/PlanGitHubIntegrationModal.jsx'
import styles from './BoardHeader.module.css'

const ICON_SIZE = 15
const ICON_STROKE = 1.75

export const BOARD_VIEW_MODES = [
  { id: 'kanban', label: 'Kanban', Icon: AlignStartHorizontal },
  { id: 'timeline', label: 'Timeline', Icon: AlignStartVertical },
  { id: 'bugtrack', label: 'Bugtrack', Icon: Bug },
  { id: 'actions', label: 'Actions', Icon: Route },
]

const LEADING_ACTION_ITEMS = [
  { id: 'blocks', Icon: Blocks, label: 'Blocos' },
  { id: 'globe', Icon: Globe, label: 'Globo' },
  { id: 'funnel', Icon: Funnel, label: 'Filtros' },
]

const TRAILING_ACTION_ITEMS = [
  { id: 'more', Icon: EllipsisVertical, label: 'Mais opções' },
]

export default function BoardHeader({
  planName = 'Plano',
  plan = null,
  viewMode = 'kanban',
  onViewModeChange,
  members = [],
  isMembersLoading = false,
  isBackendDriven = false,
  accessToken,
  onRefreshPlanDetails,
  onNotify,
  githubIntegration = null,
  githubOpen: controlledGitHubOpen,
  onGitHubOpenChange,
}) {
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isGitHubOpen, setIsGitHubOpen] = useState(false)
  const viewMenuId = useId()
  const viewMenuWrapRef = useRef(null)
  const shareMenuWrapRef = useRef(null)
  const githubButtonRef = useRef(null)
  const githubOpen = controlledGitHubOpen ?? isGitHubOpen
  const setGitHubOpen = (next) => {
    const value = typeof next === 'function' ? next(githubOpen) : next
    if (controlledGitHubOpen === undefined) setIsGitHubOpen(value)
    onGitHubOpenChange?.(value)
  }

  useEffect(() => {
    if (!isViewMenuOpen && !isShareOpen && !githubOpen) return undefined

    const handlePointerDown = (event) => {
      if (viewMenuWrapRef.current?.contains(event.target)) return
      if (shareMenuWrapRef.current?.contains(event.target)) return
      if (githubButtonRef.current?.contains(event.target)) return
      setIsViewMenuOpen(false)
      setIsShareOpen(false)
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsViewMenuOpen(false)
        setIsShareOpen(false)
        setGitHubOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [githubOpen, isShareOpen, isViewMenuOpen])

  const activeViewMode = BOARD_VIEW_MODES.find((mode) => mode.id === viewMode) ?? BOARD_VIEW_MODES[0]
  const ActiveViewIcon = activeViewMode.Icon

  const handleSelectViewMode = (nextViewMode) => {
    onViewModeChange?.(nextViewMode)
    setIsViewMenuOpen(false)
    setIsShareOpen(false)
    setGitHubOpen(false)
  }

  const toggleSharePopover = () => {
    setIsShareOpen((open) => !open)
    setIsViewMenuOpen(false)
    setGitHubOpen(false)
  }

  const sharePlan = plan ?? { name: planName }
  const connectedRepos = githubIntegration?.connectedRepos ?? []
  const primaryConnectedRepo = connectedRepos[0] ?? null
  const hasConnectedRepo = Boolean(primaryConnectedRepo?.fullName)
  const connectedRepoLabel = hasConnectedRepo
    ? (connectedRepos.length > 1
      ? `${primaryConnectedRepo.fullName} +${connectedRepos.length - 1}`
      : primaryConnectedRepo.fullName)
    : null

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div ref={viewMenuWrapRef} className={styles.viewMenuWrap}>
          <button
            type="button"
            className={`${styles.viewIconButton} ${isViewMenuOpen ? styles.viewIconButtonOpen : ''}`}
            aria-haspopup="menu"
            aria-controls={viewMenuId}
            aria-expanded={isViewMenuOpen}
            aria-label={`Alterar visualização (${activeViewMode.label})`}
            onClick={() => {
              setIsShareOpen(false)
              setIsViewMenuOpen((open) => !open)
            }}
          >
            <span className={styles.viewIconButtonIcon} aria-hidden="true">
              <ActiveViewIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            </span>
            <span className={styles.viewIconButtonMeta}>
              <span className={styles.viewIconButtonLabel}>{activeViewMode.label}</span>
              <span className={styles.viewIconButtonChevron} aria-hidden="true">
                <ChevronDown size={12} strokeWidth={ICON_STROKE} />
              </span>
            </span>
          </button>

          {isViewMenuOpen ? (
            <div
              id={viewMenuId}
              className={styles.viewMenu}
              role="menu"
              aria-label="Modos de visualização do board"
            >
              {BOARD_VIEW_MODES.map(({ id, label, Icon }) => {
                const isActive = viewMode === id

                return (
                  <button
                    key={id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    className={`${styles.viewMenuItem} ${isActive ? styles.viewMenuItemActive : ''}`}
                    onClick={() => handleSelectViewMode(id)}
                  >
                    <span className={styles.viewMenuItemIcon} aria-hidden="true">
                      <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                    </span>
                    <span className={styles.viewMenuItemLabel}>{label}</span>
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>

        <span className={styles.titleDivider} aria-hidden="true" />
        <h1 className={styles.planName}>{planName}</h1>
      </div>

      <div className={styles.actions}>
        {members.length > 0 ? (
          <>
            <MemberAvatarStack members={members} size={32} overlap={11} />
            <span className={styles.actionsDivider} aria-hidden="true" />
          </>
        ) : null}
        {LEADING_ACTION_ITEMS.map(({ id, Icon, label }) => {
          if (id === 'blocks') {
            const githubButtonClassName = hasConnectedRepo
              ? `${styles.githubIntegrationButton} ${githubOpen ? styles.githubIntegrationButtonOpen : ''}`
              : styles.iconButton
            const githubAriaLabel = hasConnectedRepo
              ? `Integrações do GitHub (${connectedRepoLabel})`
              : 'Integrações do GitHub'

            return (
              <button
                key={id}
                ref={githubButtonRef}
                type="button"
                className={githubButtonClassName}
                aria-label={githubAriaLabel}
                aria-haspopup="dialog"
                aria-expanded={githubOpen}
                onClick={() => {
                  setGitHubOpen((open) => !open)
                  setIsViewMenuOpen(false)
                  setIsShareOpen(false)
                }}
              >
                {hasConnectedRepo ? (
                  <>
                    <SiGithub size={ICON_SIZE} aria-hidden="true" />
                    <span className={styles.githubIntegrationRepoName} title={connectedRepoLabel}>
                      {connectedRepoLabel}
                    </span>
                  </>
                ) : (
                  <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                )}
              </button>
            )
          }

          return (
            <button
              key={id}
              type="button"
              className={styles.iconButton}
              aria-label={label}
            >
              <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            </button>
          )
        })}
        <PlanGitHubIntegrationModal
          open={githubOpen}
          onClose={() => setGitHubOpen(false)}
          anchorRef={githubButtonRef}
          planName={planName}
          {...githubIntegration}
        />
        <div ref={shareMenuWrapRef} className={styles.shareMenuWrap}>
          <button
            type="button"
            className={`${styles.shareButton} ${isShareOpen ? styles.shareButtonOpen : ''}`}
            aria-haspopup="dialog"
            aria-expanded={isShareOpen}
            onClick={toggleSharePopover}
          >
            <Share size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
            <span>Compartilhar</span>
          </button>

          <PlanSharePopover
            open={isShareOpen}
            plan={sharePlan}
            members={members}
            isMembersLoading={isMembersLoading}
            isBackendDriven={isBackendDriven}
            accessToken={accessToken}
            onRefreshPlanDetails={onRefreshPlanDetails}
            onNotify={onNotify}
          />
        </div>
        {TRAILING_ACTION_ITEMS.map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            className={styles.iconButton}
            aria-label={label}
          >
            <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          </button>
        ))}
      </div>
    </header>
  )
}
