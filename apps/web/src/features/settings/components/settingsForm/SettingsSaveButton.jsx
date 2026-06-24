import { SettingsIcons } from '../settingsIcons.jsx'
import styles from '../../pages/SettingsPage/SettingsPage.module.css'

export default function SettingsSaveButton({
  saved,
  onClick,
  label = 'Salvar alterações',
  savedLabel = 'Salvo',
}) {
  return (
    <button type="button" className={`${styles.btnPrimary} ${saved ? styles.btnSaved : ''}`} onClick={onClick}>
      {saved ? (
        <><span className={styles.btnCheckIcon}><SettingsIcons.Check /></span>{savedLabel}</>
      ) : label}
    </button>
  )
}
