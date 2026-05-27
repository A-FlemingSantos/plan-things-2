import styles from './Toggle.module.css'

export default function Toggle({
  checked = false,
  onChange = null,
  id = undefined,
  disabled = false,
  size = 'default',
  className = '',
  'aria-label': ariaLabel = undefined,
}) {
  const toggleClassName = [
    styles.toggle,
    size === 'compact' ? styles.toggleCompact : '',
    checked ? styles.toggleOn : '',
    disabled ? styles.toggleDisabled : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      className={toggleClassName}
      onClick={() => {
        if (!disabled && onChange) {
          onChange(!checked)
        }
      }}
      disabled={disabled}
    />
  )
}
