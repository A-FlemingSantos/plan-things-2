import { useEffect, useId, useMemo, useState } from 'react'
import { Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../../../shared/api/apiClient.js'
import AuthenticatedAvatar from '../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import { useAuthenticatedImageUrl } from '../../../../shared/hooks/useAuthenticatedImageUrl.js'
import PlanRoleSelect from '../PlanRoleSelect/PlanRoleSelect.jsx'
import { resolveCoverThemeClass } from '../workspaceCover/workspaceCoverUtils.js'
import workspaceCoverStyles from '../../pages/Workspace/Workspace.module.css'
import {
  canEditMemberRole,
  canManagePlanMembers,
  memberRoleOptionsFor,
  PLAN_INVITE_ROLE_OPTIONS,
} from '../../utils/planMemberRoles.js'
import styles from './PlanSharePopover.module.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GMAIL_NOT_CONNECTED_MESSAGE = 'Conecte o Gmail em Configurações para enviar convites por e-mail.'

function normalizeGmailConnected(source = {}) {
  return Boolean(source?.connected)
}

function buildInviteUrl(token) {
  if (!token || typeof window === 'undefined') return ''
  return `${window.location.origin}/plans/invites/${token}`
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

function PlanShareMemberRow({
  member,
  canEditRole,
  roleOptions,
  isUpdating,
  onRoleChange,
}) {
  const isOwner = member.role === 'OWNER'

  return (
    <li className={styles.memberRow}>
      <AuthenticatedAvatar
        avatarUrl={member.avatarUrl}
        fallback={member.initials}
        className={styles.memberAvatar}
        imageClassName={styles.memberAvatarImage}
        style={{ background: member.color }}
        alt={member.name ?? member.email ?? ''}
      />
      <div className={styles.memberInfo}>
        <p className={styles.memberName}>{member.name ?? member.email ?? 'Membro'}</p>
        {member.email ? <p className={styles.memberEmail}>{member.email}</p> : null}
      </div>
      <div className={styles.memberRoleCell}>
        <PlanRoleSelect
          value={member.role}
          onChange={(nextRole) => onRoleChange(member, nextRole)}
          options={roleOptions}
          disabled={isUpdating || isOwner || !canEditRole}
          ariaLabel={`Cargo de ${member.name ?? member.email ?? 'membro'}`}
        />
      </div>
    </li>
  )
}

export default function PlanSharePopover({
  open,
  plan,
  members = [],
  isMembersLoading = false,
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
  const [updatingMemberId, setUpdatingMemberId] = useState(null)
  const [gmailConnected, setGmailConnected] = useState(null)
  const [isGmailStatusLoading, setIsGmailStatusLoading] = useState(false)

  const canInvite = canManagePlanMembers(plan?.role)
  const trimmedEmail = email.trim()
  const isEmailValid = EMAIL_PATTERN.test(trimmedEmail)

  const sortedMembers = useMemo(() => {
    const roleOrder = { OWNER: 0, ADMIN: 1, MEMBER: 2 }
    return [...members].sort((left, right) => {
      const leftOrder = roleOrder[left.role] ?? 3
      const rightOrder = roleOrder[right.role] ?? 3
      if (leftOrder !== rightOrder) return leftOrder - rightOrder
      return (left.name ?? left.email ?? '').localeCompare(right.name ?? right.email ?? '', 'pt-BR')
    })
  }, [members])

  useEffect(() => {
    if (!open) {
      setEmail('')
      setInviteRole('MEMBER')
      setInviteError('')
      setIsSubmitting(false)
      setUpdatingMemberId(null)
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

  const handleCopyLink = async () => {
    const invite = await createInvite()
    if (!invite?.token) return

    try {
      const copied = await copyTextToClipboard(buildInviteUrl(invite.token))
      if (copied) {
        onNotify?.('Link de convite copiado.')
        setEmail('')
      } else {
        onNotify?.('Não foi possível copiar o link.')
      }
    } catch {
      onNotify?.('Não foi possível copiar o link.')
    }
  }

  const handleMemberRoleChange = async (member, nextRole) => {
    if (!member?.id || member.role === nextRole) return

    if (!isBackendDriven || !accessToken || !plan?.id) {
      onNotify?.('Alteração de cargo disponível apenas com uma conta conectada.')
      return
    }

    if (!canEditMemberRole(plan?.role, member.role)) {
      onNotify?.('Você não tem permissão para alterar este cargo.')
      return
    }

    setUpdatingMemberId(member.id)

    try {
      await apiRequest(`/api/plans/${plan.id}/members/${member.id}`, {
        method: 'PATCH',
        token: accessToken,
        body: { role: nextRole },
      })
      await onRefreshPlanDetails?.(plan.id)
      onNotify?.('Cargo atualizado.')
    } catch (error) {
      onNotify?.(error?.message ?? 'Não foi possível atualizar o cargo.')
    } finally {
      setUpdatingMemberId(null)
    }
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
          <div className={styles.inviteRow}>
            <input
              type="email"
              className={styles.emailInput}
              placeholder="E-mail"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (inviteError) setInviteError('')
              }}
              autoComplete="email"
              disabled={isSubmitting || isGmailStatusLoading || gmailConnected === false}
            />
            <PlanRoleSelect
              value={inviteRole}
              onChange={setInviteRole}
              options={PLAN_INVITE_ROLE_OPTIONS}
              disabled={isSubmitting || isGmailStatusLoading || gmailConnected === false}
              ariaLabel="Nível de permissão do convite"
            />
            <button
              type="button"
              className={styles.copyLinkButton}
              aria-label="Copiar link de convite"
              title="Copiar link de convite"
              onClick={handleCopyLink}
              disabled={isSubmitting || !isEmailValid || isGmailStatusLoading || gmailConnected === false}
            >
              <Link2 size={15} strokeWidth={1.75} aria-hidden="true" />
            </button>
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

      <section className={styles.membersSection} aria-label="Membros do plano">
        <h3 className={styles.membersTitle}>Membros</h3>
        {isMembersLoading ? (
          <p className={styles.membersState}>Carregando membros...</p>
        ) : sortedMembers.length ? (
          <ul className={styles.membersList}>
            {sortedMembers.map((member) => (
              <PlanShareMemberRow
                key={member.id}
                member={member}
                canEditRole={canEditMemberRole(plan?.role, member.role)}
                roleOptions={memberRoleOptionsFor(member)}
                isUpdating={updatingMemberId === member.id}
                onRoleChange={handleMemberRoleChange}
              />
            ))}
          </ul>
        ) : (
          <p className={styles.membersState}>Nenhum membro encontrado.</p>
        )}
      </section>
    </div>
  )
}
