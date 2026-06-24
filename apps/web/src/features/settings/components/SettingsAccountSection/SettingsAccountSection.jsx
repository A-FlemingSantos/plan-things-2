import { SettingsIcons } from '../settingsIcons.jsx'
import {
  SettingsAutoSaveStatus,
  SettingsField,
  SettingsSaveButton,
  SettingsSectionGroup,
} from '../settingsForm/index.js'
import styles from '../../pages/SettingsPage/SettingsPage.module.css'

export const AVATAR_ACCEPT = 'image/png,image/jpeg,image/webp'

export default function SettingsAccountSection({
  fullName,
  currentUserEmail,
  userInitials,
  accountAvatarPreview,
  accountAvatarUrl,
  accountAvatarState,
  accountAvatarFeedback,
  accountSaveState,
  accountFeedback,
  accountSaved,
  showPassForm,
  curPass,
  newPass,
  confirmPass,
  showCurPass,
  showNewPass,
  passwordSaveState,
  passwordFeedback,
  canSetupPasswordWithoutCurrent,
  passwordActionLabel,
  passwordHint,
  accountAvatarInputRef,
  onFullNameChange,
  onSaveAccount,
  onAvatarSelected,
  onRemoveAvatar,
  onOpenPasswordForm,
  onCurPassChange,
  onNewPassChange,
  onConfirmPassChange,
  onToggleShowCurPass,
  onToggleShowNewPass,
  onSavePassword,
  onCancelPassword,
}) {
  return (
    <>
      <SettingsSectionGroup title="Perfil">
        <div className={styles.avatarRow}>
          <div className={styles.avatarCircle}>
            {accountAvatarPreview ? (
              <img className={styles.avatarImage} src={accountAvatarPreview} alt="" />
            ) : userInitials}
          </div>
          <div className={styles.avatarMeta}>
            <p className={styles.avatarName}>{fullName || 'Usuário'}</p>
            <p className={styles.avatarHint}>PNG, JPG ou WebP. Máximo 2 MB.</p>
            <input
              ref={accountAvatarInputRef}
              type="file"
              className={styles.fileInput}
              accept={AVATAR_ACCEPT}
              onChange={onAvatarSelected}
            />
            <div className={styles.avatarActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => accountAvatarInputRef.current?.click()}
                disabled={accountAvatarState === 'saving'}
              >
                <SettingsIcons.Upload /> Alterar foto
              </button>
              {(accountAvatarPreview || accountAvatarUrl) && (
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={onRemoveAvatar}
                  disabled={accountAvatarState === 'saving'}
                >
                  Remover
                </button>
              )}
            </div>
            <SettingsAutoSaveStatus state={accountAvatarState} errorMessage={accountAvatarFeedback} successMessage={accountAvatarFeedback} />
          </div>
        </div>

        <SettingsField label="Nome completo" htmlFor="full-name">
          <input
            id="full-name"
            type="text"
            className={styles.input}
            value={fullName}
            onChange={onFullNameChange}
            placeholder="Seu nome completo"
          />
        </SettingsField>

        <SettingsField
          label="E-mail"
          hint="Não é possível alterar o e-mail no momento."
          htmlFor="email"
        >
          <input
            id="email"
            type="email"
            className={`${styles.input} ${styles.inputReadonly}`}
            value={currentUserEmail ?? ''}
            readOnly
          />
        </SettingsField>

        <div className={styles.rowActions}>
          <SettingsSaveButton saved={accountSaved} onClick={onSaveAccount} />
          <SettingsAutoSaveStatus state={accountSaveState} errorMessage={accountFeedback} />
        </div>
      </SettingsSectionGroup>

      <SettingsSectionGroup title="Acesso">
        <SettingsField
          label="Senha"
          hint={passwordHint}
        >
          {!showPassForm ? (
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onOpenPasswordForm}
            >
              {passwordActionLabel}
            </button>
          ) : (
            <div className={styles.passForm}>
              {!canSetupPasswordWithoutCurrent && (
                <div className={styles.passField}>
                  <input
                    type={showCurPass ? 'text' : 'password'}
                    className={styles.input}
                    placeholder="Senha atual"
                    value={curPass}
                    onChange={onCurPassChange}
                  />
                  <button type="button" className={styles.eyeBtn} onClick={onToggleShowCurPass}>
                    {showCurPass ? <SettingsIcons.EyeOff /> : <SettingsIcons.Eye />}
                  </button>
                </div>
              )}
              <div className={styles.passField}>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Nova senha (mínimo 8 caracteres)"
                  value={newPass}
                  onChange={onNewPassChange}
                />
                <button type="button" className={styles.eyeBtn} onClick={onToggleShowNewPass}>
                  {showNewPass ? <SettingsIcons.EyeOff /> : <SettingsIcons.Eye />}
                </button>
              </div>
              <input
                type="password"
                className={styles.input}
                placeholder="Confirmar nova senha"
                value={confirmPass}
                onChange={onConfirmPassChange}
              />
              <div className={styles.rowActions}>
                <button type="button" className={styles.btnPrimary} onClick={onSavePassword}>
                  {canSetupPasswordWithoutCurrent ? 'Salvar senha local' : 'Salvar nova senha'}
                </button>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={onCancelPassword}
                >
                  Cancelar
                </button>
              </div>
              {(passwordFeedback || passwordSaveState === 'saving') && (
                <SettingsAutoSaveStatus state={passwordSaveState} errorMessage={passwordFeedback} />
              )}
            </div>
          )}
          {!showPassForm && (passwordFeedback || passwordSaveState === 'saving') && (
            <SettingsAutoSaveStatus state={passwordSaveState} errorMessage={passwordFeedback} />
          )}
        </SettingsField>
      </SettingsSectionGroup>
    </>
  )
}
