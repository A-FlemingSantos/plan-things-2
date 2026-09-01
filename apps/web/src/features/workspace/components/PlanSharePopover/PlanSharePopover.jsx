import { useEffect, useId, useState } from 'react'
import { Link2, SendHorizontal, Settings, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../../../shared/api/apiClient.js'
import { buildWorkspaceBoardPath } from '../../../../shared/config/routes.js'
import { useAuthenticatedImageUrl } from '../../../../shared/hooks/useAuthenticatedImageUrl.js'
import MemberAvatarStack from '../MemberAvatarStack/MemberAvatarStack.jsx'
import PlanRoleSelect from '../PlanRoleSelect/PlanRoleSelect.jsx'
import { resolveCoverThemeClass } from '../workspaceCover/workspaceCoverUtils.js'
import workspaceCoverStyles from '../../pages/Workspace/Workspace.module.css'
import {
  canManagePlanMembers,
  PLAN_INVITE_ROLE_OPTIONS,
} from '../../utils/planMemberRoles.js'
import styles from './PlanSharePopover.module.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GMAIL_NOT_CONNECTED_MESSAGE = 'Conecte o Gmail em Configurações para enviar convites por e-mail.'
const GMAIL_RECONNECT_MESSAGE = 'A autorização do Gmail expirou. Reconecte em Configurações para enviar convites.'

function buildPlanShareUrl(planId) {
  if (!planId || typeof window === 'undefined') return ''
  return `${window.location.origin}${buildWorkspaceBoardPath(planId)}`
}

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

function isGmailAuthError(error) {
  return String(error?.code ?? '').startsWith('GMAIL_')
}

function normalizeGmailInviteReadiness(source = {}) {
  const connected = Boolean(source?.connected)
  const lastError = source?.lastError ?? null
  return {
    canSend: connected && !lastError,
    needsReconnect: connected && Boolean(lastError),
  }
}

function PlanShareCover({ plan }) {
  const coverThemeClassName = resolveCoverThemeClass(workspaceCoverStyles, plan?.coverThemeId)
  const rawCoverImageUrl = plan?.coverImage ?? null
  const isImageCover = Boolean(rawCoverImageUrl)
  const resolvedCoverImageUrl = useAuthenticatedImageUrl(isImageCover ? rawCoverImageUrl : null)
  const coverClassName = [
    styles.planCover,
    coverThemeClassName,
    isImageCover ? styles.planCoverImage : '',
  ].filter(Boolean).join(' ')
  const coverStyle = plan?.coverThemeId
    ? { '--cover-fallback': plan.cover }
    : isImageCover && resolvedCoverImageUrl
      ? {
          '--cover-fallback': plan.cover,
          '--cover-bg': `url(${resolvedCoverImageUrl})`,
        }
      : { '--cover-fallback': plan?.cover ?? 'var(--surface-3)' }

  return <div className={coverClassName} style={coverStyle} aria-hidden="true" />
}

export default function PlanSharePopover({
  open,
  plan,
  isBackendDriven = false,
  accessToken,
  onRefreshPlanDetails,
  onNotify,
}) {
  const popoverId = useId()
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')
  const [inviteError, setInviteError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(null)
  const [gmailNeedsReconnect, setGmailNeedsReconnect] = useState(false)
  const [isGmailStatusLoading, setIsGmailStatusLoading] = useState(false)
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false)
  const gmailBlocked = gmailConnected === false
  const gmailHintMessage = gmailNeedsReconnect ? GMAIL_RECONNECT_MESSAGE : GMAIL_NOT_CONNECTED_MESSAGE

  const canInvite = canManagePlanMembers(plan?.role)
  const planMembers = Array.isArray(plan?.membersMeta) ? plan.membersMeta : []
  const trimmedEmail = email.trim()
  const isEmailValid = EMAIL_PATTERN.test(trimmedEmail)
  const shareUrl = buildPlanShareUrl(plan?.id)
  const inviteDisabled = isSubmitting || isGmailStatusLoading || gmailBlocked || !trimmedEmail

  useEffect(() => {
    if (!open) {
      setEmail('')
      setInviteRole('MEMBER')
      setInviteError('')
      setIsSubmitting(false)
      setGmailConnected(null)
      setGmailNeedsReconnect(false)
      setIsGmailStatusLoading(false)
      setIsRoleMenuOpen(false)
      return
    }

    onRefreshPlanDetails?.(plan?.id).catch(() => {})

    if (!isBackendDriven || !accessToken) {
      setGmailConnected(false)
      setGmailNeedsReconnect(false)
      setIsGmailStatusLoading(false)
      return undefined
    }

    let active = true
    setIsGmailStatusLoading(true)

    apiRequest('/api/settings', { token: accessToken })
      .then((snapshot) => {
        if (!active) return
        const readiness = normalizeGmailInviteReadiness(snapshot?.integrations?.gmail)
        setGmailConnected(readiness.canSend)
        setGmailNeedsReconnect(readiness.needsReconnect)
      })
      .catch(() => {
        if (!active) return
        setGmailConnected(null)
        setGmailNeedsReconnect(false)
      })
      .finally(() => {
        if (!active) return
        setIsGmailStatusLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, onRefreshPlanDetails, plan?.id, isBackendDriven, accessToken])

  const createInvite = async () => {
    if (!isEmailValid) {
      setInviteError('Informe um e-mail válido.')
      return null
    }

    if (!isBackendDriven || !accessToken || !plan?.id) {
      setInviteError('Convites estão disponíveis apenas com uma conta conectada.')
      return null
    }

    if (!canInvite) {
      setInviteError('Apenas proprietários e admins podem convidar membros.')
      return null
    }

    if (isGmailStatusLoading) {
      setInviteError('Verificando conexão do Gmail...')
      return null
    }

    if (gmailBlocked) {
      setInviteError(gmailHintMessage)
      return null
    }

    setInviteError('')
    setIsSubmitting(true)

    try {
      const result = await apiRequest(`/api/plans/${plan.id}/invites`, {
        method: 'POST',
        token: accessToken,
        body: { email: trimmedEmail },
      })
      return result
    } catch (error) {
      if (isGmailAuthError(error)) {
        setGmailConnected(false)
        setGmailNeedsReconnect(true)
      }
      setInviteError(error?.message ?? 'Não foi possível enviar o convite.')
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendInvite = async () => {
    const invite = await createInvite()
    if (!invite) return

    onNotify?.('Convite enviado.')
    setEmail('')
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return

    try {
      const copied = await copyTextToClipboard(shareUrl)
      onNotify?.(copied ? 'Link copiado.' : 'Não foi possível copiar o link.')
    } catch {
      onNotify?.('Não foi possível copiar o link.')
    }
  }

  const handleEmailKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    handleSendInvite()
  }

  if (!open) return null

  return (
    <div
      id={popoverId}
      className={[styles.popover, isRoleMenuOpen ? styles.popoverRoleMenuOpen : ''].filter(Boolean).join(' ')}
      role="dialog"
      aria-label="Compartilhar plano"
    >
      <div className={styles.planHeader}>
        <PlanShareCover plan={plan} />
        <h2 className={styles.planName}>{plan?.name ?? 'Plano'}</h2>
      </div>

      <div className={styles.body}>
        {canInvite ? (
          <section className={styles.inviteSection} aria-label="Convidar membros">
            {!isGmailStatusLoading && gmailBlocked ? (
              <p className={styles.inviteHint}>
                {gmailHintMessage}{' '}
                <Link to="/settings?section=integrations" className={styles.inviteSettingsLink}>
                  Ir para Integrações
                </Link>
              </p>
            ) : null}

            <div className={styles.inviteField}>
              <span className={styles.fieldIcon} aria-hidden="true">
                <User size={14} strokeWidth={1.75} />
              </span>
              <input
                type="email"
                className={styles.inviteEmailInput}
                placeholder="Adicionar um nome, grupo ou e-mail"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (inviteError) setInviteError('')
                }}
                onKeyDown={handleEmailKeyDown}
                autoComplete="email"
                disabled={isSubmitting || isGmailStatusLoading || gmailBlocked}
              />
              <span className={styles.inviteFieldDivider} aria-hidden="true" />
              <PlanRoleSelect
                value={inviteRole}
                onChange={setInviteRole}
                options={PLAN_INVITE_ROLE_OPTIONS}
                disabled={isSubmitting || isGmailStatusLoading || gmailBlocked}
                ariaLabel="Nível de permissão do convite"
                variant="inline"
                onOpenChange={setIsRoleMenuOpen}
              />
            </div>

            {inviteError ? <p className={styles.inviteError}>{inviteError}</p> : null}
          </section>
        ) : (
          <section className={styles.inviteSection}>
            <p className={styles.inviteHint}>
              Apenas proprietários e admins podem convidar novos membros para este plano.
            </p>
          </section>
        )}

        <footer className={styles.footer}>
          <div className={styles.footerAvatars}>
            {planMembers.length > 0 ? (
              <MemberAvatarStack members={planMembers} size={28} overlap={9} maxVisible={4} />
            ) : null}
          </div>

          <div className={styles.footerActions}>
            {plan?.id ? (
              <div className={styles.copyLinkGroup}>
                <button
                  type="button"
                  className={styles.copyLinkButton}
                  onClick={handleCopyLink}
                >
                  <Link2 size={14} strokeWidth={1.75} aria-hidden="true" />
                  <span>Copiar link</span>
                </button>
                <button
                  type="button"
                  className={styles.copyLinkSettingsButton}
                  aria-label="Opções do link"
                  title="Opções do link"
                  disabled
                >
                  <Settings size={14} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            ) : null}

            {canInvite ? (
              <button
                type="button"
                className={styles.sendButton}
                onClick={handleSendInvite}
                disabled={inviteDisabled}
              >
                <SendHorizontal size={14} strokeWidth={1.75} aria-hidden="true" />
                <span>Enviar</span>
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  )
}
