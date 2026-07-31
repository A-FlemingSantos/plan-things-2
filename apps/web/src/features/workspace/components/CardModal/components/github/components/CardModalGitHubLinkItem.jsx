import { ChevronRight, Link2, Loader, Trash2 } from 'lucide-react'
import GitHubObjectIcon from '../githubIcons.jsx'
import {
  getGitHubItemIdentifier,
  getGitHubItemStatusLabel,
  getGitHubItemTitleLine,
} from '../githubPanelTypes.js'
import { formatGitHubRelativeTime } from '../githubPanelFormat.js'
import CardModalGitHubItemBody from './CardModalGitHubItemBody.jsx'

const STATUS_BADGE_CLASS = {
  open: 'statusBadgeOpen',
  closed: 'statusBadgeClosed',
  merged: 'statusBadgeMerged',
  draft: 'statusBadgeDraft',
}

const TYPE_ICON_CLASS = {
  open: 'itemTypeIconOpen',
  closed: 'itemTypeIconClosed',
  merged: 'itemTypeIconMerged',
  draft: 'itemTypeIconDraft',
}

function StatusBadge({ styles, item }) {
  const label = getGitHubItemStatusLabel(item)
  if (!label) return null
  const badgeClass = STATUS_BADGE_CLASS[item.status] ?? 'statusBadgeDraft'
  return <span className={`${styles.statusBadge} ${styles[badgeClass]}`}>{label}</span>
}

/**
 * Common base layout for every linked/result GitHub object: icon, title,
 * repo + author + time meta row, a trailing action (link or unlink) and an
 * expand toggle that reveals the type-specific read-only body.
 *
 * @param {{
 *   styles: Record<string, string>,
 *   item: import('../githubPanelTypes.js').GitHubLinkedItem,
 *   variant: 'linked'|'result',
 *   expanded?: boolean,
 *   onToggleExpanded?: (id: string) => void,
 *   canManage?: boolean,
 *   onLinkItem?: (item: import('../githubPanelTypes.js').GitHubLinkedItem) => void,
 *   isLinking?: boolean,
 *   isAlreadyLinked?: boolean,
 *   onUnlinkItem?: (item: import('../githubPanelTypes.js').GitHubLinkedItem) => void,
 *   isUnlinking?: boolean,
 *   diffState?: import('../githubPanelTypes.js').GitHubDiffLoadState,
 *   diffSummary?: import('../githubPanelTypes.js').GitHubCommitDiffSummary,
 *   onLoadCommitDiff?: (item: import('../githubPanelTypes.js').GitHubLinkedItem) => void,
 *   onLoadMoreDetails?: (item: import('../githubPanelTypes.js').GitHubLinkedItem) => void,
 * }} props
 */
export default function CardModalGitHubLinkItem({
  styles,
  item,
  variant,
  expanded = false,
  onToggleExpanded,
  canManage = true,
  onLinkItem,
  isLinking = false,
  isAlreadyLinked = false,
  onUnlinkItem,
  isUnlinking = false,
  diffState,
  diffSummary,
  onLoadCommitDiff,
  onLoadMoreDetails,
}) {
  const identifier = getGitHubItemIdentifier(item)
  const titleLine = getGitHubItemTitleLine(item)
  const relativeTime = formatGitHubRelativeTime(item.updatedAt)
  const iconClass = item.status ? styles[TYPE_ICON_CLASS[item.status]] : ''

  return (
    <div className={`${styles.item} ${expanded ? styles.itemExpanded : ''}`}>
      <div
        className={styles.itemHeader}
      >
        <GitHubObjectIcon
          type={item.type}
          status={item.status}
          className={`${styles.itemTypeIcon} ${iconClass}`}
        />

        <span className={styles.itemBody}>
          <span className={styles.itemTitleRow}>
            <span className={styles.itemTitle} title={titleLine}>{titleLine}</span>
            {identifier ? <span className={styles.itemNumber}>{identifier}</span> : null}
          </span>
          <span className={styles.itemMetaRow}>
            <span className={styles.itemMetaRepo}>{item.repoFullName}</span>
            {item.authorName ? (
              <>
                <span className={styles.itemMetaSep} aria-hidden="true">·</span>
                <span>{item.authorName}</span>
              </>
            ) : null}
            {relativeTime ? (
              <>
                <span className={styles.itemMetaSep} aria-hidden="true">·</span>
                <span>{relativeTime}</span>
              </>
            ) : null}
          </span>
        </span>

        <span className={styles.itemActions}>
          <StatusBadge styles={styles} item={item} />

          {variant === 'linked' && canManage ? (
            <button
              type="button"
              className={`${styles.itemActionBtn} ${styles.itemActionDanger}`}
              onClick={() => onUnlinkItem?.(item)}
              disabled={isUnlinking}
              aria-label={`Remover vínculo com ${titleLine}`}
              title="Remover vínculo"
            >
              {isUnlinking ? (
                <Loader size={13} strokeWidth={1.75} className={styles.stateIconSpinning} aria-hidden="true" />
              ) : (
                <Trash2 size={13} strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
          ) : null}

          {variant === 'result' && canManage ? (
            <button
              type="button"
              className={styles.itemLinkBtn}
              onClick={() => onLinkItem?.(item)}
              disabled={isLinking || isAlreadyLinked}
            >
              {isAlreadyLinked ? (
                'Vinculado'
              ) : isLinking ? (
                <Loader size={12} strokeWidth={1.75} className={styles.stateIconSpinning} aria-hidden="true" />
              ) : (
                <>
                  <Link2 size={11} strokeWidth={1.75} aria-hidden="true" /> Vincular
                </>
              )}
            </button>
          ) : null}

          <button
            type="button"
            className={styles.itemActionBtn}
            onClick={() => onToggleExpanded?.(item.id)}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Recolher' : 'Expandir'} detalhes de ${titleLine}`}
          >
            <span className={`${styles.itemChevron} ${expanded ? styles.itemChevronOpen : ''}`} aria-hidden="true">
              <ChevronRight size={14} strokeWidth={1.75} />
            </span>
          </button>
        </span>
      </div>

      {expanded ? (
        <CardModalGitHubItemBody
          styles={styles}
          item={item}
          diffState={diffState}
          diffSummary={diffSummary}
          onLoadDiff={onLoadCommitDiff ? () => onLoadCommitDiff(item) : undefined}
          onLoadMoreDetails={onLoadMoreDetails ? () => onLoadMoreDetails(item) : undefined}
        />
      ) : null}
    </div>
  )
}
