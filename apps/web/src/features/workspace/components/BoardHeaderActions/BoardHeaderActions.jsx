import MemberAvatarStack from '../../../../shared/components/MemberAvatarStack/MemberAvatarStack.jsx'

export default function BoardHeaderActions({
  members,
  icons,
  styles,
  onAddMember,
  onOpenMembers,
  onFilter,
  onShare,
}) {
  return (
    <>
      <MemberAvatarStack
        members={members}
        onAddMember={onAddMember}
        AddIcon={icons.Plus}
        onOpenMembers={onOpenMembers}
        MembersIcon={icons.Users}
        membersTitle="Membros do plano"
      />

      <div className={styles.boardHeaderDivider} />

      <button type="button" className={styles.boardHeaderBtn} onClick={onFilter}>
        <icons.Filter /> Filtrar
      </button>
      <button type="button" className={styles.boardHeaderBtnPrimary} onClick={onShare}>
        <icons.Share /> Compartilhar
      </button>
    </>
  )
}
