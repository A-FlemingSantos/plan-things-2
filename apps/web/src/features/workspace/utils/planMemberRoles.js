export const PLAN_MEMBER_ROLES = ['OWNER', 'ADMIN', 'MEMBER']

export const PLAN_INVITE_ROLE_OPTIONS = [
  { value: 'MEMBER', label: 'Membro' },
  { value: 'ADMIN', label: 'Admin' },
]

export const PLAN_SHARE_ROLE_OPTIONS = [
  { value: 'MEMBER', label: 'Membro' },
  { value: 'OBSERVER', label: 'Observador' },
  { value: 'ADMIN', label: 'Admin' },
]

export const PLAN_MEMBER_ROLE_EDIT_OPTIONS = [
  { value: 'MEMBER', label: 'Membro' },
  { value: 'ADMIN', label: 'Admin' },
]

export function formatPlanMemberRole(role) {
  if (role === 'OWNER') return 'Proprietário'
  if (role === 'ADMIN') return 'Admin'
  if (role === 'OBSERVER') return 'Observador'
  if (role === 'MEMBER') return 'Membro'
  return 'Membro'
}

export function getShareRoleOption(role) {
  return PLAN_SHARE_ROLE_OPTIONS.find((option) => option.value === role) ?? PLAN_SHARE_ROLE_OPTIONS[0]
}

export function getNextShareRole(role) {
  const currentIndex = PLAN_SHARE_ROLE_OPTIONS.findIndex((option) => option.value === role)
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % PLAN_SHARE_ROLE_OPTIONS.length
  return PLAN_SHARE_ROLE_OPTIONS[nextIndex].value
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
