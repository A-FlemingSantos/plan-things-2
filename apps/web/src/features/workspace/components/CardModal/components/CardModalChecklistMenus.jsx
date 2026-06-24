import {
  Check,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import AuthenticatedAvatar from '../../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import {
  formatCalendarInputValue,
  formatCalendarMonthLabel,
} from '../utils/cardModalDateUtils.js'

export function CardModalChecklistCreateMenu({
  styles,
  iconSize,
  iconStroke,
  showChecklistMenu,
  checklistMenuRef,
  checklistMenuPosition,
  checklistTitle,
  setChecklistTitle,
  handleChecklistCreate,
  isChecklistMutating,
  setShowChecklistMenu,
}) {
  if (!showChecklistMenu) {
    return null
  }

  return (
    <div
      ref={checklistMenuRef}
      className={styles.cmChecklistMenu}
      style={{ top: `${checklistMenuPosition.top}px`, left: `${checklistMenuPosition.left}px` }}
      onClick={e => e.stopPropagation()}
      role="dialog"
      aria-modal="false"
    >
      <div className={styles.cmChecklistMenuHeader}>
        <h3 className={styles.cmChecklistMenuTitle}>Adicionar checklist</h3>
        <button type="button" className={styles.cmChecklistMenuClose} onClick={() => setShowChecklistMenu(false)}>
          <X size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.cmChecklistMenuBody}>
        <label className={styles.cmChecklistMenuLabel}>Título</label>
        <input
          type="text"
          className={styles.cmChecklistMenuInput}
          value={checklistTitle}
          onChange={e => setChecklistTitle(e.target.value)}
          aria-label="Título do checklist"
        />
        <button
          type="button"
          className={styles.cmChecklistMenuAdd}
          onClick={handleChecklistCreate}
          disabled={isChecklistMutating}
        >
          {isChecklistMutating ? 'Adicionando...' : 'Adicionar'}
        </button>
      </div>
    </div>
  )
}

export function CardModalChecklistAssignMenu({
  styles,
  iconSize,
  iconSizeSm,
  iconStroke,
  showChecklistAssignMenu,
  checklistAssignMenuRef,
  checklistAssignMenuPosition,
  members,
  getMemberName,
  checklistAssigneeUserId,
  setChecklistAssigneeUserId,
  setShowChecklistAssignMenu,
}) {
  if (!showChecklistAssignMenu) {
    return null
  }

  return (
    <div
      ref={checklistAssignMenuRef}
      className={styles.cmChecklistCompactMenu}
      style={{ top: `${checklistAssignMenuPosition.top}px`, left: `${checklistAssignMenuPosition.left}px` }}
      onClick={e => e.stopPropagation()}
      role="menu"
    >
      {members.map(member => (
        <button
          key={member.id}
          type="button"
          className={`${styles.cmChecklistCompactItem} ${checklistAssigneeUserId === member.id ? styles.cmChecklistCompactItemActive : ''}`}
          onClick={() => {
            setChecklistAssigneeUserId((current) => (current === member.id ? null : member.id))
            setShowChecklistAssignMenu(false)
          }}
        >
          <AuthenticatedAvatar
            className={styles.cmMemberAvatar}
            imageClassName={styles.avatarImage}
            style={{ background: member.color }}
            avatarUrl={member.avatarUrl}
            fallback={member.initials}
            title={getMemberName(member)}
          />
          <span>{getMemberName(member)}</span>
          {checklistAssigneeUserId === member.id && (
            <span className={styles.cmLabelCheck}>
              <Check size={iconSizeSm} strokeWidth={iconStroke} aria-hidden="true" />
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export function CardModalChecklistDueMenu({
  styles,
  iconSize,
  iconSizeSm,
  iconStroke,
  showChecklistDueMenu,
  checklistDueMenuRef,
  checklistDueMenuPosition,
  checklistDateMenuMonth,
  setChecklistDateMenuMonth,
  checklistDateMenuDays,
  checklistSelectedDay,
  setChecklistSelectedDay,
  checklistStartEnabled,
  setChecklistStartEnabled,
  checklistStartDateValue,
  setChecklistStartDateValue,
  checklistDueEnabled,
  setChecklistDueEnabled,
  checklistDueValue,
  setChecklistDueValue,
  setShowChecklistDueMenu,
}) {
  if (!showChecklistDueMenu) {
    return null
  }

  return (
    <div
      ref={checklistDueMenuRef}
      className={styles.cmChecklistDateMenu}
      style={{ top: `${checklistDueMenuPosition.top}px`, left: `${checklistDueMenuPosition.left}px` }}
      onClick={e => e.stopPropagation()}
      role="dialog"
      aria-modal="false"
    >
      <div className={styles.cmChecklistDateMenuHeader}>
        <h3 className={styles.cmChecklistDateMenuTitle}>Datas</h3>
        <button type="button" className={styles.cmChecklistDateMenuClose} onClick={() => setShowChecklistDueMenu(false)}>
          <X size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.cmChecklistDateMenuMonthBar}>
        <div className={styles.cmChecklistDateMenuMonthNav}>
          <button type="button" className={styles.cmChecklistDateMenuNavBtn} onClick={() => setChecklistDateMenuMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} aria-label="Mês anterior">
            <ChevronLeft size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
          </button>
        </div>
        <span className={styles.cmChecklistDateMenuMonthLabel}>{formatCalendarMonthLabel(checklistDateMenuMonth)}</span>
        <div className={styles.cmChecklistDateMenuMonthNav}>
          <button type="button" className={styles.cmChecklistDateMenuNavBtn} onClick={() => setChecklistDateMenuMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} aria-label="Próximo mês">
            <ChevronRight size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={styles.cmChecklistDateMenuWeekdays}>
        {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map(day => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className={styles.cmChecklistDateMenuGrid}>
        {checklistDateMenuDays.map((day, index) => (
          <button
            key={`${day.label}-${index}`}
            type="button"
            className={`${styles.cmChecklistDateMenuDay} ${day.muted ? styles.cmChecklistDateMenuDayMuted : ''} ${checklistSelectedDay === day.label && !day.muted ? styles.cmChecklistDateMenuDaySelected : ''}`}
            onClick={() => {
              if (day.muted) return
              setChecklistSelectedDay(day.label)
              setChecklistDueEnabled(true)
              setChecklistDueValue(formatCalendarInputValue(day.label, checklistDateMenuMonth))
            }}
          >
            <span className={day.underline ? styles.cmChecklistDateMenuDayUnderline : ''}>{day.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.cmChecklistDateMenuFields}>
        <div className={styles.cmChecklistDateMenuFieldGroup}>
          <label className={styles.cmChecklistDateMenuFieldLabel}>Data de início</label>
          <div className={styles.cmChecklistDateMenuInputRow}>
            <button
              type="button"
              className={`${styles.cmDateCheckbox} ${checklistStartEnabled ? styles.cmDateCheckboxActive : ''}`}
              onClick={() => setChecklistStartEnabled(v => !v)}
            >
              {checklistStartEnabled && <Check size={iconSizeSm} strokeWidth={iconStroke} aria-hidden="true" />}
            </button>
            <input
              type="text"
              className={styles.cmChecklistDateMenuInput}
              placeholder="D/M/AAAA"
              value={checklistStartDateValue}
              onChange={e => setChecklistStartDateValue(e.target.value)}
              disabled={!checklistStartEnabled}
              aria-label="Data inicial do checklist"
            />
          </div>
        </div>

        <div className={styles.cmChecklistDateMenuFieldGroup}>
          <label className={styles.cmChecklistDateMenuFieldLabel}>Data de entrega</label>
          <div className={styles.cmChecklistDateMenuInputRow}>
            <button
              type="button"
              className={`${styles.cmDateCheckbox} ${checklistDueEnabled ? styles.cmDateCheckboxActive : ''}`}
              onClick={() => {
                setChecklistDueEnabled(v => !v)
                if (checklistDueEnabled) {
                  setChecklistDueValue('')
                } else if (!checklistDueValue) {
                  setChecklistDueValue(formatCalendarInputValue(checklistSelectedDay, checklistDateMenuMonth))
                }
              }}
            >
              {checklistDueEnabled && <Check size={iconSizeSm} strokeWidth={iconStroke} aria-hidden="true" />}
            </button>
            <input
              type="text"
              className={styles.cmChecklistDateMenuInput}
              value={checklistDueValue}
              onChange={e => setChecklistDueValue(e.target.value)}
              disabled={!checklistDueEnabled}
              aria-label="Data de entrega do checklist"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
