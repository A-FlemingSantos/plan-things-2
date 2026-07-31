/**
 * Small inline SVG icon set for GitHub object types/states, matching the
 * hand-drawn style already used by GitHubContextBar (custom strokes instead
 * of a third icon library) so the panel stays visually consistent without
 * depending on exact lucide-react icon names.
 */

function IssueGlyph({ status }) {
  if (status === 'closed') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.4 8.2l1.8 1.8 3.4-3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>
  )
}

function PullRequestGlyph({ status }) {
  if (status === 'merged') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="5" cy="4" r="1.7" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="5" cy="12" r="1.7" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="11" cy="12" r="1.7" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 5.6V12M5 5.6C5 9 7.5 9.3 9.3 9.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="5" cy="4" r="1.7" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5" cy="12" r="1.7" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="11" cy="4" r="1.7" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 5.6V12M11 5.6V8.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {status === 'closed' ? (
        <path d="M9.4 2.6l3.2 3.2M12.6 2.6l-3.2 3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      ) : null}
    </svg>
  )
}

function BranchGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="5" cy="4" r="1.7" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5" cy="12" r="1.7" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="11" cy="6" r="1.7" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 5.6V10.4M5 5.6C5 8 7.2 8.2 11 7.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function CommitGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1.8 8h3.4M10.8 8h3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

const GLYPHS_BY_TYPE = {
  issue: IssueGlyph,
  pull_request: PullRequestGlyph,
  branch: BranchGlyph,
  commit: CommitGlyph,
}

/**
 * @param {{ type: import('./githubPanelTypes.js').GitHubLinkType, status?: import('./githubPanelTypes.js').GitHubLinkStatus, className?: string }} props
 */
export default function GitHubObjectIcon({ type, status, className }) {
  const Glyph = GLYPHS_BY_TYPE[type] ?? IssueGlyph
  return (
    <span className={className}>
      <Glyph status={status} />
    </span>
  )
}

export function GitHubExternalLinkGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6.5 3.5H3a1 1 0 0 0-1 1V13a1 1 0 0 0 1 1h8.5a1 1 0 0 0 1-1V9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 2.5H13.5V6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 3L7.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
