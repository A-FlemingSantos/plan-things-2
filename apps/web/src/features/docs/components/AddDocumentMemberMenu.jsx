import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { apiRequest } from '../../../shared/api/apiClient.js'

async function copyTextToClipboard(value) {
  if (!value) return false

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return true
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  return copied
}

export default function AddDocumentMemberMenu({
  open,
  documentId,
  onClose,
  onInvited,
  styles,
}) {
  const { accessToken } = useAuth()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('EDITOR')
  const [status, setStatus] = useState('')
  const [isError, setIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setEmail('')
      setRole('EDITOR')
      setStatus('')
      setIsError(false)
      setIsSubmitting(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const invite = async () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !documentId) return

    setIsSubmitting(true)
    setStatus('')
    setIsError(false)

    try {
      const result = await apiRequest(`/api/documents/${documentId}/invites`, {
        method: 'POST',
        token: accessToken,
        body: { email: trimmedEmail, role },
      })
      await copyTextToClipboard(result.inviteUrl)
      setStatus(
        result.delivery?.emailSent
          ? 'Convite enviado.'
          : 'Link copiado.',
      )
      setEmail('')
      onInvited?.()
    } catch (error) {
      setStatus(error?.message ?? 'Não foi possível convidar.')
      setIsError(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.memberMenuPanel} role="dialog" aria-label="Adicionar membro">
      <input
        type="email"
        className={styles.memberMenuInput}
        value={email}
        onChange={(event) => {
          setEmail(event.target.value)
          if (status) {
            setStatus('')
            setIsError(false)
          }
        }}
        placeholder="E-mail"
        autoComplete="email"
        disabled={isSubmitting}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            invite()
          }
        }}
      />
      <div className={styles.memberMenuActions}>
        <div className={styles.memberMenuRoles} role="group" aria-label="Papel do convite">
          <button
            type="button"
            className={`${styles.memberMenuRole} ${role === 'EDITOR' ? styles.memberMenuRoleActive : ''}`}
            aria-pressed={role === 'EDITOR'}
            disabled={isSubmitting}
            onClick={() => setRole('EDITOR')}
          >
            Editor
          </button>
          <button
            type="button"
            className={`${styles.memberMenuRole} ${role === 'VIEWER' ? styles.memberMenuRoleActive : ''}`}
            aria-pressed={role === 'VIEWER'}
            disabled={isSubmitting}
            onClick={() => setRole('VIEWER')}
          >
            Leitor
          </button>
        </div>
        <button
          type="button"
          className={styles.memberMenuSubmit}
          onClick={invite}
          disabled={isSubmitting || !email.trim()}
        >
          Convidar
        </button>
      </div>
      {status ? (
        <p className={`${styles.memberMenuStatus} ${isError ? styles.memberMenuStatusError : ''}`}>
          {status}
        </p>
      ) : null}
    </div>
  )
}
