import { useId } from 'react'
import { Building2, Check, Globe, Lock, Users, X } from 'lucide-react'
import styles from './BoardVisibilityPopover.module.css'

const ICON_SIZE = 15
const ICON_STROKE = 1.75

export const BOARD_VISIBILITY_OPTIONS = [
  {
    id: 'private',
    label: 'Particular',
    description: 'Somente os membros deste quadro podem vê-lo. Os administradores da Área de trabalho podem fechar o quadro ou remover membros.',
    Icon: Lock,
    iconClassName: styles.optionIconPrivate,
  },
  {
    id: 'workspace',
    label: 'Área de trabalho',
    description: null,
    Icon: Users,
  },
  {
    id: 'organization',
    label: 'Organização',
    description: 'Todos os membros da organização podem ver esse quadro. O quadro deve ser adicionado à Área de trabalho de uma empresa para que isso seja possível.',
    Icon: Building2,
    disabled: true,
    iconClassName: styles.optionIconDisabled,
  },
  {
    id: 'public',
    label: 'Público',
    description: 'Qualquer pessoa na internet pode ver este quadro. Somente membros do quadro podem editar.',
    Icon: Globe,
    iconClassName: styles.optionIconPublic,
  },
]

function resolveWorkspaceDescription(workspaceName) {
  const name = workspaceName?.trim() || 'Área de Trabalho'
  return `Todos os membros da Área de trabalho ${name} podem ver e editar este quadro.`
}

export default function BoardVisibilityPopover({
  open,
  visibility = 'public',
  workspaceName,
  onVisibilityChange,
  onClose,
}) {
  const titleId = useId()

  if (!open) return null

  return (
    <div
      className={styles.popover}
      role="dialog"
      aria-labelledby={titleId}
      aria-modal="false"
    >
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>Alterar visibilidade</h2>
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Fechar"
          onClick={onClose}
        >
          <X size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      </header>

      <div className={styles.options} role="radiogroup" aria-label="Visibilidade do quadro">
        {BOARD_VISIBILITY_OPTIONS.map((option) => {
          const {
            id,
            label,
            description,
            Icon,
            disabled = false,
            iconClassName = '',
          } = option
          const isSelected = visibility === id
          const resolvedDescription = id === 'workspace'
            ? resolveWorkspaceDescription(workspaceName)
            : description

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              className={[
                styles.option,
                disabled ? styles.optionDisabled : '',
              ].filter(Boolean).join(' ')}
              onClick={() => {
                if (disabled) return
                onVisibilityChange?.(id)
              }}
            >
              <span
                className={[styles.optionIcon, iconClassName].filter(Boolean).join(' ')}
                aria-hidden="true"
              >
                <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
              </span>
              <span className={styles.optionBody}>
                <span className={styles.optionTitle}>{label}</span>
                {resolvedDescription ? (
                  <span className={styles.optionDescription}>{resolvedDescription}</span>
                ) : null}
              </span>
              {isSelected ? (
                <span className={styles.optionCheck} aria-hidden="true">
                  <Check size={14} strokeWidth={ICON_STROKE} />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
