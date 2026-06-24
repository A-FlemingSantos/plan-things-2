import { SettingsAutoSaveStatus } from '../settingsForm/index.js'
import { DELETE_CONFIRMATION_PHRASE, isDeletePhraseValid } from './deleteAccountUtils.js'
import styles from '../../pages/SettingsPage/SettingsPage.module.css'

export default function DeleteAccountDialog({
  currentUserEmail,
  deleteConfirmEmail,
  deleteConfirmPhrase,
  deleteCurrentPassword,
  deleteFeedback,
  deleteState,
  localPasswordEnabled,
  onClose,
  onConfirm,
  onDeleteConfirmEmailChange,
  onDeleteConfirmPhraseChange,
  onDeleteCurrentPasswordChange,
}) {
  const deleteActionDisabled = deleteState === 'saving'
    || deleteConfirmEmail.trim().length === 0
    || !isDeletePhraseValid(deleteConfirmPhrase)
    || (localPasswordEnabled && deleteCurrentPassword.trim().length === 0)

  return (
    <div className={styles.dialogOverlay} role="presentation" onClick={onClose}>
      <div
        className={styles.dialogCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.dialogHeader}>
          <div>
            <p className={styles.dialogEyebrow}>Zona de perigo</p>
            <h3 id="delete-account-title" className={styles.dialogTitle}>Excluir conta</h3>
          </div>
          <button type="button" className={styles.btnGhost} onClick={onClose} disabled={deleteState === 'saving'}>
            Fechar
          </button>
        </div>
        <p className={styles.dialogText}>
          Para confirmar, digite seu e-mail e a frase <strong>{DELETE_CONFIRMATION_PHRASE}</strong>.
          {localPasswordEnabled ? ' Sua senha atual tambem sera solicitada.' : ''}
        </p>
        <div className={styles.dialogFields}>
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="delete-confirm-email">E-mail da conta</label>
            <input
              id="delete-confirm-email"
              type="email"
              className={styles.input}
              value={deleteConfirmEmail}
              onChange={(event) => onDeleteConfirmEmailChange(event.target.value)}
              placeholder={currentUserEmail ?? 'voce@exemplo.com'}
              disabled={deleteState === 'saving'}
            />
          </div>
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="delete-confirm-phrase">Frase de confirmação</label>
            <input
              id="delete-confirm-phrase"
              type="text"
              className={styles.input}
              value={deleteConfirmPhrase}
              onChange={(event) => onDeleteConfirmPhraseChange(event.target.value)}
              placeholder={DELETE_CONFIRMATION_PHRASE}
              disabled={deleteState === 'saving'}
            />
          </div>
          {localPasswordEnabled && (
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor="delete-current-password">Senha atual</label>
              <input
                id="delete-current-password"
                type="password"
                className={styles.input}
                value={deleteCurrentPassword}
                onChange={(event) => onDeleteCurrentPasswordChange(event.target.value)}
                placeholder="Digite sua senha atual"
                disabled={deleteState === 'saving'}
              />
            </div>
          )}
        </div>
        {(deleteFeedback || deleteState === 'saving') && (
          <SettingsAutoSaveStatus state={deleteState} errorMessage={deleteFeedback} successMessage={deleteFeedback} />
        )}
        <div className={styles.dialogActions}>
          <button type="button" className={styles.btnGhost} onClick={onClose} disabled={deleteState === 'saving'}>
            Cancelar
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={onConfirm}
            disabled={deleteActionDisabled}
          >
            {deleteState === 'saving' ? 'Excluindo...' : 'Excluir conta permanentemente'}
          </button>
        </div>
      </div>
    </div>
  )
}
