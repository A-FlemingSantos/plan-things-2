import {
  AlignStartHorizontal,
  Blocks,
  EllipsisVertical,
  Funnel,
  Globe,
} from 'lucide-react'
import styles from './BoardHeader.module.css'

const ICON_SIZE = 15
const ICON_STROKE = 1.75

const ACTION_ITEMS = [
  { id: 'blocks', Icon: Blocks, label: 'Blocos' },
  { id: 'globe', Icon: Globe, label: 'Globo' },
  { id: 'funnel', Icon: Funnel, label: 'Filtros' },
  { id: 'more', Icon: EllipsisVertical, label: 'Mais opções' },
]

export default function BoardHeader({ planName = 'Plano' }) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.planIcon} aria-hidden="true">
          <AlignStartHorizontal size={ICON_SIZE} strokeWidth={ICON_STROKE} />
        </span>
        <h1 className={styles.planName}>{planName}</h1>
      </div>

      <div className={styles.actions}>
        {ACTION_ITEMS.map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            className={styles.iconButton}
            aria-label={label}
          >
            <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          </button>
        ))}
      </div>
    </header>
  )
}
