/**
 * Shared contracts for the CardModal GitHub panel.
 *
 * These typedefs describe the read-only GitHub objects the panel can render
 * (issue / pull request / branch / commit) and the link between a card and
 * one of those objects. Link/unlink and search are wired via props; summaries
 * use persisted link snapshots rather than live detail/diff fetches.
 */

/**
 * @typedef {'issue'|'pull_request'|'branch'|'commit'} GitHubLinkType
 */

/**
 * @typedef {'open'|'closed'|'merged'|'draft'} GitHubLinkStatus
 * Only meaningful for 'issue' (open | closed) and 'pull_request'
 * (open | closed | merged | draft).
 */

/**
 * @typedef {Object} GitHubLinkedItem
 * @property {string} id - Stable id for the link/result row (list key).
 * @property {GitHubLinkType} type
 * @property {string} repoFullName - e.g. "org/repo".
 * @property {string} title
 * @property {string} url - Canonical GitHub URL, used by "Abrir no GitHub".
 * @property {string} [number] - Human-readable number, e.g. "#128" (issue/PR).
 * @property {GitHubLinkStatus} [status] - Required for issue/pull_request.
 * @property {string} [authorName]
 * @property {string} [authorAvatarUrl]
 * @property {string} [createdAt] - ISO 8601 GitHub creation timestamp.
 * @property {string} [updatedAt] - ISO 8601 GitHub last-update timestamp.
 * @property {string} [committedAt] - commit only.
 * @property {string} [lastCommitAt] - branch only.
 * @property {string} [linkedAt] - ISO 8601 timestamp for when the item was linked to the card.
 * @property {string} [linkedByUserId] - Workspace member who created the link.
 * @property {string[]} [labelNames] - Rendered as plain chips, no fixed colors assumed.
 * @property {string} [bodyPreview] - Short plain-text preview of the description.
 * @property {number} [commentsCount]
 * @property {Array<{login?: string, name?: string}>} [assignees]
 * @property {{title?: string}} [milestone]
 * @property {string} [baseBranch] - pull_request only.
 * @property {string} [headBranch] - pull_request only.
 * @property {Array<{login?: string, name?: string, state?: string, status?: string}>} [reviewers]
 * @property {Array<{sha?: string, message?: string, title?: string, authorName?: string}>} [commits]
 * @property {Array<{name?: string, context?: string, conclusion?: string, state?: string, status?: string}>} [checks]
 * @property {{ additions?: number, deletions?: number, changedFiles?: number }} [diffStat] - pull_request/commit summary counters.
 * @property {boolean} [isDefaultBranch] - branch only.
 * @property {number} [aheadBy] - branch only.
 * @property {number} [behindBy] - branch only.
 * @property {string} [lastCommitSha] - branch only.
 * @property {string} [lastCommitMessage] - branch only.
 * @property {string} [sha] - commit only, short SHA (7+ chars).
 * @property {string} [message] - commit only, commit message (first line = title).
 * @property {string} [body] - Full description from link snapshot (issues/PRs).
 */

export const GITHUB_LINK_TYPE_OPTIONS = [
  { id: 'issue', label: 'Issues' },
  { id: 'pull_request', label: 'Pull requests' },
  { id: 'branch', label: 'Branches' },
  { id: 'commit', label: 'Commits' },
]

export const GITHUB_LINK_TYPE_LABELS = {
  issue: 'Issue',
  pull_request: 'Pull request',
  branch: 'Branch',
  commit: 'Commit',
}

export const GITHUB_LINK_STATUS_LABELS = {
  open: 'Aberta',
  closed: 'Fechada',
  merged: 'Mesclado',
  draft: 'Rascunho',
}

export function getGitHubItemStatusLabel(item) {
  if (!item?.status) return null
  return GITHUB_LINK_STATUS_LABELS[item.status] ?? null
}

export function getGitHubItemTitleLine(item) {
  if (!item) return ''
  if (item.type === 'commit') {
    const firstLine = (item.message ?? item.title ?? '').split('\n')[0]
    return firstLine
  }
  return item.title ?? ''
}

export function getGitHubItemIdentifier(item) {
  if (!item) return ''
  if (item.type === 'commit') return item.sha ? item.sha.slice(0, 7) : ''
  if (item.type === 'branch') return item.title ?? ''
  return item.number ?? ''
}
