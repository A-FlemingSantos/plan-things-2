import AuthenticatedAvatar from '../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import { MoreIcon } from '../../components/WorkspaceIcons/WorkspaceIcons.jsx'
import {
  resolveMemberRoleLabel,
  resolveMemberStatusLabel,
} from './workspaceDashboardUtils.js'
import styles from './Workspace.module.css'

export default function WorkspaceMembersSection({ members = [] }) {
  return (
    <div className={styles.membersTableWrap}>
      <table className={styles.membersTable}>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Membro</th>
            <th scope="col">E-mail</th>
            <th scope="col">Planos</th>
            <th scope="col">Função</th>
            <th scope="col">Status</th>
            <th scope="col" className={styles.membersTableActionsHead}>
              <span className={styles.srOnly}>Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, index) => (
            <tr key={member.id ?? member.email ?? index}>
              <td className={styles.membersTableIndex}>{index + 1}</td>
              <td>
                <div className={styles.membersTablePerson}>
                  <AuthenticatedAvatar
                    avatarUrl={member.avatarUrl}
                    fallback={member.initials}
                    className={styles.membersTableAvatar}
                    imageClassName={styles.membersTableAvatarImage}
                    style={{ background: member.color }}
                    alt={member.name}
                  />
                  <span className={styles.membersTableName}>{member.name}</span>
                </div>
              </td>
              <td className={styles.membersTableEmail}>{member.email}</td>
              <td className={styles.membersTablePlans}>{member.planCount ?? 0}</td>
              <td className={styles.membersTableRole}>{resolveMemberRoleLabel(member.role)}</td>
              <td>
                <span className={`${styles.statusBadge} ${styles.statusBadgeActive}`}>
                  {resolveMemberStatusLabel(member.status)}
                </span>
              </td>
              <td className={styles.membersTableActionsCell}>
                <button
                  type="button"
                  className={styles.membersTableMenuBtn}
                  aria-label={`Opções de ${member.name}`}
                >
                  <MoreIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
