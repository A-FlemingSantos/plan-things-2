import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleAlert, Lock, Search, X } from 'lucide-react'
import { SiGithub } from 'react-icons/si'
import PlanGitHubIntegrationStateView from './components/PlanGitHubIntegrationStateView.jsx'
import PlanGitHubRepoRow from './components/PlanGitHubRepoRow.jsx'
import styles from './PlanGitHubIntegrationModal.module.css'

/**
 * @typedef {import('./planGitHubIntegrationTypes.js').GitHubRepoOption} GitHubRepoOption
 * @typedef {import('./planGitHubIntegrationTypes.js').ConnectedGitHubRepo} ConnectedGitHubRepo
 */

const GAP = 8

/**
 * Positions the panel below (or above, when clipped) the anchor element and
 * renders it into document.body so it is never clipped by ancestor
 * overflow via a fixed-position portal dropdown.
 */
function usePanelPosition(anchorRef, panelRef, open) {
  const [style, setStyle] = useState({ position: 'fixed', top: 0, left: 0, visibility: 'hidden' })

  useLayoutEffect(() => {
    if (!open) return undefined

    const updatePosition = () => {
      const anchor = anchorRef?.current
      const panel = panelRef.current
      if (!anchor || !panel) return

      const anchorRect = anchor.getBoundingClientRect()
      const panelHeight = panel.offsetHeight
      const panelWidth = panel.offsetWidth
      const spaceBelow = window.innerHeight - anchorRect.bottom - GAP
      const spaceAbove = anchorRect.top - GAP
      const opensDown = spaceBelow >= panelHeight || spaceBelow >= spaceAbove

      const left = Math.min(
        Math.max(8, anchorRect.right - panelWidth),
        window.innerWidth - panelWidth - 8,
      )

      setStyle({
        position: 'fixed',
        top: opensDown ? anchorRect.bottom + GAP : anchorRect.top - GAP - panelHeight,
        left,
        visibility: 'visible',
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, anchorRef, panelRef])

  return style
}

/**
 * Plan-level GitHub integration modal: multi-repo search, connect/remove,
 * connection state and manager-permission gating. Meant to be opened from
 * the BoardHeader "Blocks" button (wiring happens separately); this
 * component only needs an anchor ref for positioning plus `open`/`onClose`.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   anchorRef?: { current: HTMLElement|null },
 *   planName?: string,
 *
 *   status?: 'loading'|'disconnected'|'permission_denied'|'error'|'ready',
 *   statusErrorMessage?: string,
 *   isManager?: boolean,
 *   onConnectGitHubAccount?: () => void,
 *   onRetry?: () => void,
 *
 *   connectedRepos?: ConnectedGitHubRepo[],
 *   onRemoveRepo?: (repo: ConnectedGitHubRepo) => void,
 *   pendingRemoveRepoIds?: string[],
 *   onReconnectRepo?: (repo: ConnectedGitHubRepo) => void,
 *
 *   searchQuery?: string,
 *   onSearchQueryChange?: (value: string) => void,
 *   searchStatus?: 'idle'|'loading'|'success'|'error',
 *   searchResults?: GitHubRepoOption[],
 *   searchErrorMessage?: string,
 *   onConnectRepo?: (repo: GitHubRepoOption) => void,
 *   pendingConnectRepoIds?: string[],
 * }} props
 */
export default function PlanGitHubIntegrationModal({
  open,
  onClose,
  anchorRef,
  planName,

  status = 'loading',
  statusErrorMessage,
  isManager = false,
  onConnectGitHubAccount,
  onRetry,

  connectedRepos = [],
  onRemoveRepo,
  pendingRemoveRepoIds = [],
  onReconnectRepo,

  searchQuery = '',
  onSearchQueryChange,
  searchStatus = 'idle',
  searchResults = [],
  searchErrorMessage,
  onConnectRepo,
  pendingConnectRepoIds = [],
}) {
  const panelRef = useRef(null)
  const style = usePanelPosition(anchorRef, panelRef, open)

  const theme =
    typeof document !== 'undefined'
      ? (document.documentElement.dataset.appColorScheme ?? 'light')
      : 'light'

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      const clickedPanel = panelRef.current?.contains(event.target)
      const clickedAnchor = anchorRef?.current?.contains(event.target)
      if (!clickedPanel && !clickedAnchor) onClose()
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose, anchorRef])

  if (!open) return null

  const connectedFullNames = new Set(connectedRepos.map((repo) => repo.fullName))
  const showSearch = isManager && status === 'ready'

  return createPortal(
    <div
      ref={panelRef}
      className={styles.panel}
      data-theme={theme}
      style={{ ...style, colorScheme: theme }}
      role="dialog"
      aria-modal="true"
      aria-label="Integrações do GitHub do plano"
      onClick={(event) => event.stopPropagation()}
    >
      <div className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <span className={styles.headerIcon} aria-hidden="true"><SiGithub size={16} /></span>
          <div>
            <p className={styles.headerTitle}>Integrações do GitHub</p>
            {planName ? <p className={styles.headerSubtitle}>{planName}</p> : null}
          </div>
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
          <X size={15} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.body}>
        {status === 'loading' ? (
          <PlanGitHubIntegrationStateView
            styles={styles}
            spinning
            title="Carregando integrações..."
            message="Buscando os repositórios conectados a este plano."
          />
        ) : null}

        {status === 'permission_denied' ? (
          <PlanGitHubIntegrationStateView
            styles={styles}
            icon={Lock}
            title="Sem acesso a esta integração"
            message="Você não tem permissão para visualizar as integrações do GitHub deste plano."
          />
        ) : null}

        {status === 'disconnected' ? (
          <PlanGitHubIntegrationStateView
            styles={styles}
            icon={SiGithub}
            title="Conecte uma conta do GitHub"
            message={
              isManager
                ? 'Conecte sua conta do GitHub para buscar e vincular repositórios a este plano.'
                : 'Este plano ainda não está conectado ao GitHub. Peça a um gerente do plano para configurar a integração.'
            }
            actionLabel={isManager ? 'Conectar ao GitHub' : undefined}
            onAction={isManager ? onConnectGitHubAccount : undefined}
          />
        ) : null}

        {status === 'error' ? (
          <PlanGitHubIntegrationStateView
            styles={styles}
            icon={CircleAlert}
            title="Não foi possível carregar as integrações"
            message={statusErrorMessage ?? 'Ocorreu um erro ao buscar os repositórios conectados. Tente novamente.'}
            actionLabel={onRetry ? 'Tentar novamente' : undefined}
            onAction={onRetry}
          />
        ) : null}

        {status === 'ready' ? (
          <>
            {showSearch ? (
              <div className={styles.searchSection}>
                <div className={styles.searchInputWrap}>
                  <span className={styles.searchInputIcon} aria-hidden="true">
                    <Search size={13} strokeWidth={1.75} />
                  </span>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Buscar repositórios do GitHub"
                    value={searchQuery}
                    onChange={(event) => onSearchQueryChange?.(event.target.value)}
                    aria-label="Buscar repositórios do GitHub"
                  />
                </div>

                <div className={styles.searchResultsList}>
                  {searchStatus === 'loading' ? (
                    <p className={styles.searchStatusRow}>Buscando repositórios...</p>
                  ) : null}
                  {searchStatus === 'error' ? (
                    <p className={`${styles.searchStatusRow} ${styles.searchErrorRow}`} role="alert">
                      {searchErrorMessage ?? 'Não foi possível buscar repositórios.'}
                    </p>
                  ) : null}
                  {searchStatus === 'success' && searchResults.length === 0 ? (
                    <p className={styles.searchStatusRow}>Nenhum repositório encontrado.</p>
                  ) : null}
                  {searchStatus === 'success' ? searchResults.map((repo) => (
                    <PlanGitHubRepoRow
                      key={repo.id}
                      styles={styles}
                      repo={repo}
                      variant="result"
                      canManage={isManager}
                      isConnected={connectedFullNames.has(repo.fullName)}
                      isConnecting={pendingConnectRepoIds.includes(repo.id)}
                      onConnect={onConnectRepo}
                    />
                  )) : null}
                </div>
              </div>
            ) : null}

            {!isManager ? (
              <p className={styles.managerNotice}>
                <Lock size={13} strokeWidth={1.75} aria-hidden="true" />
                Somente gerentes do plano podem conectar ou remover repositórios.
              </p>
            ) : null}

            <div className={styles.repoListSection}>
              <p className={styles.repoListLabel}>Repositórios conectados</p>
              {connectedRepos.length === 0 ? (
                <p className={styles.repoListEmpty}>Nenhum repositório conectado a este plano ainda.</p>
              ) : (
                <div className={styles.repoList}>
                  {connectedRepos.map((repo) => (
                    <PlanGitHubRepoRow
                      key={repo.id}
                      styles={styles}
                      repo={repo}
                      variant="connected"
                      canManage={isManager}
                      onRemove={onRemoveRepo}
                      isRemoving={pendingRemoveRepoIds.includes(repo.id)}
                      onReconnect={onReconnectRepo}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
