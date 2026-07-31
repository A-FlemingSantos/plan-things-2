import GitHubObjectIcon from './github/githubIcons.jsx'
import { formatGitHubRelativeTime } from './github/githubPanelFormat.js'
import {
  GITHUB_LINK_TYPE_LABELS,
  getGitHubItemIdentifier,
  getGitHubItemTitleLine,
} from './github/githubPanelTypes.js'

function buildGitHubLinkTargetLabel(item) {
  const typeLabel = GITHUB_LINK_TYPE_LABELS[item.type] ?? 'Item do GitHub'
  const identifier = getGitHubItemIdentifier(item)
  const title = getGitHubItemTitleLine(item)
  const headline = [typeLabel, identifier].filter(Boolean).join(' ')
  if (!title || title === identifier) return headline
  return `${headline} ${title}`
}

export default function CardModalActivityGitHubLink({
  styles,
  item,
  actor,
  variant = 'sidebar',
}) {
  const linkedAtLabel = formatGitHubRelativeTime(item.linkedAt) ?? 'recentemente'
  const targetLabel = buildGitHubLinkTargetLabel(item)
  const className = variant === 'preview'
    ? styles.cmActivityPreviewGitHubLink
    : styles.cmActivityGitHubLink

  return (
    <p className={className}>
      <GitHubObjectIcon
        type={item.type}
        status={item.status}
        className={styles.cmActivityGitHubLinkIcon}
      />
      <span className={styles.cmActivityGitHubLinkText}>
        <strong>{actor}</strong>
        {' vinculou '}
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer noopener"
          className={styles.cmActivityGitHubLinkTarget}
        >
          {targetLabel}
        </a>
        {item.repoFullName ? (
          <>
            {' em '}
            <span className={styles.cmActivityGitHubLinkRepo}>{item.repoFullName}</span>
          </>
        ) : null}
        {' · '}
        <span className={styles.cmActivityGitHubLinkTime}>{linkedAtLabel}</span>
      </span>
    </p>
  )
}
