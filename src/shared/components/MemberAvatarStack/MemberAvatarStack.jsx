import styles from './MemberAvatarStack.module.css'

export default function MemberAvatarStack({
  members,
  onAddMember = null,
  addTitle = 'Convidar membro',
  AddIcon = null,
  className = '',
}) {
  const wrapperClassName = [styles.stack, className].filter(Boolean).join(' ')

  return (
    <div className={wrapperClassName}>
      {members.map((member) => (
        <span
          key={member.id}
          className={styles.avatar}
          style={{ background: member.color }}
          title={member.initials}
        >
          {member.initials}
        </span>
      ))}

      {onAddMember ? (
        <button className={styles.addButton} title={addTitle} onClick={onAddMember}>
          {AddIcon ? <AddIcon /> : '+'}
        </button>
      ) : null}
    </div>
  )
}
