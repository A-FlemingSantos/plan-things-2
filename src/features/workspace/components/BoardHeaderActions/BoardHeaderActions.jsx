import MemberAvatarStack from '../../../../shared/components/MemberAvatarStack/MemberAvatarStack.jsx'

export default function BoardHeaderActions({
  members,
  icons,
  styles,
}) {
  return (
    <>
      <MemberAvatarStack
        members={members}
        onAddMember={() => {}}
        AddIcon={icons.Plus}
      />

      <div className={styles.boardHeaderDivider} />

      <button type="button" className={styles.boardHeaderBtn}>
        <icons.Filter /> Filter
      </button>
      <button type="button" className={styles.boardHeaderBtnPrimary}>
        <icons.Share /> Share
      </button>
    </>
  )
}
