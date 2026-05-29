import styles from './UserChatMessage.module.css'

function FileDocIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M9.5 2H4a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6L9.5 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9.5 2v4H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.5 9.5h5M5.5 11.5h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function FileImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5.5" cy="6.5" r="1" stroke="currentColor" strokeWidth="1.1" />
      <path d="M2 11l3.5-3.5 2.5 2.5 2-2 3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MockImagePlaceholder({ label }) {
  const initials = label
    .replace(/\.[^.]+$/, '')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={styles.mockImagePlaceholder} aria-hidden="true">
      <span className={styles.mockImageInitials}>{initials}</span>
      <FileImageIcon />
    </div>
  )
}

function UserMessageImages({ attachments }) {
  if (attachments.length === 0) return null

  return (
    <div className={styles.images} role="group" aria-label="Imagens enviadas">
      {attachments.map((attachment) => (
        <div key={attachment.id} className={styles.imageTile}>
          {attachment.previewUrl ? (
            <img
              src={attachment.previewUrl}
              alt={attachment.label}
              className={styles.imagePreview}
            />
          ) : (
            <MockImagePlaceholder label={attachment.label} />
          )}
        </div>
      ))}
    </div>
  )
}

function UserMessageFiles({ attachments }) {
  if (attachments.length === 0) return null

  return (
    <div className={styles.files} role="group" aria-label="Arquivos enviados">
      {attachments.map((attachment) => (
        <div key={attachment.id} className={styles.fileRow}>
          <span className={styles.fileIcon} aria-hidden="true">
            <FileDocIcon />
          </span>
          <span className={styles.fileLabel} title={attachment.label}>
            {attachment.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function UserMessageChips({ chips }) {
  if (chips.length === 0) return null

  return (
    <div className={styles.chipRow}>
      <div className={styles.chips} role="group" aria-label="Contexto enviado">
        {chips.map((chip) => {
          const ChipIcon = chip.ChipIcon
          return (
            <div
              key={chip.id}
              className={styles.contextChip}
              data-kind={chip.kind}
              data-type={chip.type}
            >
              {ChipIcon ? (
                <span className={styles.contextChipIcon} aria-hidden="true">
                  <ChipIcon />
                </span>
              ) : null}
              <span className={styles.contextChipLabel}>{chip.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function UserChatMessage({ text = '', contextSnapshot, bubbleClassName }) {
  const snapshot = contextSnapshot ?? {
    imageAttachments: [],
    fileAttachments: [],
    contextChips: [],
  }
  const trimmedText = String(text ?? '').trim()
  const hasContext = (
    snapshot.imageAttachments.length > 0
    || snapshot.fileAttachments.length > 0
    || snapshot.contextChips.length > 0
  )

  if (!trimmedText && !hasContext) return null

  return (
    <article className={styles.root} aria-label="Mensagem enviada">
      {hasContext ? (
        <div className={styles.context}>
          <UserMessageImages attachments={snapshot.imageAttachments} />
          <UserMessageFiles attachments={snapshot.fileAttachments} />
          <UserMessageChips chips={snapshot.contextChips} />
        </div>
      ) : null}
      {trimmedText ? (
        <div className={bubbleClassName}>{trimmedText}</div>
      ) : null}
    </article>
  )
}
