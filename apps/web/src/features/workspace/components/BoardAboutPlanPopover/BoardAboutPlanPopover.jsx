import { useEffect, useId, useState } from 'react'
import { AlignLeft, ChevronLeft, MessageSquare, UserRound, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import AuthenticatedAvatar from '../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import styles from './BoardAboutPlanPopover.module.css'

const ICON_SIZE = 14
const ICON_STROKE = 1.75

const DESCRIPTION_PLACEHOLDER = 'Adicione uma descrição explicando aos seus colegas de equipe para que este plano é usado. Para ganhar uma estrelinha nossa, adicione também instruções sobre como colaborar!'

function resolveMemberHandle(member) {
  if (!member?.email) return null
  const localPart = member.email.split('@')[0]?.trim()
  return localPart ? `@${localPart}` : null
}

function resolveMemberName(member) {
  return member?.name ?? member?.label ?? member?.email ?? member?.initials ?? 'Membro'
}

export function getPlanAdministrators(members = []) {
  if (!Array.isArray(members) || !members.length) return []
  const admins = members.filter((member) => member.role === 'ADMIN' || member.isCreator)
  return admins.length ? admins : [members[0]]
}

export default function BoardAboutPlanPopover({
  open,
  plan,
  members = [],
  currentUser = null,
  readOnly = false,
  busy = false,
  onBack,
  onClose,
  onSaveDescription,
  onOpenShare,
  onNotify,
}) {
  const titleId = useId()
  const [description, setDescription] = useState(plan?.description ?? '')
  const [savedDescription, setSavedDescription] = useState(plan?.description ?? '')
  const administrators = getPlanAdministrators(members)
  const canEditDescription = !readOnly

  useEffect(() => {
    const nextDescription = plan?.description ?? ''
    setDescription(nextDescription)
    setSavedDescription(nextDescription)
  }, [plan?.description, plan?.id])

  const handleSaveDescription = async () => {
    if (!canEditDescription || busy || description === savedDescription || !plan?.id) return

    try {
      await onSaveDescription?.(plan.id, description)
      setSavedDescription(description)
    } catch (error) {
      setDescription(savedDescription)
      onNotify?.(error?.message ?? 'Não foi possível salvar a descrição do plano.')
    }
  }

  if (!open) return null

  return (
    <div
      className={styles.popover}
      role="dialog"
      aria-labelledby={titleId}
      aria-modal="false"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          aria-label="Voltar"
          onClick={onBack}
        >
          <ChevronLeft size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
        <h2 id={titleId} className={styles.title}>Sobre este plano</h2>
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Fechar"
          onClick={onClose}
        >
          <X size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      </header>

      <CustomScrollArea
        enabled
        className={styles.bodyScrollArea}
        viewportClassName={styles.body}
        refreshKey={`about-plan:${administrators.length}:${description.length}`}
      >
        <section className={styles.section} aria-label="Administradores do plano">
          <h3 className={styles.sectionHeading}>
            <span className={styles.sectionHeadingIcon} aria-hidden="true">
              <UserRound size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            </span>
            Administradores do plano
          </h3>

          <div className={styles.adminList}>
            {administrators.map((member) => {
              const handle = resolveMemberHandle(member)
              const isCurrentUser = Boolean(
                currentUser?.id && member?.id && member.id === currentUser.id,
              )

              return (
                <article key={member.id ?? member.email ?? resolveMemberName(member)} className={styles.adminItem}>
                  <AuthenticatedAvatar
                    className={styles.adminAvatar}
                    imageClassName={styles.adminAvatarImage}
                    avatarUrl={member.avatarUrl}
                    fallback={member.initials}
                    style={{ background: member.color ?? 'var(--surface-3)' }}
                    alt={resolveMemberName(member)}
                  />
                  <div className={styles.adminMeta}>
                    <span className={styles.adminName}>{resolveMemberName(member)}</span>
                    {handle ? <span className={styles.adminHandle}>{handle}</span> : null}
                    {isCurrentUser ? (
                      <Link className={styles.profileLink} to="/settings?section=account">
                        Editar informações de perfil
                      </Link>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className={styles.section} aria-label="Descrição">
          <h3 className={styles.sectionHeading}>
            <span className={styles.sectionHeadingIcon} aria-hidden="true">
              <AlignLeft size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            </span>
            Descrição
          </h3>

          <textarea
            className={styles.descriptionField}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onBlur={() => {
              void handleSaveDescription()
            }}
            placeholder={DESCRIPTION_PLACEHOLDER}
            aria-label="Descrição do plano"
            disabled={!canEditDescription || busy}
          />
        </section>

        <div className={styles.permissionsDivider} role="separator" />

        <section className={styles.section} aria-label="Permissões">
          <p className={styles.permissionsLead}>Membros podem...</p>
          <span className={styles.permissionItem}>
            <span className={styles.permissionItemIcon} aria-hidden="true">
              <MessageSquare size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            </span>
            Comentar em cartões
          </span>
          {!readOnly ? (
            <button
              type="button"
              className={styles.permissionsButton}
              onClick={onOpenShare}
            >
              Alterar permissões...
            </button>
          ) : null}
        </section>
      </CustomScrollArea>
    </div>
  )
}
