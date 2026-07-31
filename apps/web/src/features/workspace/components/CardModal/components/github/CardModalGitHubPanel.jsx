import { useState } from 'react'
import { CircleAlert, Lock } from 'lucide-react'
import { SiGithub } from 'react-icons/si'
import CardModalGitHubStateView from './components/CardModalGitHubStateView.jsx'
import CardModalGitHubUrlInput from './components/CardModalGitHubUrlInput.jsx'
import CardModalGitHubSearchBar from './components/CardModalGitHubSearchBar.jsx'
import CardModalGitHubLinkItem from './components/CardModalGitHubLinkItem.jsx'
import styles from './CardModalGitHubPanel.module.css'

/**
 * @typedef {import('./githubPanelTypes.js').GitHubLinkedItem} GitHubLinkedItem
 * @typedef {import('./githubPanelTypes.js').GitHubLinkType} GitHubLinkType
 * @typedef {import('./githubPanelTypes.js').GitHubDiffLoadState} GitHubDiffLoadState
 * @typedef {import('./githubPanelTypes.js').GitHubCommitDiffSummary} GitHubCommitDiffSummary
 */

/**
 * Content for the CardModal "GitHub" sidebar panel. Fully presentational
 * and read-only with respect to GitHub object data: it only exposes
 * link/unlink actions plus a lazy commit-diff trigger, everything else is
 * driven by props so this component has no fixed/mock data on the
 * production path.
 *
 * @param {{
 *   status?: 'loading'|'disconnected'|'permission_denied'|'error'|'ready',
 *   statusMessage?: string,
 *   isManager?: boolean,
 *   onOpenIntegrationSetup?: () => void,
 *   onRetry?: () => void,
 *
 *   linkedItems?: GitHubLinkedItem[],
 *   expandedItemId?: string|null,
 *   onExpandedItemIdChange?: (id: string|null) => void,
 *   onLoadItemDetails?: (item: GitHubLinkedItem) => void,
 *   onLoadMoreItemDetails?: (item: GitHubLinkedItem) => void,
 *   onUnlinkItem?: (item: GitHubLinkedItem) => void,
 *   pendingUnlinkItemIds?: string[],
 *
 *   urlInputValue?: string,
 *   onUrlInputChange?: (value: string) => void,
 *   onSubmitUrl?: () => void,
 *   urlSubmitStatus?: 'idle'|'loading'|'error',
 *   urlSubmitErrorMessage?: string,
 *
 *   searchType?: GitHubLinkType,
 *   onSearchTypeChange?: (type: GitHubLinkType) => void,
 *   searchRepoFilter?: string,
 *   onSearchRepoFilterChange?: (value: string) => void,
 *   availableRepoFullNames?: string[],
 *   searchQuery?: string,
 *   onSearchQueryChange?: (value: string) => void,
 *   searchStatus?: 'idle'|'loading'|'success'|'error',
 *   searchResults?: GitHubLinkedItem[],
 *   searchErrorMessage?: string,
 *   onLinkItem?: (item: GitHubLinkedItem) => void,
 *   pendingLinkItemIds?: string[],
 *
 *   commitDiffStateById?: Record<string, GitHubDiffLoadState>,
 *   commitDiffById?: Record<string, GitHubCommitDiffSummary>,
 *   onLoadCommitDiff?: (item: GitHubLinkedItem) => void,
 * }} props
 */
export default function CardModalGitHubPanel({
  status = 'loading',
  statusMessage,
  isManager = false,
  onOpenIntegrationSetup,
  onRetry,

  linkedItems = [],
  expandedItemId = null,
  onExpandedItemIdChange,
  onLoadItemDetails,
  onLoadMoreItemDetails,
  onUnlinkItem,
  pendingUnlinkItemIds = [],

  urlInputValue = '',
  onUrlInputChange,
  onSubmitUrl,
  urlSubmitStatus = 'idle',
  urlSubmitErrorMessage,

  searchType = 'issue',
  onSearchTypeChange,
  searchRepoFilter = '',
  onSearchRepoFilterChange,
  availableRepoFullNames = [],
  searchQuery = '',
  onSearchQueryChange,
  searchStatus = 'idle',
  searchResults = [],
  searchErrorMessage,
  onLinkItem,
  pendingLinkItemIds = [],

  commitDiffStateById = {},
  commitDiffById = {},
  onLoadCommitDiff,
}) {
  const [internalExpandedId, setInternalExpandedId] = useState(null)
  const isExpandedControlled = typeof onExpandedItemIdChange === 'function'
  const effectiveExpandedId = isExpandedControlled ? expandedItemId : internalExpandedId

  const handleToggleExpanded = (id) => {
    const next = effectiveExpandedId === id ? null : id
    if (isExpandedControlled) {
      onExpandedItemIdChange(next)
    } else {
      setInternalExpandedId(next)
    }
    if (next && linkedItemIds.has(next)) {
      const item = [...linkedItems, ...searchResults].find((entry) => entry.id === next)
      if (item && !item.detailsLoaded && !item.detailsLoading) onLoadItemDetails?.(item)
    }
  }

  const linkedItemIds = new Set(linkedItems.map((item) => item.id))

  if (status === 'loading') {
    return (
      <div className={styles.root}>
        <CardModalGitHubStateView
          styles={styles}
          spinning
          title="Carregando integração..."
          message="Buscando os dados do GitHub vinculados a este plano."
        />
      </div>
    )
  }

  if (status === 'permission_denied') {
    return (
      <div className={styles.root}>
        <CardModalGitHubStateView
          styles={styles}
          icon={Lock}
          title="Sem acesso ao GitHub deste plano"
          message="Você não tem permissão para visualizar a integração com o GitHub neste plano."
        />
      </div>
    )
  }

  if (status === 'disconnected') {
    return (
      <div className={styles.root}>
        <CardModalGitHubStateView
          styles={styles}
          icon={SiGithub}
          title="GitHub não conectado"
          message={
            isManager
              ? 'Conecte repositórios do GitHub a este plano para vincular issues, PRs, branches e commits aos cartões.'
              : 'Este plano ainda não está conectado ao GitHub. Peça a um gerente do plano para configurar a integração.'
          }
          actionLabel={isManager ? 'Configurar integração' : undefined}
          onAction={isManager ? onOpenIntegrationSetup : undefined}
          primaryAction
        />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={styles.root}>
        <CardModalGitHubStateView
          styles={styles}
          icon={CircleAlert}
          title="Não foi possível carregar o GitHub"
          message={statusMessage ?? 'Ocorreu um erro ao buscar os dados da integração. Tente novamente.'}
          actionLabel={onRetry ? 'Tentar novamente' : undefined}
          onAction={onRetry}
        />
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {!isManager ? (
        <p className={styles.managerNotice}>
          Somente gerentes do plano podem vincular ou remover itens do GitHub. Você pode visualizar os itens já vinculados.
        </p>
      ) : (
        <>
          <CardModalGitHubUrlInput
            styles={styles}
            value={urlInputValue}
            onChange={onUrlInputChange}
            onSubmit={onSubmitUrl}
            status={urlSubmitStatus}
            errorMessage={urlSubmitErrorMessage}
          />

          <CardModalGitHubSearchBar
            styles={styles}
            type={searchType}
            onTypeChange={onSearchTypeChange}
            repoFilter={searchRepoFilter}
            onRepoFilterChange={onSearchRepoFilterChange}
            availableRepoFullNames={availableRepoFullNames}
            query={searchQuery}
            onQueryChange={onSearchQueryChange}
            resultsSlot={
              <div className={styles.searchResultsList} data-testid="github-search-results-list">
                {searchStatus === 'loading' ? (
                  <p className={styles.searchStatusRow}>Buscando...</p>
                ) : null}
                {searchStatus === 'error' ? (
                  <p className={`${styles.searchStatusRow} ${styles.searchErrorRow}`} role="alert">
                    {searchErrorMessage ?? 'Não foi possível buscar no GitHub.'}
                  </p>
                ) : null}
                {searchStatus === 'success' && searchResults.length === 0 ? (
                  <p className={styles.searchStatusRow}>Nenhum resultado encontrado.</p>
                ) : null}
                {searchStatus === 'success' ? searchResults.map((item) => (
                  <CardModalGitHubLinkItem
                    key={item.id}
                    styles={styles}
                    item={item}
                    variant="result"
                    expanded={effectiveExpandedId === item.id}
                    onToggleExpanded={handleToggleExpanded}
                    canManage={isManager}
                    onLinkItem={onLinkItem}
                    isLinking={pendingLinkItemIds.includes(item.id)}
                    isAlreadyLinked={linkedItemIds.has(item.id)}
                    diffState={commitDiffStateById[item.id]}
                    diffSummary={commitDiffById[item.id]}
                    onLoadCommitDiff={onLoadCommitDiff}
                    onLoadMoreDetails={onLoadMoreItemDetails}
                  />
                )) : null}
              </div>
            }
          />
        </>
      )}

      <div className={styles.section}>
        <p className={styles.sectionLabel}>Vinculados a este cartão</p>
        {linkedItems.length === 0 ? (
          <p className={styles.linkedEmpty}>Nenhum item do GitHub vinculado a este cartão ainda.</p>
        ) : (
          <div className={styles.linkedList}>
            {linkedItems.map((item) => (
              <CardModalGitHubLinkItem
                key={item.id}
                styles={styles}
                item={item}
                variant="linked"
                expanded={effectiveExpandedId === item.id}
                onToggleExpanded={handleToggleExpanded}
                canManage={isManager}
                onUnlinkItem={onUnlinkItem}
                isUnlinking={pendingUnlinkItemIds.includes(item.id)}
                diffState={commitDiffStateById[item.id]}
                diffSummary={commitDiffById[item.id]}
                onLoadCommitDiff={onLoadCommitDiff}
                onLoadMoreDetails={onLoadMoreItemDetails}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
