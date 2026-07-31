import { CircleAlert, Lock } from 'lucide-react'
import { SiGithub } from 'react-icons/si'
import CardModalGitHubStateView from './components/CardModalGitHubStateView.jsx'
import CardModalGitHubUrlInput from './components/CardModalGitHubUrlInput.jsx'
import CardModalGitHubSearchBar from './components/CardModalGitHubSearchBar.jsx'
import CardModalGitHubLinkItem from './components/CardModalGitHubLinkItem.jsx'
import CardModalGitHubLinkedItems from './CardModalGitHubLinkedItems.jsx'
import styles from './CardModalGitHubPanel.module.css'

/**
 * @typedef {import('./githubPanelTypes.js').GitHubLinkedItem} GitHubLinkedItem
 * @typedef {import('./githubPanelTypes.js').GitHubLinkType} GitHubLinkType
 */

/**
 * Content for the CardModal "GitHub" sidebar panel. Fully presentational
 * and read-only with respect to GitHub object data: it only exposes
 * link/unlink actions; summaries come from link snapshots, not live GitHub
 * detail/diff fetches.
 *
 * @param {{
 *   status?: 'loading'|'disconnected'|'permission_denied'|'error'|'ready',
 *   statusMessage?: string,
 *   isManager?: boolean,
 *   onOpenIntegrationSetup?: () => void,
 *   onRetry?: () => void,
 *
 *   linkedItems?: GitHubLinkedItem[],
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
 * }} props
 */
export default function CardModalGitHubPanel({
  status = 'loading',
  statusMessage,
  isManager = false,
  onOpenIntegrationSetup,
  onRetry,

  linkedItems = [],
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
}) {
  const linkedItemIds = new Set(linkedItems.map((item) => item.id))

  if (status === 'loading') {
    return (
      <div className={`${styles.root} ${styles.themeScope}`}>
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
      <div className={`${styles.root} ${styles.themeScope}`}>
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
      <div className={`${styles.root} ${styles.themeScope}`}>
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
      <div className={`${styles.root} ${styles.themeScope}`}>
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
    <div className={`${styles.root} ${styles.themeScope}`}>
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
                    canManage={isManager}
                    onLinkItem={onLinkItem}
                    isLinking={pendingLinkItemIds.includes(item.id)}
                    isAlreadyLinked={linkedItemIds.has(item.id)}
                  />
                )) : null}
              </div>
            }
          />
        </>
      )}

      <CardModalGitHubLinkedItems
        styles={styles}
        linkedItems={linkedItems}
        isManager={isManager}
        onUnlinkItem={onUnlinkItem}
        pendingUnlinkItemIds={pendingUnlinkItemIds}
        showSectionLabel
      />
    </div>
  )
}
