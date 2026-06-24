import { CalendarPlus } from 'lucide-react'

export default function PropertyDatesSummary({
  startEnabled,
  startDateValue,
  dueEnabled,
  dueDateValue,
  styles,
  iconSize,
  iconStroke,
}) {
  const hasStart = Boolean(startEnabled && startDateValue)
  const hasDue = Boolean(dueEnabled && dueDateValue)

  return (
    <span className={styles.cmPropertyDatesSummary}>
      <span className={styles.cmPropertyDatesPart}>
        <CalendarPlus size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
        {hasStart ? startDateValue : 'Início'}
      </span>
      <span className={styles.cmPropertyDatesSep} aria-hidden="true">→</span>
      <span className={styles.cmPropertyDatesPart}>
        <CalendarPlus size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
        {hasDue ? dueDateValue : 'Vencimento'}
      </span>
    </span>
  )
}
