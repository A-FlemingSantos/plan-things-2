import { createEmptyBoardColumns, createSampleBoardColumns } from './boardTemplates.js'
import { createEmptyCanvasState, createSampleCanvasState } from '../../canvas/data/canvasTemplates.js'

export const PLAN_SEEDS = [
  {
    id: 'product-launch-q3',
    name: 'Product Launch — Q3',
    description: 'Full scope for the third quarter release, from design handoff to public rollout.',
    tag: 'Marketing',
    tagColor: 'var(--color-blue)',
    members: ['#d4aef1', '#4290da', '#0f703a'],
    date: 'Aug 14',
    tasks: 18,
    cover: '#f4f0ff',
  },
  {
    id: 'api-redesign',
    name: 'API Redesign',
    description: 'Refactor authentication layer and versioning strategy before the next major release.',
    tag: 'Engineering',
    tagColor: 'var(--color-green)',
    members: ['#4290da', '#ff6766'],
    date: 'Jul 30',
    tasks: 9,
    cover: '#f0fff5',
  },
  {
    id: 'brand-identity-2025',
    name: 'Brand Identity 2025',
    description: 'New visual language, motion guidelines, and updated component library.',
    tag: 'Design',
    tagColor: '#d4aef1',
    members: ['#d4aef1', '#0f703a', '#ff6766', '#000'],
    date: 'Sep 3',
    tasks: 24,
    cover: '#fff9f0',
  },
  {
    id: 'onboarding-revamp',
    name: 'Onboarding Revamp',
    description: 'Reduce time-to-value by rethinking the first-run experience end to end.',
    tag: 'Growth',
    tagColor: 'var(--color-red)',
    members: ['#000', '#d4aef1'],
    date: 'Aug 1',
    tasks: 12,
    cover: '#fff0f0',
  },
  {
    id: 'mobile-app-v2',
    name: 'Mobile App v2',
    description: 'Native redesign for iOS and Android with offline sync and push notifications.',
    tag: 'Engineering',
    tagColor: 'var(--color-green)',
    members: ['#4290da', '#0f703a', '#d4aef1'],
    date: 'Oct 10',
    tasks: 31,
    cover: '#f0f6ff',
  },
  {
    id: 'q4-content-strategy',
    name: 'Q4 Content Strategy',
    description: 'Editorial calendar, channel ownership, and SEO targets for the final quarter.',
    tag: 'Marketing',
    tagColor: 'var(--color-blue)',
    members: ['#ff6766', '#000'],
    date: 'Oct 1',
    tasks: 7,
    cover: '#f5f5f5',
  },
]

export function createInitialPlans() {
  return PLAN_SEEDS.map((plan) => ({
    ...plan,
    boardColumns: createSampleBoardColumns(),
    canvasState: createSampleCanvasState(),
  }))
}

export function createPlanRecord(data) {
  return {
    ...data,
    id: `plan-${Date.now()}`,
    boardColumns: createEmptyBoardColumns(),
    canvasState: createEmptyCanvasState(),
  }
}
