import { useEffect, useRef } from 'react'
import { CheckIcon, XIcon } from '../WorkspaceIcons/WorkspaceIcons.jsx'
import styles from '../../pages/Workspace/Workspace.module.css'

export default function PlanRenameInput({ value, busy, onChange, onCommit, onCancel }) {
  const inputRef = useRef(null)
  const ignoreBlurUntilRef = useRef(0)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
    ignoreBlurUntilRef.current = Date.now() + 250
  }, [])

  return (
    <div
      className={styles.planRenameGroup}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onBlur={(event) => {
        if (Date.now() < ignoreBlurUntilRef.current) return
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onCommit?.()
        }
      }}
    >
      <input
        ref={inputRef}
        className={styles.planRenameInput}
        value={value}
        disabled={busy}
        maxLength={120}
        onChange={(event) => onChange?.(event.target.value)}
        onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Enter') {
            event.preventDefault()
            onCommit?.()
          } else if (event.key === 'Escape') {
            event.preventDefault()
            onCancel?.()
          }
        }}
      />
      <button
        type="button"
        className={`${styles.planRenameButton} ${styles.planRenameConfirm}`}
        aria-label="Confirmar novo nome"
        title="Confirmar"
        disabled={busy || !value.trim()}
        onClick={() => onCommit?.()}
      >
        <CheckIcon />
      </button>
      <button
        type="button"
        className={`${styles.planRenameButton} ${styles.planRenameCancel}`}
        aria-label="Cancelar renomeacao"
        title="Cancelar"
        disabled={busy}
        onClick={() => onCancel?.()}
      >
        <XIcon />
      </button>
    </div>
  )
}
