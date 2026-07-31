import { ArrowRight, Loader } from 'lucide-react'

/**
 * URL-paste entry point: link a GitHub issue/PR/branch/commit to the card by
 * pasting its GitHub URL. Resolution of the URL into a `GitHubLinkedItem`
 * happens in the backend wiring; this component only owns the input UI.
 *
 * @param {{
 *   styles: Record<string, string>,
 *   value: string,
 *   onChange: (value: string) => void,
 *   onSubmit: () => void,
 *   status?: 'idle'|'loading'|'error',
 *   errorMessage?: string,
 *   disabled?: boolean,
 * }} props
 */
export default function CardModalGitHubUrlInput({
  styles,
  value,
  onChange,
  onSubmit,
  status = 'idle',
  errorMessage,
  disabled = false,
}) {
  const isLoading = status === 'loading'

  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>Vincular por URL</p>
      <div className={styles.urlRow}>
        <input
          type="url"
          inputMode="url"
          className={styles.urlInput}
          placeholder="Cole o link de uma issue, PR, branch ou commit"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && value.trim() && !isLoading) {
              event.preventDefault()
              onSubmit()
            }
          }}
          aria-label="URL do GitHub para vincular"
          disabled={disabled || isLoading}
        />
        <button
          type="button"
          className={styles.urlSubmitBtn}
          onClick={onSubmit}
          disabled={disabled || isLoading || !value.trim()}
          aria-label="Vincular URL"
          title="Vincular"
        >
          {isLoading ? (
            <Loader size={14} strokeWidth={1.75} className={styles.stateIconSpinning} aria-hidden="true" />
          ) : (
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      </div>
      {status === 'error' && errorMessage ? (
        <p className={styles.urlError} role="alert">{errorMessage}</p>
      ) : null}
    </div>
  )
}
