import styles from '../../pages/SettingsPage/SettingsPage.module.css'

export default function SettingsField({
  label,
  hint,
  htmlFor,
  children,
  row = true,
  inlineControl = false,
}) {
  const className = [
    row ? styles.field : styles.fieldBlock,
    row && inlineControl ? styles.fieldInlineControl : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={className}>
      <div className={styles.fieldMeta}>
        <label className={styles.fieldLabel} htmlFor={htmlFor}>{label}</label>
        {hint && <p className={styles.fieldHint}>{hint}</p>}
      </div>
      <div className={styles.fieldControl}>{children}</div>
    </div>
  )
}
