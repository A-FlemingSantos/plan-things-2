import AuthenticatedAvatar from '../../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import InboxDropPanel from '../../../components/InboxDropPanel/InboxDropPanel.jsx'
import { KanbanBoardIcons as Icon } from './KanbanBoardIcons.jsx'

export default function KanbanBoardInboxPanel({
  styles,
  isInboxOpen,
  isInboxDropActive,
  closeInbox,
  inboxRecipientCard,
  inboxSelectedMemberIds,
  inboxSendingCardId,
  inboxError,
  inboxItems,
  isClearingInbox,
  inboxSelectableMembers,
  isPlanMembersLoading,
  onResetRecipient,
  onToggleRecipient,
  onSubmitRecipients,
  onClearDeliveries,
}) {
  const renderInboxItem = (item) => {
    const recipients = Array.isArray(item.recipients) && item.recipients.length
      ? item.recipients.map((recipient) => recipient.fullName || recipient.email).filter(Boolean)
      : (Array.isArray(item.sentTo) ? item.sentTo : [])
    const recipientLabel = recipients.length
      ? recipients.join(', ')
      : 'Destinatários registrados'
    const sentByName = item.sentBy?.fullName || item.sentFrom || 'Gmail conectado'
    const sentAtLabel = item.sentAt?.text ?? 'Agora'

    return (
      <article key={item.id} className={styles.inboxSentCard}>
        <div className={styles.inboxSentCardHeader}>
          <strong>{item.cardTitle ?? 'Cartão enviado'}</strong>
          <span>{sentAtLabel}</span>
        </div>
        <p>{recipientLabel}</p>
        <small>Enviado por {sentByName}</small>
      </article>
    )
  }

  return (
    <InboxDropPanel
      id="board-inbox-panel"
      className={`${styles.plannerPanel} ${styles.inboxPanel} ${isInboxOpen ? '' : styles.plannerPanelClosing} ${isInboxDropActive ? styles.inboxPanelDropActive : ''}`}
      aria-label="Caixa de entrada"
    >
      <div className={styles.inboxPanelHeader}>
        <div className={styles.inboxPanelTitle}>
          <Icon.Inbox />
          <h2>Caixa de entrada</h2>
        </div>
        <button
          type="button"
          className={styles.plannerCloseButton}
          aria-label="Fechar caixa de entrada"
          onClick={closeInbox}
        >
          <Icon.X />
        </button>
      </div>

      <section className={styles.inboxDropZone} aria-label="Enviar cartão por Gmail">
        <Icon.Send />
        <strong>Solte um cartão para enviar por Gmail</strong>
        <p>O e-mail será enviado pela conta Gmail conectada para membros que ainda não fazem parte do cartão.</p>
      </section>

      {inboxRecipientCard ? (
        <section className={styles.inboxRecipientPicker} aria-label="Escolher destinatários">
          <div className={styles.inboxRecipientHeader}>
            <span>Destinatários</span>
            <strong>{inboxRecipientCard.title}</strong>
          </div>

          <div className={styles.inboxRecipientList}>
            {inboxSelectableMembers.length ? inboxSelectableMembers.map((member) => {
              const memberName = member.name ?? member.fullName ?? 'Membro'
              const checked = inboxSelectedMemberIds.includes(member.id)

              return (
                <label key={member.id} className={styles.inboxRecipientRow}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleRecipient(member.id)}
                  />
                  <AuthenticatedAvatar
                    className={styles.planMemberAvatar}
                    imageClassName={styles.avatarImage}
                    style={{ background: member.color }}
                    avatarUrl={member.avatarUrl}
                    fallback={member.initials}
                    title={memberName}
                  />
                  <span className={styles.inboxRecipientInfo}>
                    <strong>{memberName}</strong>
                    <small>{member.email}</small>
                  </span>
                </label>
              )
            }) : (
              <p className={styles.inboxRecipientsEmpty}>
                {isPlanMembersLoading ? 'Carregando membros do plano...' : 'Todos os membros do plano já fazem parte deste cartão.'}
              </p>
            )}
          </div>

          <div className={styles.inboxRecipientActions}>
            <button
              type="button"
              className={styles.inboxSecondaryButton}
              onClick={onResetRecipient}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.inboxPrimaryButton}
              onClick={onSubmitRecipients}
              disabled={!inboxSelectedMemberIds.length || inboxSendingCardId === inboxRecipientCard.id}
            >
              {inboxSendingCardId === inboxRecipientCard.id ? 'Enviando...' : 'Enviar e-mail'}
            </button>
          </div>
        </section>
      ) : null}

      {inboxError ? <p className={styles.inboxError} role="alert">{inboxError}</p> : null}

      <section className={styles.inboxSentList} aria-label="Cartões enviados pela Inbox">
        <div className={styles.inboxSentListHeader}>
          <span>Enviados</span>
          <div className={styles.inboxSentListActions}>
            <strong>{inboxItems.length}</strong>
            <button
              type="button"
              className={styles.inboxClearButton}
              aria-label="Limpar envios da Inbox"
              title="Limpar envios da Inbox"
              onClick={onClearDeliveries}
              disabled={!inboxItems.length || isClearingInbox}
            >
              <Icon.Trash />
            </button>
          </div>
        </div>
        {inboxItems.length ? (
          <div className={styles.inboxSentItems}>
            {inboxItems.map(renderInboxItem)}
          </div>
        ) : (
          <p className={styles.inboxSentEmpty}>Nenhum cartão enviado pela Inbox ainda.</p>
        )}
      </section>

      <div className={styles.inboxPrivateNote}>
        <Icon.Lock />
        <span>Envios usam somente a permissão Gmail de envio</span>
      </div>
    </InboxDropPanel>
  )
}
