export const PLAN_MEMBER_ROLES = ['OWNER', 'ADMIN', 'MEMBER']

export const PLAN_INVITE_ROLE_OPTIONS = [
  { value: 'MEMBER', label: 'Membro' },
  { value: 'ADMIN', label: 'Admin' },
]

export const PLAN_MEMBER_ROLE_EDIT_OPTIONS = [
  { value: 'MEMBER', label: 'Membro' },
  { value: 'ADMIN', label: 'Admin' },
]

export function formatPlanMemberRole(role) {
  if (role === 'OWNER') return 'Proprietário'
  if (role === 'ADMIN') return 'Admin'
  if (role === 'MEMBER') return 'Membro'
  return 'Membro'
}

export function canManagePlanMembers(role) {
  return role === 'OWNER' || role === 'ADMIN'
}

export function canEditMemberRole(planRole, memberRole) {
  if (!canManagePlanMembers(planRole)) return false
  if (memberRole === 'OWNER') return false
  return true
}

export function memberRoleOptionsFor(member) {
  if (member?.role === 'OWNER') {
    return [{ value: 'OWNER', label: formatPlanMemberRole('OWNER') }]
  }

  return PLAN_MEMBER_ROLE_EDIT_OPTIONS
}
