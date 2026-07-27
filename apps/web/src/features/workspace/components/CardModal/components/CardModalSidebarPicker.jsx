import { ListChecks, MessageSquareText, Paperclip } from 'lucide-react'
import { SiGithub } from 'react-icons/si'

const SIDEBAR_OPTIONS = [
  { id: 'github', label: 'GitHub', Icon: SiGithub },
  { id: 'activity', label: 'Activity', Icon: MessageSquareText },
  { id: 'files', label: 'Arquivos', Icon: Paperclip },
  { id: 'checklist', label: 'Checklist', Icon: ListChecks },
]

export default function CardModalSidebarPicker({
  styles,
  iconSize,
  iconStroke,
  isMutating,
  onSelectPanel,
}) {
  return (
    <div className={styles.cmSidebarPicker}>
      <div className={styles.cmSidebarPickerGrid} role="group" aria-label="Painéis laterais">
        {SIDEBAR_OPTIONS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={styles.cmSidebarPickerOption}
            onClick={() => onSelectPanel(id)}
            disabled={isMutating}
            aria-label={label}
          >
            <span className={styles.cmSidebarPickerOptionIcon} aria-hidden="true">
              {id === 'github' ? (
                <Icon size={iconSize + 3} aria-hidden="true" />
              ) : (
                <Icon size={iconSize + 5} strokeWidth={iconStroke} aria-hidden="true" />
              )}
            </span>
            <span className={styles.cmSidebarPickerOptionLabel}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
