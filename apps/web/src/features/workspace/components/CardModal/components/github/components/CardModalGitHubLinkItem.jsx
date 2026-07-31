import { Check, Loader, Plus, Trash2 } from 'lucide-react'
import GitHubObjectIcon, { GitHubExternalLinkGlyph } from '../githubIcons.jsx'
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
 * Compact row for a GitHub object. Linked items show an inline summary below
 * the header; search results stay header-only so the panel does not mirror
 * GitHub's full object views.
 *
 * @param {{
 *   styles: Record<string, string>,
 *   item: import('../githubPanelTypes.js').GitHubLinkedItem,
 *   variant: 'linked'|'result',
 *   canManage?: boolean,
 *   onLinkItem?: (item: import('../githubPanelTypes.js').GitHubLinkedItem) => void,
 *   isLinking?: boolean,
 *   isAlreadyLinked?: boolean,
 *   onUnlinkItem?: (item: import('../githubPanelTypes.js').GitHubLinkedItem) => void,
 *   isUnlinking?: boolean,
 * }} props
 */
export default function CardModalGitHubLinkItem({
  styles,
  item,
  variant,
  canManage = true,
  onLinkItem,
  isLinking = false,
  isAlreadyLinked = false,
  onUnlinkItem,
  isUnlinking = false,
}) {
  const identifier = getGitHubItemIdentifier(item)
  const titleLine = getGitHubItemTitleLine(item)
  const relativeTime = formatGitHubRelativeTime(item.updatedAt)
  const iconClass = item.status ? styles[TYPE_ICON_CLASS[item.status]] : ''

  return (
    <div className={styles.item}>
      <div className={styles.itemHeader}>
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

          <a
            className={styles.itemActionBtn}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Abrir ${titleLine} no GitHub`}
            title="Abrir no GitHub"
          >
            <GitHubExternalLinkGlyph />
          </a>

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
              aria-label={isAlreadyLinked ? `Já vinculado: ${titleLine}` : `Vincular ${titleLine}`}
              title={isAlreadyLinked ? 'Vinculado' : 'Vincular'}
            >
              {isAlreadyLinked ? (
                <Check size={13} strokeWidth={1.75} aria-hidden="true" />
              ) : isLinking ? (
                <Loader size={13} strokeWidth={1.75} className={styles.stateIconSpinning} aria-hidden="true" />
              ) : (
                <Plus size={13} strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
          ) : null}
        </span>
      </div>

      {variant === 'linked' ? (
        <CardModalGitHubItemBody styles={styles} item={item} />
      ) : null}
    </div>
  )
}
