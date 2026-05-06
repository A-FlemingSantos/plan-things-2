import AuthenticatedAvatar from '../AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import styles from './MemberAvatarStack.module.css'

export default function MemberAvatarStack({
  members,
  onAddMember = null,
  addTitle = 'Convidar membro',
  AddIcon = null,
  onOpenMembers = null,
  membersButtonRef = null,
  membersTitle = 'Ver membros',
  MembersIcon = null,
  className = '',
}) {
  const wrapperClassName = [styles.stack, className].filter(Boolean).join(' ')

  return (
    <div className={wrapperClassName}>
      {members.map((member) => (
        <AuthenticatedAvatar
          key={member.id}
          className={styles.avatar}
          style={{ background: member.color }}
          avatarUrl={member.avatarUrl}
          fallback={member.initials}
          title={member.name ?? member.email ?? member.initials}
          imageClassName={styles.avatarImage}
        />
      ))}

      {onAddMember ? (
        <button className={styles.addButton} title={addTitle} onClick={onAddMember}>
          {AddIcon ? <AddIcon /> : '+'}
        </button>
      ) : null}

      {onOpenMembers ? (
        <button ref={membersButtonRef} className={styles.membersButton} title={membersTitle} onClick={onOpenMembers}>
          {MembersIcon ? <MembersIcon /> : '👥'}
        </button>
      ) : null}
    </div>
  )
}
