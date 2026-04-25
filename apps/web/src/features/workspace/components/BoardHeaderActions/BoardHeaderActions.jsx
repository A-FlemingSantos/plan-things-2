import MemberAvatarStack from '../../../../shared/components/MemberAvatarStack/MemberAvatarStack.jsx'

export default function BoardHeaderActions({
  members,
  icons,
  styles,
  onAddMember,
  onOpenMembers,
  membersButtonRef,
  onFilter,
  onShare,
  notifications = null,
}) {
  return (
    <>
      <MemberAvatarStack
        members={members}
        onAddMember={onAddMember}
        AddIcon={icons.Plus}
        onOpenMembers={onOpenMembers}
        membersButtonRef={membersButtonRef}
        MembersIcon={icons.Users}
        membersTitle="Membros do plano"
      />

      <div className={styles.boardHeaderDivider} />

      {notifications}
      <button type="button" className={styles.boardHeaderBtn} onClick={onFilter}>
        <icons.Filter /> Filtrar
      </button>
      <button type="button" className={styles.boardHeaderBtnPrimary} onClick={onShare}>
        <icons.Share /> Compartilhar
      </button>
    </>
  )
}
