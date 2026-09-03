import {
  Archive,
  Blocks,
  Copy,
  Download,
  History,
  Info,
  Minus,
  Star,
  Tag,
  Zap,
} from 'lucide-react'
import { SiGithub } from 'react-icons/si'
import PlanCoverThumbnail from '../workspaceCover/PlanCoverThumbnail.jsx'
import styles from './BoardMoreOptionsPopover.module.css'

const ICON_SIZE = 15
const ICON_STROKE = 1.75
const TRAILING_ICON_SIZE = 13

export const BOARD_MORE_OPTIONS_SECTIONS = [
  [
    {
      id: 'about',
      label: 'Sobre este plano',
      hint: 'Adicione uma descrição ao seu plano',
      Icon: Info,
    },
    { id: 'labels', label: 'Etiquetas', Icon: Tag },
    { id: 'cover', label: 'Alterar capa', useCoverPreview: true },
    { id: 'favorite', label: 'Favoritar', Icon: Star },
  ],
  [
    {
      id: 'integrations',
      label: 'Integrações',
      Icon: Blocks,
      showGitHubBadge: true,
    },
    { id: 'automation', label: 'Automação', Icon: Zap },
    { id: 'export', label: 'Exportar plano', Icon: Download },
  ],
  [
    { id: 'activity', label: 'Atividade', Icon: History },
    { id: 'archived', label: 'Itens arquivados', Icon: Archive },
    { id: 'duplicate', label: 'Copiar plano', Icon: Copy },
  ],
  [
    {
      id: 'close',
      label: 'Fechar plano',
      Icon: Minus,
      danger: true,
    },
  ],
]

export default function BoardMoreOptionsPopover({
  open,
  plan = null,
  hasGitHubIntegration = false,
  isFavorite = false,
  onAction,
}) {
  if (!open) return null

  return (
    <div
      className={styles.popover}
      role="menu"
      aria-label="Mais opções do plano"
      onMouseDown={(event) => event.stopPropagation()}
    >
      {BOARD_MORE_OPTIONS_SECTIONS.map((section, sectionIndex) => (
        <div key={section.map((item) => item.id).join('-')} className={styles.section}>
          {sectionIndex > 0 ? <div className={styles.divider} role="separator" /> : null}
          {section.map((item) => {
            const {
              id,
              label,
              hint,
              Icon,
              useCoverPreview = false,
              danger = false,
              showGitHubBadge = false,
            } = item
            const resolvedLabel = id === 'favorite' && isFavorite ? 'Remover dos favoritos' : label

            return (
              <button
                key={id}
                type="button"
                role="menuitem"
                className={[
                  styles.item,
                  danger ? styles.itemDanger : '',
                  hint ? styles.itemWithHint : '',
                ].filter(Boolean).join(' ')}
                onClick={(event) => {
                  onAction?.(id, event.currentTarget.getBoundingClientRect())
                }}
              >
                <span className={styles.itemIcon} aria-hidden="true">
                  {useCoverPreview ? (
                    <PlanCoverThumbnail plan={plan} className={styles.coverPreview} />
                  ) : (
                    <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                  )}
                </span>
                <span className={styles.itemBody}>
                  <span className={styles.itemLabel}>{resolvedLabel}</span>
                  {hint ? <span className={styles.itemHint}>{hint}</span> : null}
                </span>
                {showGitHubBadge && hasGitHubIntegration ? (
                  <span className={styles.itemTrailing} aria-hidden="true">
                    <SiGithub size={TRAILING_ICON_SIZE} />
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
