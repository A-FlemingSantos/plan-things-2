import { createEmptyBoardColumns, createSampleBoardColumns } from './boardTemplates.js'
import { normalizePlanRecord } from '../../../shared/contracts/planContracts.js'
import { createClientId } from '../../../shared/utils/createClientId.js'

const PLAN_TAGS = {
  marketing: { label: 'Marketing', color: 'var(--color-blue)' },
  engineering: { label: 'Engenharia', color: 'var(--color-green)' },
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
    name: 'Lançamento do Produto — Q3',
    description: 'Escopo do release do terceiro trimestre, do handoff ao rollout público.',
    tagId: 'marketing',
    memberIds: ['member-lilac', 'member-blue', 'member-green'],
    date: '14 ago',
    tasks: 18,
    coverId: 'lilac',
  },
  {
    id: 'api-redesign',
    name: 'Redesign da API',
    description: 'Refatorar autenticação e versionamento antes do próximo grande release.',
    tagId: 'engineering',
    memberIds: ['member-blue', 'member-red'],
    date: '30 jul',
    tasks: 9,
    coverId: 'green',
  },
  {
    id: 'brand-identity-2025',
    name: 'Identidade da Marca 2025',
    description: 'Nova linguagem visual, diretrizes de motion e biblioteca de componentes atualizada.',
    tagId: 'design',
    memberIds: ['member-lilac', 'member-green', 'member-red', 'member-black'],
    date: '3 set',
    tasks: 24,
    coverId: 'sand',
  },
  {
    id: 'onboarding-revamp',
    name: 'Revamp do Onboarding',
    description: 'Reduzir o time-to-value repensando a primeira experiência de ponta a ponta.',
    tagId: 'growth',
    memberIds: ['member-black', 'member-lilac'],
    date: '1 ago',
    tasks: 12,
    coverId: 'rose',
  },
  {
    id: 'mobile-app-v2',
    name: 'App Mobile v2',
    description: 'Redesign nativo para iOS e Android com sync offline e push.',
    tagId: 'engineering',
    memberIds: ['member-blue', 'member-green', 'member-lilac'],
    date: '10 out',
    tasks: 31,
    coverId: 'blue',
  },
  {
    id: 'q4-content-strategy',
    name: 'Estratégia de Conteúdo Q4',
    description: 'Calendário editorial, canais e metas de SEO para o último trimestre.',
    tagId: 'marketing',
    memberIds: ['member-red', 'member-black'],
    date: '1 out',
    tasks: 7,
    coverId: 'neutral',
  },
]

function mapTagColor(tagId) {
  return PLAN_TAGS[tagId]?.color ?? '#a0a0a0'
}

function mapTagLabel(tagId) {
  return PLAN_TAGS[tagId]?.label ?? 'Geral'
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
  })
}

export function createInitialPlansSnapshot() {
  return PLAN_SEEDS.map((plan) =>
    createPlanRecord(plan, {
      boardColumns: createSampleBoardColumns(),
    }),
  )
}

export function createPlanDraftRecord(data) {
  return createPlanRecord({
    ...data,
    id: createClientId('plan'),
  })
}
