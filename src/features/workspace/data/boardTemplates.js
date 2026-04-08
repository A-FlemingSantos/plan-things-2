const uid = () => Math.random().toString(36).slice(2, 9)

export function createEmptyBoardColumns() {
  return [
    { id: `col-${uid()}`, title: 'Backlog', color: '#a0a0a0', cards: [] },
    { id: `col-${uid()}`, title: 'In Progress', color: '#4290da', cards: [] },
    { id: `col-${uid()}`, title: 'Review', color: '#d4aef1', cards: [] },
    { id: `col-${uid()}`, title: 'Done', color: '#0f703a', cards: [] },
  ]
}

export function createSampleBoardColumns() {
  return [
    {
      id: `col-${uid()}`,
      title: 'Backlog',
      color: '#a0a0a0',
      cards: [
        {
          id: uid(),
          title: 'Competitive landscape research',
          description: 'Survey top 5 competitors and document key differentiators.',
          labelId: 'l1',
          memberIds: ['m2'],
          dueDate: 'Aug 3',
          comments: [],
        },
        {
          id: uid(),
          title: 'Accessibility audit — WCAG 2.2',
          description: '',
          labelId: 'l5',
          memberIds: [],
          dueDate: '',
          comments: [],
        },
        {
          id: uid(),
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
      id: `col-${uid()}`,
      title: 'In Progress',
      color: '#4290da',
      cards: [
        {
          id: uid(),
          title: 'Redesign onboarding flow',
          description: 'End-to-end UX redesign focusing on time-to-value reduction.',
          labelId: 'l1',
          memberIds: ['m2', 'm3'],
          dueDate: 'Aug 12',
          comments: [{ id: uid(), author: 'm3', text: 'Wireframes are done, moving to hi-fi.', time: '2h ago' }],
        },
        {
          id: uid(),
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
      id: `col-${uid()}`,
      title: 'Review',
      color: '#d4aef1',
      cards: [
        {
          id: uid(),
          title: 'Launch campaign copy',
          description: 'Email sequence + landing page headlines for Q3 launch.',
          labelId: 'l4',
          memberIds: ['m4'],
          dueDate: 'Today',
          comments: [{ id: uid(), author: 'm1', text: 'Looks great overall — minor tweaks on CTA.', time: '35m ago' }],
        },
      ],
    },
    {
      id: `col-${uid()}`,
      title: 'Done',
      color: '#0f703a',
      cards: [
        {
          id: uid(),
          title: 'User interview synthesis',
          description: '',
          labelId: 'l3',
          memberIds: ['m2', 'm4'],
          dueDate: '',
          comments: [],
        },
        {
          id: uid(),
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
