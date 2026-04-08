import { createEmptyBoardColumns, createSampleBoardColumns } from './boardTemplates.js'
import { createEmptyCanvasState, createSampleCanvasState } from '../../canvas/data/canvasTemplates.js'
import { normalizePlanRecord } from '../../../shared/contracts/planContracts.js'
import { createClientId } from '../../../shared/utils/createClientId.js'

const PLAN_TAGS = {
  marketing: { label: 'Marketing', color: 'var(--color-blue)' },
  engineering: { label: 'Engineering', color: 'var(--color-green)' },
  design: { label: 'Design', color: '#d4aef1' },
  growth: { label: 'Growth', color: 'var(--color-red)' },
}

const PLAN_MEMBER_STYLES = {
  'member-lilac': '#d4aef1',
  'member-blue': '#4290da',
  'member-green': '#0f703a',
  'member-red': '#ff6766',
  'member-black': '#000',
}

const PLAN_COVERS = {
  lilac: '#f4f0ff',
  green: '#f0fff5',
  sand: '#fff9f0',
  rose: '#fff0f0',
  blue: '#f0f6ff',
  neutral: '#f5f5f5',
}

const PLAN_SEEDS = [
  {
    id: 'product-launch-q3',
    name: 'Product Launch — Q3',
    description: 'Full scope for the third quarter release, from design handoff to public rollout.',
    tagId: 'marketing',
    memberIds: ['member-lilac', 'member-blue', 'member-green'],
    date: 'Aug 14',
    tasks: 18,
    coverId: 'lilac',
  },
  {
    id: 'api-redesign',
    name: 'API Redesign',
    description: 'Refactor authentication layer and versioning strategy before the next major release.',
    tagId: 'engineering',
    memberIds: ['member-blue', 'member-red'],
    date: 'Jul 30',
    tasks: 9,
    coverId: 'green',
  },
  {
    id: 'brand-identity-2025',
    name: 'Brand Identity 2025',
    description: 'New visual language, motion guidelines, and updated component library.',
    tagId: 'design',
    memberIds: ['member-lilac', 'member-green', 'member-red', 'member-black'],
    date: 'Sep 3',
    tasks: 24,
    coverId: 'sand',
  },
  {
    id: 'onboarding-revamp',
    name: 'Onboarding Revamp',
    description: 'Reduce time-to-value by rethinking the first-run experience end to end.',
    tagId: 'growth',
    memberIds: ['member-black', 'member-lilac'],
    date: 'Aug 1',
    tasks: 12,
    coverId: 'rose',
  },
  {
    id: 'mobile-app-v2',
    name: 'Mobile App v2',
    description: 'Native redesign for iOS and Android with offline sync and push notifications.',
    tagId: 'engineering',
    memberIds: ['member-blue', 'member-green', 'member-lilac'],
    date: 'Oct 10',
    tasks: 31,
    coverId: 'blue',
  },
  {
    id: 'q4-content-strategy',
    name: 'Q4 Content Strategy',
    description: 'Editorial calendar, channel ownership, and SEO targets for the final quarter.',
    tagId: 'marketing',
    memberIds: ['member-red', 'member-black'],
    date: 'Oct 1',
    tasks: 7,
    coverId: 'neutral',
  },
]

function mapTagColor(tagId) {
  return PLAN_TAGS[tagId]?.color ?? '#a0a0a0'
}

function mapTagLabel(tagId) {
  return PLAN_TAGS[tagId]?.label ?? 'General'
}

function mapMemberStyles(memberIds = []) {
  return memberIds.map((memberId) => PLAN_MEMBER_STYLES[memberId]).filter(Boolean)
}

function mapCover(coverId) {
  return PLAN_COVERS[coverId] ?? '#f5f5f5'
}

function createPlanRecord(plan, options = {}) {
  return normalizePlanRecord({
    ...plan,
    tag: plan.tag ?? mapTagLabel(plan.tagId),
    tagColor: plan.tagColor ?? mapTagColor(plan.tagId),
    members: plan.members ?? mapMemberStyles(plan.memberIds),
    cover: plan.cover ?? mapCover(plan.coverId),
    boardColumns: options.boardColumns ?? plan.boardColumns ?? createEmptyBoardColumns(),
    canvasState: options.canvasState ?? plan.canvasState ?? createEmptyCanvasState(),
  })
}

export function createInitialPlansSnapshot() {
  return PLAN_SEEDS.map((plan) =>
    createPlanRecord(plan, {
      boardColumns: createSampleBoardColumns(),
      canvasState: createSampleCanvasState(),
    }),
  )
}

export function createPlanDraftRecord(data) {
  return createPlanRecord({
    ...data,
    id: createClientId('plan'),
  })
}
