import { createClientId } from '../../../shared/utils/createClientId.js'

export function createEmptyBoardColumns() {
  return []
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
          title: 'Pesquisa de concorrentes',
          description: 'Mapear 5 concorrentes e registrar diferenciais.',
          labelId: 'l1',
          memberIds: ['m2'],
          dueDate: '3 ago',
          comments: [],
        },
        {
          id: createClientId('card'),
          title: 'Auditoria de acessibilidade — WCAG 2.2',
          description: '',
          labelId: 'l5',
          memberIds: [],
          dueDate: '',
          comments: [],
        },
        {
          id: createClientId('card'),
          title: 'Definir métricas de sucesso para Q3',
          description: 'Alinhar KPIs com stakeholders antes do início do sprint.',
          labelId: 'l3',
          memberIds: ['m1', 'm4'],
          dueDate: '30 jul',
          comments: [],
        },
      ],
    },
    {
      id: createClientId('col'),
      title: 'Em andamento',
      color: '#4290da',
      cards: [
        {
          id: createClientId('card'),
          title: 'Redesenhar fluxo de onboarding',
          description: 'Redesign de UX ponta a ponta para reduzir time-to-value.',
          labelId: 'l1',
          memberIds: ['m2', 'm3'],
          dueDate: '12 ago',
          comments: [{ id: createClientId('comment'), author: 'm3', text: 'Wireframes prontos, seguindo para hi-fi.', time: 'há 2h' }],
        },
        {
          id: createClientId('card'),
          title: 'Refatorar endpoint de autenticação',
          description: 'Migrar para OAuth 2.1 com PKCE. Depreciar sessões legadas.',
          labelId: 'l2',
          memberIds: ['m1'],
          dueDate: '8 ago',
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
          title: 'Copy da campanha de lançamento',
          description: 'Sequência de e-mails e headlines da landing para o lançamento Q3.',
          labelId: 'l4',
          memberIds: ['m4'],
          dueDate: 'Hoje',
          comments: [{ id: createClientId('comment'), author: 'm1', text: 'Está ótimo no geral — pequenos ajustes no CTA.', time: 'há 35min' }],
        },
      ],
    },
    {
      id: createClientId('col'),
      title: 'Concluído',
      color: '#0f703a',
      cards: [
        {
          id: createClientId('card'),
          title: 'Síntese das entrevistas com usuários',
          description: '',
          labelId: 'l3',
          memberIds: ['m2', 'm4'],
          dueDate: '',
          comments: [],
        },
        {
          id: createClientId('card'),
          title: 'Atualização do sistema de cores da marca',
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
