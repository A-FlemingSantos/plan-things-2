import { Check, Clock, Users } from 'lucide-react'
import { getChecklistAssigneeName } from '../utils/checklistUtils.js'

export default function CardModalChecklist({
  styles,
  iconSize,
  iconSizeSm,
  iconStroke,
  isBackendDriven,
  activeChecklist,
  checklistReadOnly,
  canDeletePersistedChecklist,
  isChecklistMutating,
  togglingChecklistItemId,
  checklistComposerOpen,
  setChecklistComposerOpen,
  newChecklistItem,
  setNewChecklistItem,
  checklistItemTextareaRef,
  handleChecklistItemAdd,
  closeChecklistComposer,
  isChecklistAssignAccentActive,
  isChecklistDueAccentActive,
  checklistDueLabel,
  showChecklistAssignMenu,
  setShowChecklistAssignMenu,
  showChecklistDueMenu,
  setShowChecklistDueMenu,
  checklistAssignButtonRef,
  checklistDueButtonRef,
  checklistAssigneeUserId,
  handleChecklistDelete,
  toggleChecklistItem,
}) {
  if (!activeChecklist) {
    return null
  }

  return (
    <div className={styles.cmChecklistBlock}>
      <div className={styles.cmChecklistBlockHeader}>
        <div className={styles.cmChecklistBlockTitleWrap}>
          <span className={styles.cmChecklistBlockIcon}><Check size={iconSizeSm} strokeWidth={iconStroke} aria-hidden="true" /></span>
          <p className={styles.cmChecklistBlockTitle}>{activeChecklist.title}</p>
        </div>
        {(!isBackendDriven || canDeletePersistedChecklist) && (
          <button
            type="button"
            className={styles.cmChecklistDeleteBtn}
            onClick={handleChecklistDelete}
            disabled={isChecklistMutating}
          >
            {isChecklistMutating ? 'Excluindo...' : 'Excluir'}
          </button>
        )}
      </div>

      <div className={styles.cmChecklistProgressRow}>
        <span className={styles.cmChecklistProgressLabel}>
          {activeChecklist.items.length === 0
            ? '0%'
            : `${Math.round((activeChecklist.items.filter(item => item.checked).length / activeChecklist.items.length) * 100)}%`}
        </span>
        <div className={styles.cmChecklistProgressBar}>
          <span
            className={styles.cmChecklistProgressFill}
            style={{
              width: activeChecklist.items.length === 0
                ? '0%'
                : `${Math.round((activeChecklist.items.filter(item => item.checked).length / activeChecklist.items.length) * 100)}%`,
            }}
          />
        </div>
      </div>

      {activeChecklist.items.length > 0 && (
        <div className={styles.cmChecklistItems}>
          {activeChecklist.items.map(item => (
            <label key={item.id} className={styles.cmChecklistItemRow}>
              <button
                type="button"
                className={`${styles.cmChecklistItemCheckbox} ${item.checked ? styles.cmChecklistItemCheckboxActive : ''}`}
                onClick={() => toggleChecklistItem(item.id)}
                disabled={checklistReadOnly || togglingChecklistItemId === item.id}
              >
                {item.checked && <Check size={iconSizeSm} strokeWidth={iconStroke} aria-hidden="true" />}
              </button>
              <div className={styles.cmChecklistItemBody}>
                <span className={`${styles.cmChecklistItemText} ${item.checked ? styles.cmChecklistItemTextChecked : ''}`}>
                  {item.text}
                </span>
                {(getChecklistAssigneeName(item) || item.dueAt?.text) && (
                  <span className={styles.cmChecklistItemMeta}>
                    {getChecklistAssigneeName(item) || 'Sem responsável'}
                    {item.dueAt?.text ? ` · ${item.dueAt.text}` : ''}
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
      )}

      {!checklistReadOnly && checklistComposerOpen ? (
        <>
          <textarea
            ref={checklistItemTextareaRef}
            className={styles.cmChecklistItemInput}
            placeholder="Adicionar um item"
            value={newChecklistItem}
            onChange={e => setNewChecklistItem(e.target.value)}
            rows={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleChecklistItemAdd()
              }
            }}
          />

          <div className={styles.cmChecklistActions}>
            <button
              type="button"
              className={styles.cmChecklistPrimaryBtn}
              onClick={handleChecklistItemAdd}
              disabled={isChecklistMutating || !newChecklistItem.trim()}
            >
              {isChecklistMutating ? 'Adicionando...' : 'Adicionar'}
            </button>
            <button
              type="button"
              className={styles.cmChecklistSecondaryBtn}
              onClick={closeChecklistComposer}
              disabled={isChecklistMutating}
            >
              Cancelar
            </button>
            <button
              ref={checklistAssignButtonRef}
              type="button"
              className={`${styles.cmChecklistMetaBtn} ${isChecklistAssignAccentActive ? styles.cmChecklistMetaBtnActive : ''}`}
              onClick={() => setShowChecklistAssignMenu(v => !v)}
              aria-expanded={showChecklistAssignMenu}
              aria-haspopup="menu"
              disabled={isChecklistMutating}
            >
              <Users size={iconSize} strokeWidth={iconStroke} aria-hidden="true" /> {checklistAssigneeUserId ? 'Responsável definido' : 'Atribuir'}
            </button>
            <button
              ref={checklistDueButtonRef}
              type="button"
              className={`${styles.cmChecklistMetaBtn} ${isChecklistDueAccentActive ? styles.cmChecklistMetaBtnActive : ''}`}
              onClick={() => setShowChecklistDueMenu(v => !v)}
              aria-expanded={showChecklistDueMenu}
              aria-haspopup="dialog"
              disabled={isChecklistMutating}
            >
              <Clock size={iconSize} strokeWidth={iconStroke} aria-hidden="true" /> {checklistDueLabel}
            </button>
          </div>
        </>
      ) : !checklistReadOnly ? (
        <button
          type="button"
          className={styles.cmChecklistAddItemBtn}
          onClick={() => setChecklistComposerOpen(true)}
          disabled={isChecklistMutating}
        >
          Adicionar um item
        </button>
      ) : null}

      {checklistReadOnly && (
        <p className={styles.cmChecklistNotice}>
          Checklist exibido em modo somente leitura enquanto finalizamos a integração completa dessa área.
        </p>
      )}
    </div>
  )
}
