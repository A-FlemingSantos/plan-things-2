import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styles from './GitHubContextBar.module.css'

const REPOS = [
  'plan-things/web',
  'plan-things/mobile',
  'plan-things/api',
  'plan-things/infra',
]

const BRANCHES_BY_REPO = {
  'plan-things/web':    ['main', 'develop', 'staging', 'feature/ui-improvements', 'fix/auth-redirect'],
  'plan-things/mobile': ['main', 'develop', 'feature/push-notifications'],
  'plan-things/api':    ['main', 'develop', 'staging', 'hotfix/rate-limit'],
  'plan-things/infra':  ['main', 'staging'],
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.4a6.6 6.6 0 0 0-2.1 12.85c.33.06.45-.14.45-.32v-1.2c-1.82.4-2.2-.77-2.2-.77-.3-.74-.73-.94-.73-.94-.6-.41.05-.4.05-.4.66.05 1 .67 1 .67.6 1 .15.52 1.5.4.05-.43.23-.73.42-.89-1.45-.16-2.98-.72-2.98-3.22 0-.71.25-1.3.67-1.75-.07-.16-.29-.82.06-1.7 0 0 .55-.18 1.8.67a6.26 6.26 0 0 1 3.28 0c1.24-.85 1.79-.67 1.79-.67.35.88.13 1.54.06 1.7.42.45.67 1.04.67 1.75 0 2.5-1.53 3.06-2.99 3.22.24.2.45.61.45 1.24v1.84c0 .18.12.38.46.31A6.6 6.6 0 0 0 8 1.4Z" fill="currentColor" />
    </svg>
  )
}

function BranchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="5" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5" cy="12" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="11" cy="6" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 5.8v4.4M5 5.8C5 8 7 8.2 11 7.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2.5 4L5 6.5 7.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const GAP = 6

/**
 * Dropdown rendered into document.body via a portal so it is never clipped
 * by overflow:hidden / overflow:auto on any ancestor.
 *
 * Opens downward by default; flips upward when there is not enough space
 * below the anchor button. useLayoutEffect measures before paint to avoid
 * any visible jump.
 *
 * data-theme is stamped on the element so dark-mode CSS tokens resolve
 * correctly even though the portal lives outside the AppThemeScope div.
 */
function PortalDropdown({ anchorRef, children }) {
  const dropdownRef = useRef(null)
  const [style, setStyle] = useState({ position: 'fixed', top: 0, left: 0, visibility: 'hidden', transformOrigin: 'top left' })

  const theme =
    typeof document !== 'undefined'
      ? (document.documentElement.dataset.appColorScheme ?? 'light')
      : 'light'

  useLayoutEffect(() => {
    const anchor   = anchorRef.current
    const dropdown = dropdownRef.current
    if (!anchor || !dropdown) return

    const anchorRect     = anchor.getBoundingClientRect()
    const dropdownHeight = dropdown.offsetHeight
    const spaceBelow     = window.innerHeight - anchorRect.bottom - GAP
    const spaceAbove     = anchorRect.top - GAP

    const opensDown = spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove
    const top = opensDown
      ? anchorRect.bottom + GAP
      : anchorRect.top - GAP - dropdownHeight

    setStyle({
      position: 'fixed',
      top,
      left: anchorRect.left,
      visibility: 'visible',
      transformOrigin: opensDown ? 'top left' : 'bottom left',
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    <div
      ref={dropdownRef}
      className={styles.dropdown}
      data-theme={theme}
      style={{ ...style, colorScheme: theme }}
    >
      {children}
    </div>,
    document.body,
  )
}

export default function GitHubContextBar({ className }) {
  const [repo, setRepo] = useState('plan-things/web')
  const [branch, setBranch] = useState('main')
  const [repoOpen, setRepoOpen] = useState(false)
  const [branchOpen, setBranchOpen] = useState(false)

  const repoBtnRef = useRef(null)
  const branchBtnRef = useRef(null)

  const closeAll = useCallback(() => {
    setRepoOpen(false)
    setBranchOpen(false)
  }, [])

  useEffect(() => {
    if (!repoOpen && !branchOpen) return
    function handlePointerDown(e) {
      // Close if click is outside both buttons and outside the portaled dropdown
      const insideRepo   = repoBtnRef.current?.contains(e.target)
      const insideBranch = branchBtnRef.current?.contains(e.target)
      // Portaled dropdowns are in document.body; check by className
      const insideDropdown = e.target.closest?.(`.${styles.dropdown}`)
      if (!insideRepo && !insideBranch && !insideDropdown) closeAll()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [repoOpen, branchOpen, closeAll])

  const branches = BRANCHES_BY_REPO[repo] ?? ['main']

  function handleSelectRepo(r) {
    setRepo(r)
    setBranch(BRANCHES_BY_REPO[r]?.[0] ?? 'main')
    setRepoOpen(false)
  }

  function handleSelectBranch(b) {
    setBranch(b)
    setBranchOpen(false)
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {/* Repo picker */}
      <button
        ref={repoBtnRef}
        type="button"
        className={`${styles.pickerBtn} ${repoOpen ? styles.pickerBtnOpen : ''}`}
        aria-haspopup="listbox"
        aria-expanded={repoOpen}
        aria-label={`Repositório: ${repo}`}
        onClick={() => { setRepoOpen(o => !o); setBranchOpen(false) }}
      >
        <GitHubIcon />
        <span className={styles.pickerLabel}>{repo}</span>
        <ChevronIcon />
      </button>

      {repoOpen && (
        <PortalDropdown anchorRef={repoBtnRef}>
          {REPOS.map(r => (
            <button
              key={r}
              role="option"
              aria-selected={r === repo}
              type="button"
              className={`${styles.dropdownItem} ${r === repo ? styles.dropdownItemSelected : ''}`}
              onClick={() => handleSelectRepo(r)}
            >
              <span className={styles.dropdownItemCheck}>{r === repo ? <CheckIcon /> : null}</span>
              {r}
            </button>
          ))}
        </PortalDropdown>
      )}

      <span className={styles.sep} aria-hidden="true" />

      {/* Branch picker */}
      <button
        ref={branchBtnRef}
        type="button"
        className={`${styles.pickerBtn} ${branchOpen ? styles.pickerBtnOpen : ''}`}
        aria-haspopup="listbox"
        aria-expanded={branchOpen}
        aria-label={`Branch: ${branch}`}
        onClick={() => { setBranchOpen(o => !o); setRepoOpen(false) }}
      >
        <BranchIcon />
        <span className={styles.pickerLabel}>{branch}</span>
        <ChevronIcon />
      </button>

      {branchOpen && (
        <PortalDropdown anchorRef={branchBtnRef}>
          {branches.map(b => (
            <button
              key={b}
              role="option"
              aria-selected={b === branch}
              type="button"
              className={`${styles.dropdownItem} ${b === branch ? styles.dropdownItemSelected : ''}`}
              onClick={() => handleSelectBranch(b)}
            >
              <span className={styles.dropdownItemCheck}>{b === branch ? <CheckIcon /> : null}</span>
              {b}
            </button>
          ))}
        </PortalDropdown>
      )}
    </div>
  )
}
