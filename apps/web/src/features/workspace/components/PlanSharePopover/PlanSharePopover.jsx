import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../../../shared/api/apiClient.js'
import { useAuthenticatedImageUrl } from '../../../../shared/hooks/useAuthenticatedImageUrl.js'
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

function normalizeGmailConnected(source = {}) {
  return Boolean(source?.connected)
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
  const [isGmailStatusLoading, setIsGmailStatusLoading] = useState(false)

  const canInvite = canManagePlanMembers(plan?.role)
  const trimmedEmail = email.trim()
  const isEmailValid = EMAIL_PATTERN.test(trimmedEmail)

  useEffect(() => {
    if (!open) {
      setEmail('')
      setInviteRole('MEMBER')
      setInviteError('')
      setIsSubmitting(false)
      setGmailConnected(null)
      setIsGmailStatusLoading(false)
      return
    }

    onRefreshPlanDetails?.(plan?.id).catch(() => {})

    if (!isBackendDriven || !accessToken) {
      setGmailConnected(false)
      setIsGmailStatusLoading(false)
      return undefined
    }

    let active = true
    setIsGmailStatusLoading(true)

    apiRequest('/api/settings', { token: accessToken })
      .then((snapshot) => {
        if (!active) return
        setGmailConnected(normalizeGmailConnected(snapshot?.integrations?.gmail))
      })
      .catch(() => {
        if (!active) return
        setGmailConnected(null)
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

    if (gmailConnected === false) {
      setInviteError(GMAIL_NOT_CONNECTED_MESSAGE)
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

  const handleEmailKeyDown = (event) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    handleSendInvite()
  }

  if (!open) return null

  return (
    <div
      id={popoverId}
      className={styles.popover}
      role="dialog"
      aria-label="Compartilhar plano"
    >
      <div className={styles.planHeader}>
        <PlanShareCover plan={plan} />
        <h2 className={styles.planName}>{plan?.name ?? 'Plano'}</h2>
      </div>

      {canInvite ? (
        <section className={styles.inviteSection} aria-label="Convidar membros">
          {!isGmailStatusLoading && gmailConnected === false ? (
            <p className={styles.inviteHint}>
              {GMAIL_NOT_CONNECTED_MESSAGE}{' '}
              <Link to="/settings?section=integrations" className={styles.inviteSettingsLink}>
                Ir para Integrações
              </Link>
            </p>
          ) : null}
          <div className={styles.inviteField}>
            <input
              type="email"
              className={styles.inviteEmailInput}
              placeholder="E-mail"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (inviteError) setInviteError('')
              }}
              onKeyDown={handleEmailKeyDown}
              autoComplete="email"
              disabled={isSubmitting || isGmailStatusLoading || gmailConnected === false}
            />
            <span className={styles.inviteFieldDivider} aria-hidden="true" />
            <PlanRoleSelect
              value={inviteRole}
              onChange={setInviteRole}
              options={PLAN_INVITE_ROLE_OPTIONS}
              disabled={isSubmitting || isGmailStatusLoading || gmailConnected === false}
              ariaLabel="Nível de permissão do convite"
              variant="inline"
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
    </div>
  )
}
