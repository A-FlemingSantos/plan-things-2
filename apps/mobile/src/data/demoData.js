import { colors } from '../theme/tokens'

export const demoSession = {
  user: {
    fullName: 'Arthur Santos',
    email: 'arthur@example.com',
    initials: 'AS',
  },
  workspace: {
    name: 'Workspace de Arthur',
    initial: 'A',
  },
}

export const tasks = [
  {
    id: 'task-competitors',
    title: 'Pesquisa de concorrentes',
    plan: 'Lançamento do Produto - Q3',
    status: 'Backlog',
    due: '3 ago',
    accent: colors.gray400,
    meta: 'Mapear 5 concorrentes',
  },
  {
    id: 'task-onboarding',
    title: 'Redesenhar fluxo de onboarding',
    plan: 'Revamp do Onboarding',
    status: 'Em andamento',
    due: '12 ago',
    accent: colors.blue,
    meta: 'Wireframes prontos',
  },
  {
    id: 'task-campaign',
    title: 'Copy da campanha de lançamento',
    plan: 'Estratégia de Conteúdo Q4',
    status: 'Review',
    due: 'Hoje',
    accent: colors.purple,
    meta: 'Ajustes no CTA',
  },
  {
    id: 'task-colors',
    title: 'Atualização do sistema de cores',
    plan: 'Identidade da Marca 2025',
    status: 'Concluído',
    due: '',
    accent: colors.green,
    meta: 'Biblioteca revisada',
  },
]

export const plans = [
  { id: 'product-launch-q3', name: 'Lançamento do Produto - Q3', tasks: 18, color: colors.blue },
  { id: 'api-redesign', name: 'Redesign da API', tasks: 9, color: colors.green },
  { id: 'brand-identity-2025', name: 'Identidade da Marca 2025', tasks: 24, color: colors.purple },
  { id: 'mobile-app-v2', name: 'App Mobile v2', tasks: 31, color: colors.blue },
]

export const boardLabels = [
  { id: 'l1', text: 'Design', color: colors.purple },
  { id: 'l2', text: 'Engenharia', color: colors.blue },
  { id: 'l3', text: 'Pesquisa', color: colors.amber },
  { id: 'l4', text: 'Marketing', color: colors.red },
  { id: 'l5', text: 'QA', color: colors.green },
]

export const boardMembers = [
  { id: 'm1', initials: 'AS', color: colors.black },
  { id: 'm2', initials: 'MK', color: colors.purple },
  { id: 'm3', initials: 'TK', color: colors.blue },
  { id: 'm4', initials: 'SR', color: colors.green },
]

export const boardColumns = [
  {
    id: 'col-backlog',
    title: 'Backlog',
    color: colors.gray400,
    cards: [
      {
        id: 'card-competitors',
        title: 'Pesquisa de concorrentes',
        description: 'Mapear 5 concorrentes e registrar diferenciais.',
        labelId: 'l3',
        memberIds: ['m2'],
        dueDate: '3 ago',
        comments: [],
      },
      {
        id: 'card-accessibility',
        title: 'Auditoria de acessibilidade WCAG 2.2',
        description: 'Checar fluxos principais e pontos de contraste.',
        labelId: 'l5',
        memberIds: [],
        dueDate: '',
        comments: [],
      },
      {
        id: 'card-kpis',
        title: 'Definir métricas de sucesso para Q3',
        description: 'Alinhar KPIs com stakeholders antes do sprint.',
        labelId: 'l3',
        memberIds: ['m1', 'm4'],
        dueDate: '30 jul',
        comments: [],
      },
    ],
  },
  {
    id: 'col-progress',
    title: 'Em andamento',
    color: colors.blue,
    cards: [
      {
        id: 'card-onboarding',
        title: 'Redesenhar fluxo de onboarding',
        description: 'Redesign de UX ponta a ponta para reduzir time-to-value.',
        labelId: 'l1',
        memberIds: ['m2', 'm3'],
        dueDate: '12 ago',
        comments: [{ id: 'comment-onboarding', author: 'm3', text: 'Wireframes prontos.', time: 'há 2h' }],
      },
      {
        id: 'card-auth',
        title: 'Refatorar endpoint de autenticação',
        description: 'Migrar para OAuth 2.1 com PKCE.',
        labelId: 'l2',
        memberIds: ['m1'],
        dueDate: '8 ago',
        comments: [],
      },
    ],
  },
  {
    id: 'col-review',
    title: 'Review',
    color: colors.purple,
    cards: [
      {
        id: 'card-campaign-copy',
        title: 'Copy da campanha de lançamento',
        description: 'Sequência de e-mails e headlines para o lançamento Q3.',
        labelId: 'l4',
        memberIds: ['m4'],
        dueDate: 'Hoje',
        comments: [{ id: 'comment-campaign', author: 'm1', text: 'Ajustar CTA final.', time: 'há 35min' }],
      },
    ],
  },
  {
    id: 'col-done',
    title: 'Concluído',
    color: colors.green,
    cards: [
      {
        id: 'card-interviews',
        title: 'Síntese das entrevistas com usuários',
        description: '',
        labelId: 'l3',
        memberIds: ['m2', 'm4'],
        dueDate: '',
        comments: [],
      },
      {
        id: 'card-colors',
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

export const inboxItems = [
  {
    id: 'inbox-1',
    title: 'Copy da campanha de lançamento',
    recipients: 'Ana R., Sara M.',
    sentBy: 'Gmail conectado',
    time: 'há 35min',
    message: 'Revisão enviada para alinhar tom e CTA antes do fechamento.',
  },
  {
    id: 'inbox-2',
    title: 'Redesenhar fluxo de onboarding',
    recipients: 'Tom K.',
    sentBy: 'Arthur Santos',
    time: 'há 2h',
    message: 'Resumo rápido do progresso e próximos pontos de decisão.',
  },
  {
    id: 'inbox-3',
    title: 'Pesquisa de concorrentes',
    recipients: 'Equipe de produto',
    sentBy: 'Arthur Santos',
    time: 'Ontem',
    message: 'Contexto compartilhado para coleta assíncrona de referências.',
  },
]

export const files = [
  { id: 'file-1', name: 'Design do Produto', type: 'folder', modified: 'há 2h', shared: true, size: '' },
  { id: 'file-2', name: 'kanban-spec.pdf', type: 'pdf', modified: 'Ontem', shared: true, size: '1.2 MB' },
  { id: 'file-3', name: 'sistema-cores.json', type: 'code', modified: 'há 5 dias', shared: true, size: '8.2 KB' },
  { id: 'file-4', name: 'fluxo-onboarding.png', type: 'image', modified: 'há 1 semana', shared: true, size: '1.8 MB' },
  { id: 'file-5', name: 'notas-reuniao-q3.doc', type: 'doc', modified: 'há 3 semanas', shared: true, size: '42 KB' },
]
