import { createClientId } from './ids.js'
import { shortMonthLabel, toDate } from './dates.js'

const MEMBER_COLORS = ['#000000', '#4290da', '#0f703a', '#d4aef1', '#ff6766', '#f5a623']
const PLAN_COVERS = ['#f4f0ff', '#f0fff5', '#fff9f0', '#fff0f0', '#f0f6ff', '#f5f5f5']

export function normalizePlanRecord(plan = {}) {
  return {
    ...plan,
    id: plan.id ?? createClientId('plan'),
    name: plan.name ?? 'Plano sem titulo',
    description: plan.description ?? '',
    tag: plan.tag ?? 'Geral',
    tagColor: plan.tagColor ?? '#a0a0a0',
    members: Array.isArray(plan.members) ? plan.members.filter(Boolean) : [],
    date: plan.date ?? '',
    tasks: Number.isFinite(plan.tasks) ? plan.tasks : 0,
    cover: plan.cover ?? '#f5f5f5',
    boardColumns: Array.isArray(plan.boardColumns) ? plan.boardColumns : [],
  }
}

function buildMemberColor(index) {
  return MEMBER_COLORS[index % MEMBER_COLORS.length]
}

function buildInitials(fullName = '') {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'PT'
}

function mapRoleToTag(role) {
  if (role === 'OWNER') return { tag: 'Owner', tagColor: '#0f703a' }
  if (role === 'ADMIN') return { tag: 'Admin', tagColor: '#4290da' }
  return { tag: 'Membro', tagColor: '#a0a0a0' }
}

function buildMemberDots(memberCount, offset = 0) {
  return Array.from({ length: Math.max(memberCount, 0) }, (_, index) => buildMemberColor(index + offset))
}

export function mapPlanSummaryToRecord(summary, index = 0) {
  const roleMeta = mapRoleToTag(summary.role)
  const date = toDate(summary.updatedAt?.iso ?? summary.createdAt?.iso)
  const coverColor = summary.cover ?? null
  const cover = coverColor ?? PLAN_COVERS[index % PLAN_COVERS.length]

  return normalizePlanRecord({
    id: summary.id,
    name: summary.name,
    description: summary.description ?? '',
    tag: roleMeta.tag,
    tagColor: roleMeta.tagColor,
    members: buildMemberDots(summary.memberCount, index),
    date: date ? shortMonthLabel(date) : '',
    tasks: Number.isFinite(summary.taskCount) ? summary.taskCount : 0,
    cover,
    coverThemeId: summary.coverThemeId ?? null,
    coverImageId: summary.coverImageId ?? null,
    role: summary.role,
    memberCount: summary.memberCount,
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt,
    labelsMeta: [],
    membersMeta: [],
    boardLoaded: false,
  })
}

export function mergePlanDetails(plan, details) {
  const membersMeta = (details.members ?? []).map((member, index) => ({
    id: member.userId,
    initials: buildInitials(member.fullName),
    color: buildMemberColor(index),
    name: member.fullName,
    email: member.email,
    avatarUrl: member.avatarUrl ?? null,
    role: member.role,
  }))

  const labelsMeta = (details.labels ?? []).map((label) => ({
    id: label.id,
    text: label.name,
    name: label.name,
    color: label.color,
  }))

  return {
    ...plan,
    role: details.plan?.role ?? plan.role,
    memberCount: details.plan?.memberCount ?? plan.memberCount,
    tasks: Number.isFinite(details.plan?.taskCount) ? details.plan.taskCount : plan.tasks,
    coverThemeId: details.plan?.coverThemeId ?? plan.coverThemeId ?? null,
    coverImageId: details.plan?.coverImageId ?? plan.coverImageId ?? null,
    cover: details.plan?.cover ?? plan.cover,
    createdAt: details.plan?.createdAt ?? plan.createdAt,
    updatedAt: details.plan?.updatedAt ?? plan.updatedAt,
    members: membersMeta.map((member) => member.color),
    membersMeta,
    labelsMeta,
  }
}

export function buildPlanCreatePayload({ name, description = '', coverThemeId = null, cover = null, coverImageId = null }) {
  return { name, description, coverThemeId, cover, coverImageId }
}
