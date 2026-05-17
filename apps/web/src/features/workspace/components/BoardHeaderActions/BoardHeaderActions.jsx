import MemberAvatarStack from '../../../../shared/components/MemberAvatarStack/MemberAvatarStack.jsx'

export default function BoardHeaderActions({
  members,
  icons,
  styles,
  onAddMember,
  onOpenMembers,
  membersButtonRef,
  membersLoading = false,
  membersPlaceholderCount = 0,
  onFilter,
  onShare,
  notifications = null,
}) {
  return (
    <div className={styles.boardHeaderActions}>
      <div className={styles.boardHeaderIdentityRow}>
        <MemberAvatarStack
          members={members}
          onAddMember={onAddMember}
          AddIcon={icons.Plus}
          onOpenMembers={onOpenMembers}
          membersButtonRef={membersButtonRef}
          MembersIcon={icons.Users}
          membersTitle="Membros do plano"
          isLoading={membersLoading}
          placeholderCount={membersPlaceholderCount}
        />

        <div className={styles.boardHeaderUtilityGroup}>
          {notifications ? (
            <div className={styles.boardHeaderUtilitySlot}>
              {notifications}
            </div>
          ) : null}

          <button
            type="button"
            className={styles.boardHeaderIconBtn}
            onClick={onFilter}
            aria-label="Filtrar"
          >
            <icons.Filter />
          </button>

          <button
            type="button"
            className={styles.boardHeaderIconBtn}
            onClick={onShare}
            aria-label="Compartilhar"
          >
            <icons.Share />
          </button>
        </div>
      </div>

      <div className={styles.boardHeaderCommandRow}>
        <button type="button" className={styles.boardHeaderBtn} onClick={onFilter}>
          <icons.Filter /> Filtrar
        </button>
        <button type="button" className={styles.boardHeaderBtnPrimary} onClick={onShare}>
          <icons.Share /> Compartilhar
        </button>
      </div>
    </div>
  )
}
