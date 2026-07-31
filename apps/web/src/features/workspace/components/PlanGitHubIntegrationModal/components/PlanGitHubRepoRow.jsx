import { CircleAlert, Link2, Loader, RefreshCw, Trash2 } from 'lucide-react'
import { SiGithub } from 'react-icons/si'

/**
 * Shared row layout for a GitHub repo, used both for search results
 * ("Conectar" action) and already-connected repos ("Remover" action, plus
 * an inline error indicator when the connection needs attention).
 *
 * @param {{
 *   styles: Record<string, string>,
 *   repo: import('../planGitHubIntegrationTypes.js').GitHubRepoOption | import('../planGitHubIntegrationTypes.js').ConnectedGitHubRepo,
 *   variant: 'result'|'connected',
 *   canManage?: boolean,
 *   isConnected?: boolean,
 *   onConnect?: (repo: import('../planGitHubIntegrationTypes.js').GitHubRepoOption) => void,
 *   isConnecting?: boolean,
 *   onRemove?: (repo: import('../planGitHubIntegrationTypes.js').ConnectedGitHubRepo) => void,
 *   isRemoving?: boolean,
 *   onReconnect?: (repo: import('../planGitHubIntegrationTypes.js').ConnectedGitHubRepo) => void,
 * }} props
 */
export default function PlanGitHubRepoRow({
  styles,
  repo,
  variant,
  canManage = true,
  isConnected = false,
  onConnect,
  isConnecting = false,
  onRemove,
  isRemoving = false,
  onReconnect,
}) {
  const hasError = variant === 'connected' && repo.connectionStatus === 'error'

  return (
    <div className={styles.repoRow}>
      <span className={styles.repoAvatar} aria-hidden="true">
        {repo.ownerAvatarUrl ? (
          <img className={styles.repoAvatarImg} src={repo.ownerAvatarUrl} alt="" />
        ) : (
          <SiGithub size={13} />
        )}
      </span>

      <span className={styles.repoInfo}>
        <span className={styles.repoNameRow}>
          <span className={styles.repoFullName} title={repo.fullName}>{repo.fullName}</span>
          {repo.isPrivate ? <span className={styles.repoPrivateBadge}>Privado</span> : null}
        </span>
        {variant === 'result' && repo.description ? (
          <p className={styles.repoDescription}>{repo.description}</p>
        ) : null}
        {variant === 'connected' ? (
          <span className={`${styles.repoMeta} ${hasError ? styles.repoMetaError : ''}`}>
            {hasError ? (
              <>
                <CircleAlert size={12} strokeWidth={1.75} aria-hidden="true" />
                {repo.errorMessage ?? 'Conexão precisa ser refeita.'}
              </>
            ) : (
              repo.connectedByName ? `Conectado por ${repo.connectedByName}` : 'Conectado'
            )}
          </span>
        ) : null}
      </span>

      <span className={styles.repoActions}>
        {variant === 'result' ? (
          canManage ? (
            <button
              type="button"
              className={styles.connectBtn}
              onClick={() => onConnect?.(repo)}
              disabled={isConnecting || isConnected}
            >
              {isConnected ? (
                'Conectado'
              ) : isConnecting ? (
                <Loader size={12} strokeWidth={1.75} className={styles.stateIconSpinning} aria-hidden="true" />
              ) : (
                <>
                  <Link2 size={12} strokeWidth={1.75} aria-hidden="true" /> Conectar
                </>
              )}
            </button>
          ) : (
            <span className={styles.connectedPill}>{isConnected ? 'Conectado' : ''}</span>
          )
        ) : null}

        {variant === 'connected' && canManage ? (
          <>
            {hasError && onReconnect ? (
              <button
                type="button"
                className={styles.reconnectBtn}
                onClick={() => onReconnect(repo)}
                aria-label={`Reconectar ${repo.fullName}`}
                title="Reconectar"
              >
                <RefreshCw size={13} strokeWidth={1.75} aria-hidden="true" />
              </button>
            ) : null}
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => onRemove?.(repo)}
              disabled={isRemoving}
              aria-label={`Remover ${repo.fullName} do plano`}
              title="Remover do plano"
            >
              {isRemoving ? (
                <Loader size={13} strokeWidth={1.75} className={styles.stateIconSpinning} aria-hidden="true" />
              ) : (
                <Trash2 size={13} strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
          </>
        ) : null}
      </span>
    </div>
  )
}
