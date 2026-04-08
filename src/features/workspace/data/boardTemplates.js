import { createClientId } from '../../../shared/utils/createClientId.js'

export function createEmptyBoardColumns() {
  return [
    { id: createClientId('col'), title: 'Backlog', color: '#a0a0a0', cards: [] },
    { id: createClientId('col'), title: 'In Progress', color: '#4290da', cards: [] },
    { id: createClientId('col'), title: 'Review', color: '#d4aef1', cards: [] },
    { id: createClientId('col'), title: 'Done', color: '#0f703a', cards: [] },
  ]
}

export function createSampleBoardColumns() {
  return [
    {
      id: createClientId('col'),
      title: 'Backlog',
      color: '#a0a0a0',
      cards: [
        {
          id: createClientId('card'),
          title: 'Competitive landscape research',
          description: 'Survey top 5 competitors and document key differentiators.',
          labelId: 'l1',
          memberIds: ['m2'],
          dueDate: 'Aug 3',
          comments: [],
        },
        {
          id: createClientId('card'),
          title: 'Accessibility audit — WCAG 2.2',
          description: '',
          labelId: 'l5',
          memberIds: [],
          dueDate: '',
          comments: [],
        },
        {
          id: createClientId('card'),
          title: 'Define success metrics for Q3',
          description: 'Align with stakeholders on KPIs before sprint kick-off.',
          labelId: 'l3',
          memberIds: ['m1', 'm4'],
          dueDate: 'Jul 30',
          comments: [],
        },
      ],
    },
    {
      id: createClientId('col'),
      title: 'In Progress',
      color: '#4290da',
      cards: [
        {
          id: createClientId('card'),
          title: 'Redesign onboarding flow',
          description: 'End-to-end UX redesign focusing on time-to-value reduction.',
          labelId: 'l1',
          memberIds: ['m2', 'm3'],
          dueDate: 'Aug 12',
          comments: [{ id: createClientId('comment'), author: 'm3', text: 'Wireframes are done, moving to hi-fi.', time: '2h ago' }],
        },
        {
          id: createClientId('card'),
          title: 'Authentication endpoint refactor',
          description: 'Migrate to OAuth 2.1 with PKCE. Deprecate legacy sessions.',
          labelId: 'l2',
          memberIds: ['m1'],
          dueDate: 'Aug 8',
          comments: [],
        },
      ],
    },
    {
      id: createClientId('col'),
      title: 'Review',
      color: '#d4aef1',
      cards: [
        {
          id: createClientId('card'),
          title: 'Launch campaign copy',
          description: 'Email sequence + landing page headlines for Q3 launch.',
          labelId: 'l4',
          memberIds: ['m4'],
          dueDate: 'Today',
          comments: [{ id: createClientId('comment'), author: 'm1', text: 'Looks great overall — minor tweaks on CTA.', time: '35m ago' }],
        },
      ],
    },
    {
      id: createClientId('col'),
      title: 'Done',
      color: '#0f703a',
      cards: [
        {
          id: createClientId('card'),
          title: 'User interview synthesis',
          description: '',
          labelId: 'l3',
          memberIds: ['m2', 'm4'],
          dueDate: '',
          comments: [],
        },
        {
          id: createClientId('card'),
          title: 'Brand color system update',
          description: '',
          labelId: 'l1',
          memberIds: ['m2'],
          dueDate: '',
          comments: [],
        },
      ],
    },
  ]
}
