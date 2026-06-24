import styles from '../../pages/SettingsPage/SettingsPage.module.css'

export default function SettingsAutoSaveStatus({
  state = 'idle',
  errorMessage = '',
  successMessage = '',
}) {
  if (state === 'saving') {
    return <p className={`${styles.autoSaveStatus} ${styles.autoSaveStatusSaving}`}>Salvando...</p>
  }
  if (state === 'saved') {
    return <p className={`${styles.autoSaveStatus} ${styles.autoSaveStatusSaved}`}>{successMessage || 'Salvo automaticamente'}</p>
  }
  if (state === 'error') {
    return (
      <p className={`${styles.autoSaveStatus} ${styles.autoSaveStatusError}`}>
        {errorMessage || 'Nao foi possivel salvar automaticamente.'}
      </p>
    )
  }
  return null
}
