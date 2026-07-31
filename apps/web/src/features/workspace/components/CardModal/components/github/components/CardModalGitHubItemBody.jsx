import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { formatGitHubDiffStat } from '../githubPanelFormat.js'

function ItemDescription({ styles, item }) {
  const body = item.body ?? item.bodyPreview ?? (item.type === 'commit' ? item.message : null)
  if (!body) return null
  if (item.type === 'commit') {
    return <p className={styles.itemDescription}>{body}</p>
  }
  return (
    <div className={styles.itemDescription}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {body}
      </ReactMarkdown>
    </div>
  )
}

function ItemLabels({ styles, item }) {
  if (!item.labelNames?.length) return null
  return (
    <div className={styles.itemLabelRow}>
      {item.labelNames.map((label) => (
        <span key={label} className={styles.itemLabelChip}>{label}</span>
      ))}
    </div>
  )
}

function DiffStatRow({ styles, diffStat }) {
  const stat = formatGitHubDiffStat(diffStat)
  if (!stat) return null
  return (
    <div className={styles.diffStatRow}>
      <span className={styles.diffAdditions}>+{stat.additions}</span>
      <span className={styles.diffDeletions}>-{stat.deletions}</span>
      <span className={styles.diffFiles}>{stat.changedFiles} arquivo{stat.changedFiles === 1 ? '' : 's'}</span>
    </div>
  )
}

function IssueBody({ styles, item }) {
  return (
    <>
      <ItemDescription styles={styles} item={item} />
      <ItemLabels styles={styles} item={item} />
      <div className={styles.itemFactsGrid}>
        {item.assignees?.length ? (
          <div className={styles.itemFact}>
            <span className={styles.itemFactLabel}>Responsáveis</span>
            <span className={styles.itemFactValue}>{item.assignees.map((entry) => entry.login ?? entry.name ?? entry).join(', ')}</span>
          </div>
        ) : null}
        {item.milestone?.title ? (
          <div className={styles.itemFact}>
            <span className={styles.itemFactLabel}>Milestone</span>
            <span className={styles.itemFactValue}>{item.milestone.title}</span>
          </div>
        ) : null}
        {typeof item.commentsCount === 'number' ? (
          <div className={styles.itemFact}>
            <span className={styles.itemFactLabel}>Comentários</span>
            <span className={styles.itemFactValue}>{item.commentsCount}</span>
          </div>
        ) : null}
        {item.createdAt ? (
          <div className={styles.itemFact}>
            <span className={styles.itemFactLabel}>Criada em</span>
            <span className={styles.itemFactValue}>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
        ) : null}
        {item.updatedAt ? (
          <div className={styles.itemFact}>
            <span className={styles.itemFactLabel}>Atualizada em</span>
            <span className={styles.itemFactValue}>{new Date(item.updatedAt).toLocaleDateString('pt-BR')}</span>
          </div>
        ) : null}
      </div>
    </>
  )
}

function PullRequestBody({ styles, item }) {
  return (
    <>
      <ItemDescription styles={styles} item={item} />
      <ItemLabels styles={styles} item={item} />
      <div className={styles.itemFactsGrid}>
        {item.baseBranch && item.headBranch ? (
          <div className={styles.itemFact} style={{ gridColumn: '1 / -1' }}>
            <span className={styles.itemFactLabel}>Branches</span>
            <span className={styles.itemFactValue}>{item.headBranch} → {item.baseBranch}</span>
          </div>
        ) : null}
        {typeof item.commentsCount === 'number' ? (
          <div className={styles.itemFact}>
            <span className={styles.itemFactLabel}>Comentários</span>
            <span className={styles.itemFactValue}>{item.commentsCount}</span>
          </div>
        ) : null}
      </div>
      <DiffStatRow styles={styles} diffStat={item.diffStat} />
    </>
  )
}

function BranchBody({ styles, item }) {
  return (
    <div className={styles.itemFactsGrid}>
      {item.lastCommitMessage ? (
        <div className={styles.itemFact} style={{ gridColumn: '1 / -1' }}>
          <span className={styles.itemFactLabel}>Último commit</span>
          <span className={styles.itemFactValue}>{item.lastCommitMessage}</span>
        </div>
      ) : null}
      {typeof item.aheadBy === 'number' ? (
        <div className={styles.itemFact}>
          <span className={styles.itemFactLabel}>À frente</span>
          <span className={styles.itemFactValue}>{item.aheadBy} commit{item.aheadBy === 1 ? '' : 's'}</span>
        </div>
      ) : null}
      {typeof item.behindBy === 'number' ? (
        <div className={styles.itemFact}>
          <span className={styles.itemFactLabel}>Atrás</span>
          <span className={styles.itemFactValue}>{item.behindBy} commit{item.behindBy === 1 ? '' : 's'}</span>
        </div>
      ) : null}
    </div>
  )
}

function CommitBody({ styles, item }) {
  return (
    <>
      <ItemDescription styles={styles} item={item} />
      <DiffStatRow styles={styles} diffStat={item.diffStat} />
    </>
  )
}

const BODY_BY_TYPE = {
  issue: IssueBody,
  pull_request: PullRequestBody,
  branch: BranchBody,
  commit: CommitBody,
}

/**
 * Read-only summary body for a linked GitHub object. Intentionally lightweight:
 * no diffs, commit timelines, reviews or checks — those belong on GitHub.
 *
 * @param {{
 *   styles: Record<string, string>,
 *   item: import('../githubPanelTypes.js').GitHubLinkedItem,
 * }} props
 */
export default function CardModalGitHubItemBody({ styles, item }) {
  const BodyComponent = BODY_BY_TYPE[item.type] ?? IssueBody

  return (
    <div className={styles.itemExpandedBody}>
      <BodyComponent styles={styles} item={item} />
    </div>
  )
}
