import { useRef } from 'react'
import { Ellipsis } from 'lucide-react'
import { useAuthenticatedImageUrl } from '../../../../shared/hooks/useAuthenticatedImageUrl.js'
import PlanOptionsMenu from '../PlanOptionsMenu/PlanOptionsMenu.jsx'
import PlanRenameInput from '../PlanRenameInput/PlanRenameInput.jsx'
import { resolveCoverThemeClass } from '../workspaceCover/workspaceCoverUtils.js'
import styles from '../../pages/Workspace/Workspace.module.css'

export default function PlanCard({
  plan,
  view,
  onOpen,
  isActive,
  onMore,
  menuOpen,
  menuAnchorRect,
  onMenuAction,
  onMenuClose,
  isRenaming,
  renameDraft,
  renameBusy,
  onRenameDraftChange,
  onRenameCommit,
  onRenameCancel,
}) {
  const handleKeyDown = (event) => {
    if (isRenaming) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen?.()
    }
  }

  const coverThemeClassName = resolveCoverThemeClass(styles, plan.coverThemeId)
  const rawCoverImageUrl = plan.coverImageThumb ?? plan.coverImage ?? null
  const isImageCover = Boolean(rawCoverImageUrl)
  const resolvedCoverImageUrl = useAuthenticatedImageUrl(isImageCover ? rawCoverImageUrl : null)
  const coverClassName = [
    styles.planCover,
    coverThemeClassName,
    isImageCover ? styles.planCoverImage : '',
  ].filter(Boolean).join(' ')
  const coverStyle = isImageCover && resolvedCoverImageUrl
    ? {
        '--cover-fallback': plan.cover,
        '--cover-bg': `url(${resolvedCoverImageUrl})`,
      }
    : {
        '--cover-fallback': plan.cover,
      }
  const menuAnchorRef = useRef(null)

  const actions = (
    <div className={`${styles.planCardActions} ${menuOpen ? styles.planCardActionsOpen : ''}`}>
      <button
        ref={menuAnchorRef}
        type="button"
        className={`${styles.planCardActionBtn} ${menuOpen ? styles.planCardActionBtnActive : ''}`}
        aria-label="Mais opções"
        title="Mais opções"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onMouseDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onMore?.(event.currentTarget.getBoundingClientRect())
        }}
      >
        <Ellipsis size={16} strokeWidth={1.6} />
      </button>
      {menuOpen && (
        <PlanOptionsMenu
          anchorRect={menuAnchorRect}
          anchorRef={menuAnchorRef}
          onAction={onMenuAction}
          onClose={onMenuClose}
        />
      )}
    </div>
  )

  if (view === 'list') {
    return (
      <div
        className={`${styles.listCard} ${isActive ? styles.listCardActive : ''}`}
        onClick={isRenaming ? undefined : onOpen}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        {actions}
        <div className={styles.listCardLeft}>
          <div
            className={`${styles.listCover} ${coverClassName}`}
            style={coverStyle}
            aria-hidden="true"
          />
          <div className={styles.listInfo}>
            <div className={styles.listNameRow}>
              {isRenaming ? (
                <PlanRenameInput
                  value={renameDraft}
                  busy={renameBusy}
                  onChange={onRenameDraftChange}
                  onCommit={onRenameCommit}
                  onCancel={onRenameCancel}
                />
              ) : (
                <p className={styles.listName}>{plan.name}</p>
              )}
              {plan.tasks > 0 && (
                <span className={styles.listTaskCount} aria-label={`${plan.tasks} tarefas`}>
                  {plan.tasks}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${styles.planCard} ${isActive ? styles.planCardActive : ''}`}
      onClick={isRenaming ? undefined : onOpen}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {actions}
      <div
        className={`${styles.planCardCover} ${coverClassName}`}
        style={coverStyle}
        aria-hidden="true"
      />
      <div className={styles.cardBody}>
        <div className={styles.cardNameRow}>
          {isRenaming ? (
            <PlanRenameInput
              value={renameDraft}
              busy={renameBusy}
              onChange={onRenameDraftChange}
              onCommit={onRenameCommit}
              onCancel={onRenameCancel}
            />
          ) : (
            <h3 className={styles.cardName}>{plan.name}</h3>
          )}
          {plan.tasks > 0 && (
            <span className={styles.cardTaskCount} aria-label={`${plan.tasks} tarefas`}>
              {plan.tasks}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
