import { Search } from 'lucide-react'
import { GITHUB_LINK_TYPE_OPTIONS } from '../githubPanelTypes.js'

/**
 * Search-by-type-and-repo entry point for linking GitHub objects to the
 * card. Renders the type tabs, an optional repo filter (populated from the
 * repos already connected to the plan) and the query input. Results are
 * rendered by the caller via `resultsSlot` so this component stays a pure
 * controlled input surface.
 *
 * @param {{
 *   styles: Record<string, string>,
 *   type: import('../githubPanelTypes.js').GitHubLinkType,
 *   onTypeChange: (type: import('../githubPanelTypes.js').GitHubLinkType) => void,
 *   repoFilter?: string,
 *   onRepoFilterChange?: (value: string) => void,
 *   availableRepoFullNames?: string[],
 *   query: string,
 *   onQueryChange: (value: string) => void,
 *   disabled?: boolean,
 *   resultsSlot?: React.ReactNode,
 * }} props
 */
export default function CardModalGitHubSearchBar({
  styles,
  type,
  onTypeChange,
  repoFilter = '',
  onRepoFilterChange,
  availableRepoFullNames = [],
  query,
  onQueryChange,
  disabled = false,
  resultsSlot = null,
}) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>Buscar no GitHub</p>

      <div className={styles.searchTabs} role="tablist" aria-label="Tipo de objeto do GitHub">
        {GITHUB_LINK_TYPE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={type === option.id}
            className={`${styles.searchTab} ${type === option.id ? styles.searchTabActive : ''}`}
            onClick={() => onTypeChange(option.id)}
            disabled={disabled}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className={styles.searchControlsRow}>
        <div className={styles.searchInputWrap}>
          <span className={styles.searchInputIcon} aria-hidden="true">
            <Search size={13} strokeWidth={1.75} />
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por título, número ou SHA"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            aria-label="Buscar objeto do GitHub"
            disabled={disabled}
          />
        </div>

        {onRepoFilterChange ? (
          <select
            className={styles.repoFilterSelect}
            value={repoFilter}
            onChange={(event) => onRepoFilterChange(event.target.value)}
            aria-label="Filtrar por repositório"
            disabled={disabled || availableRepoFullNames.length === 0}
          >
            <option value="">Todos os repos</option>
            {availableRepoFullNames.map((fullName) => (
              <option key={fullName} value={fullName}>{fullName}</option>
            ))}
          </select>
        ) : null}
      </div>

      {resultsSlot}
    </div>
  )
}
