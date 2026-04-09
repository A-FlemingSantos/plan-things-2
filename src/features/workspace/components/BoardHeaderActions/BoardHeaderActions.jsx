import MemberAvatarStack from '../../../../shared/components/MemberAvatarStack/MemberAvatarStack.jsx'

export default function BoardHeaderActions({
  members,
  icons,
  styles,
  onAddMember,
  onFilter,
  onShare,
}) {
  return (
    <>
      <MemberAvatarStack
        members={members}
        onAddMember={onAddMember}
        AddIcon={icons.Plus}
      />

      <div className={styles.boardHeaderDivider} />

      <button type="button" className={styles.boardHeaderBtn} onClick={onFilter}>
        <icons.Filter /> Filter
      </button>
      <button type="button" className={styles.boardHeaderBtnPrimary} onClick={onShare}>
        <icons.Share /> Share
      </button>
    </>
  )
}
