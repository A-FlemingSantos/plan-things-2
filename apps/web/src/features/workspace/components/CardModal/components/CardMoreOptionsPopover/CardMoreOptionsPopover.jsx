import {
  Archive,
  Copy,
  Eye,
  LayoutTemplate,
  MoveRight,
  Share2,
  SquareStack,
  UserPlus,
} from 'lucide-react'
import styles from './CardMoreOptionsPopover.module.css'

const ICON_SIZE = 15
const ICON_STROKE = 1.75

export const CARD_MORE_OPTIONS_SECTIONS = [
  [
    { id: 'join', label: 'Ingressar', Icon: UserPlus },
    { id: 'move', label: 'Mover', Icon: MoveRight },
    { id: 'copy', label: 'Copiar', Icon: Copy },
    { id: 'mirror', label: 'Espelho', Icon: SquareStack },
    { id: 'template', label: 'Criar template', Icon: LayoutTemplate },
    { id: 'follow', label: 'Seguir', Icon: Eye },
  ],
  [
    { id: 'share', label: 'Compartilhar', Icon: Share2 },
    { id: 'archive', label: 'Arquivar', Icon: Archive },
  ],
]

export default function CardMoreOptionsPopover({
  open,
  isFollowing = false,
  onAction,
  onClose,
}) {
  if (!open) return null

  return (
    <div
      className={styles.popover}
      role="menu"
      aria-label="Mais opções do cartão"
      onMouseDown={(event) => event.stopPropagation()}
    >
      {CARD_MORE_OPTIONS_SECTIONS.map((section, sectionIndex) => (
        <div key={section.map((item) => item.id).join('-')} className={styles.section}>
          {sectionIndex > 0 ? <div className={styles.divider} role="separator" /> : null}
          {section.map(({ id, label, Icon }) => {
            const resolvedLabel = id === 'follow' && isFollowing ? 'Deixar de seguir' : label

            return (
              <button
                key={id}
                type="button"
                role="menuitem"
                className={styles.item}
                onClick={() => {
                  onAction?.(id)
                  onClose?.()
                }}
              >
                <span className={styles.itemIcon} aria-hidden="true">
                  <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                </span>
                <span className={styles.itemLabel}>{resolvedLabel}</span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
