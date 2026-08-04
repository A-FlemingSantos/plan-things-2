function resolveMemberKey(member) {
  return member.id ?? member.email ?? member.name ?? member.initials ?? ''
}

export function buildWorkspaceOverview(plans = []) {
  const totalTasks = plans.reduce((sum, plan) => sum + (Number(plan.tasks) || 0), 0)
  const totalMembers = collectWorkspaceMembers(plans).length

  return {
    planCount: plans.length,
    totalTasks,
    totalMembers,
  }
}

export function collectWorkspaceMembers(plans = []) {
  const membersByKey = new Map()

  plans.forEach((plan) => {
    const planMembers = Array.isArray(plan.membersMeta) && plan.membersMeta.length
      ? plan.membersMeta
      : []

    planMembers.forEach((member) => {
      const key = resolveMemberKey(member)
      if (!key) return

      const existing = membersByKey.get(key) ?? {
        ...member,
        planIds: new Set(),
        planNames: new Set(),
      }

      existing.planIds.add(plan.id)
      existing.planNames.add(plan.name)
      membersByKey.set(key, existing)
    })
  })

  return Array.from(membersByKey.values()).map((member) => ({
    id: member.id,
    initials: member.initials,
    color: member.color,
    name: member.name ?? member.fullName ?? member.email ?? member.initials,
    email: member.email ?? '—',
    avatarUrl: member.avatarUrl ?? null,
    role: member.role ?? 'MEMBER',
    planCount: member.planIds.size,
    status: 'active',
  }))
}

export function buildTasksByPlanSeries(plans = [], limit = 7) {
  return [...plans]
    .sort((left, right) => (Number(right.tasks) || 0) - (Number(left.tasks) || 0))
    .slice(0, limit)
    .map((plan) => ({
      id: plan.id,
      label: plan.name,
      value: Number(plan.tasks) || 0,
    }))
}

export function buildMembersByPlanSeries(plans = [], limit = 5) {
  return [...plans]
    .map((plan) => ({
      id: plan.id,
      label: plan.name,
      value: Array.isArray(plan.membersMeta) && plan.membersMeta.length
        ? plan.membersMeta.length
        : Array.isArray(plan.members)
          ? plan.members.length
          : Number(plan.memberCount) || 0,
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, limit)
}

export function resolveMemberRoleLabel(role = 'MEMBER') {
  switch (role) {
    case 'OWNER':
      return 'Proprietário'
    case 'ADMIN':
      return 'Admin'
    default:
      return 'Membro'
  }
}

export function resolveMemberStatusLabel(status = 'active') {
  return status === 'active' ? 'Ativo' : 'Inativo'
}
