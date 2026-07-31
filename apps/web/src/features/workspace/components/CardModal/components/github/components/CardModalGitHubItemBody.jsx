import { CircleAlert, Loader } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { GitHubExternalLinkGlyph } from '../githubIcons.jsx'
import { formatGitHubDiffStat } from '../githubPanelFormat.js'

function ItemDescription({ styles, item }) {
  if (!item.bodyPreview) return null
  return (
    <div className={styles.itemDescription}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {item.bodyPreview}
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
      {item.reviewers?.length ? (
        <DetailList
          styles={styles}
          title="Reviews"
          items={item.reviewers.map((review) => `${review.login ?? review.name ?? 'Reviewer'} · ${review.state ?? review.status ?? 'pendente'}`)}
        />
      ) : null}
      {item.commits?.length ? (
        <DetailList
          styles={styles}
          title="Commits"
          items={item.commits.map((commit) => `${commit.sha?.slice(0, 7) ?? ''} ${commit.message ?? commit.title ?? ''}`.trim())}
        />
      ) : null}
      {item.checks?.length ? (
        <DetailList
          styles={styles}
          title="Checks"
          items={item.checks.map((check) => `${check.name ?? check.context ?? 'Check'} · ${check.conclusion ?? check.state ?? check.status ?? 'pending'}`)}
        />
      ) : null}
    </>
  )
}

function BranchBody({ styles, item }) {
  return (
    <>
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
      {item.commits?.length ? (
        <DetailList
          styles={styles}
          title="Timeline de commits"
          items={item.commits.map((commit) => `${commit.sha?.slice(0, 7) ?? ''} ${commit.message ?? commit.title ?? ''} · ${commit.authorName ?? commit.author?.login ?? ''}`.trim())}
        />
      ) : null}
    </>
  )
}

function DetailList({ styles, title, items }) {
  return (
    <div className={styles.detailList}>
      <p className={styles.detailListTitle}>{title}</p>
      {items.map((value, index) => <p key={`${value}:${index}`} className={styles.detailListItem}>{value}</p>)}
    </div>
  )
}

/**
 * Commit body owns the lazy-diff affordance: the diff itself is not fetched
 * by this UI pass, it only exposes the trigger + idle/loading/loaded/error
 * slots the wiring step will drive.
 */
function CommitBody({
  styles,
  item,
  diffState = 'idle',
  diffSummary,
  onLoadDiff,
}) {
  return (
    <>
      {item.message ? <p className={styles.itemDescription}>{item.message}</p> : null}
      {item.files?.length ? (
        <DetailList
          styles={styles}
          title="Arquivos alterados"
          items={item.files.map((file) => `${file.filename ?? file.name} · ${file.status ?? 'modified'}`)}
        />
      ) : null}

      <div className={styles.commitDiffSection}>
        {diffState === 'idle' && onLoadDiff ? (
          <button
            type="button"
            className={styles.commitDiffLoadBtn}
            onClick={onLoadDiff}
          >
            Carregar diff
          </button>
        ) : null}

        {diffState === 'loading' ? (
          <button type="button" className={styles.commitDiffLoadBtn} disabled>
            <Loader size={13} strokeWidth={1.75} className={styles.stateIconSpinning} aria-hidden="true" />
            Carregando diff...
          </button>
        ) : null}

        {diffState === 'error' ? (
          <p className={styles.commitDiffError} role="alert">
            <CircleAlert size={13} strokeWidth={1.75} aria-hidden="true" /> Não foi possível carregar o diff.
          </p>
        ) : null}

        {diffState === 'loaded' && diffSummary ? (
          <>
            <DiffStatRow styles={styles} diffStat={diffSummary} />
            {diffSummary.renderedHtml ? (
              <div
                className={styles.commitDiffHtml}
                dangerouslySetInnerHTML={{ __html: diffSummary.renderedHtml }}
              />
            ) : diffSummary.patchPreview ? (
              <pre className={styles.commitDiffPatch}>{diffSummary.patchPreview}</pre>
            ) : null}
          </>
        ) : null}
      </div>
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
 * Dispatches to the correct read-only expandable body for the item's type.
 *
 * @param {{
 *   styles: Record<string, string>,
 *   item: import('../githubPanelTypes.js').GitHubLinkedItem,
 *   diffState?: import('../githubPanelTypes.js').GitHubDiffLoadState,
 *   diffSummary?: import('../githubPanelTypes.js').GitHubCommitDiffSummary,
 *   onLoadDiff?: () => void,
 * }} props
 */
export default function CardModalGitHubItemBody({
  styles,
  item,
  diffState,
  diffSummary,
  onLoadDiff,
  onLoadMoreDetails,
}) {
  const BodyComponent = BODY_BY_TYPE[item.type] ?? IssueBody

  return (
    <div className={styles.itemExpandedBody}>
      {item.detailsLoading ? (
        <p className={styles.detailLoading}>
          <Loader size={13} strokeWidth={1.75} className={styles.stateIconSpinning} aria-hidden="true" />
          Carregando detalhes...
        </p>
      ) : null}
      {item.detailsError ? <p className={styles.commitDiffError}>{item.detailsError}</p> : null}
      <BodyComponent styles={styles} item={item} diffState={diffState} diffSummary={diffSummary} onLoadDiff={onLoadDiff} />
      {item.hasMoreDetails && onLoadMoreDetails ? (
        <button
          type="button"
          className={styles.commitDiffLoadBtn}
          onClick={onLoadMoreDetails}
          disabled={item.detailsLoading}
        >
          {item.detailsLoading ? 'Carregando...' : 'Carregar mais'}
        </button>
      ) : null}
      <a
        className={styles.itemFooterLink}
        href={item.url}
        target="_blank"
        rel="noreferrer"
      >
        <GitHubExternalLinkGlyph />
        Abrir no GitHub
      </a>
    </div>
  )
}
