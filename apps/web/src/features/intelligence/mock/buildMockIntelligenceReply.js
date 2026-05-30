import { buildWorkspaceBoardPath } from '../../../shared/config/routes.js'

const PROPOSAL_TYPES = new Set([
  'PLAN_PROPOSAL',
  'CARD_BATCH_PROPOSAL',
  'MEMBER_INVITE_PROPOSAL',
  'FILE_ATTACH_PROPOSAL',
])

const MOCK_PLAN_ROUTE_ID = 'product-launch-q3'

function normalizePrompt(prompt) {
  return String(prompt ?? '').trim().toLowerCase()
}

function hasContextKind(contextSnapshot, kind) {
  const chips = contextSnapshot?.contextChips ?? []
  return chips.some((chip) => String(chip.kind ?? '').toLowerCase() === kind)
}

function markdownBlock(markdown, position) {
  return {
    type: 'MARKDOWN',
    title: null,
    payload: { markdown },
    position,
  }
}

function toolRunBlock({ toolId, status, summary, title }, position) {
  return {
    type: 'TOOL_RUN_SUMMARY',
    title: title ?? null,
    payload: { toolId, status, summary },
    position,
  }
}

function planProposalBlock(preview, position) {
  return {
    type: 'PLAN_PROPOSAL',
    title: preview.title ?? 'Proposta de plano',
    payload: {
      actionProposalId: 'mock-proposal-plan-1',
      preview,
      status: 'proposal_pending',
    },
    position,
  }
}

function cardBatchProposalBlock(preview, position) {
  return {
    type: 'CARD_BATCH_PROPOSAL',
    title: preview.title ?? 'Proposta de cartões',
    payload: {
      actionProposalId: 'mock-proposal-cards-1',
      preview,
      status: 'proposal_pending',
    },
    position,
  }
}

function planReferenceBlock({ title, href, entityId, snapshot }, position) {
  return {
    type: 'PLAN_REFERENCE',
    title,
    payload: { entityId, href, snapshot },
    position,
  }
}

function cardReferenceBlock({ title, href, entityId, snapshot }, position) {
  return {
    type: 'CARD_REFERENCE',
    title,
    payload: { entityId, href, snapshot },
    position,
  }
}

function githubCommitReferenceBlock({ title, href, externalId, snapshot }, position) {
  return {
    type: 'GITHUB_COMMIT_REFERENCE',
    title,
    payload: { externalId, href, snapshot },
    position,
  }
}

function githubPullRequestReferenceBlock({ title, href, externalId, snapshot }, position) {
  return {
    type: 'GITHUB_PULL_REQUEST_REFERENCE',
    title,
    payload: { externalId, href, snapshot },
    position,
  }
}

function buildPlanCreationScenario(prompt, contextSnapshot) {
  const planLabel = contextSnapshot?.contextChips?.find((c) => c.kind === 'plan')?.label
  const planName = planLabel || 'Marketing Q2'

  return {
    summary: `Preparei uma proposta de plano "${planName}" para sua revisão.`,
    blocks: [
      markdownBlock(
        `Analisei seu pedido (${prompt ? '“' + String(prompt).trim().slice(0, 80) + '”' : 'sem texto'}). Segue o fluxo completo em modo **simulação** — nada foi gravado no workspace.`,
        0,
      ),
      toolRunBlock({
        toolId: 'workspace.get_summary',
        status: 'completed',
        summary: 'Resumo do workspace carregado (mock).',
        title: 'Ferramenta: workspace.get_summary',
      }, 1),
      planProposalBlock({
        title: `Criar plano “${planName}”`,
        description: '3 colunas padrão (A fazer · Em progresso · Concluído) e lista inicial vazia.',
        highlights: ['Escopo: workspace atual', 'Permissão: owner (simulado)'],
      }, 2),
      planReferenceBlock({
        title: planName,
        entityId: 'mock-plan-created-1',
        href: buildWorkspaceBoardPath(MOCK_PLAN_ROUTE_ID),
        snapshot: {
          subtitle: 'Kanban · 3 colunas',
          statusLabel: 'Pré-visualização',
          mock: true,
        },
      }, 3),
    ],
    memoryCandidates: [],
  }
}

function buildCardBatchScenario(prompt) {
  return {
    summary: 'Proposta de lote de cartões pronta para revisão (simulação).',
    blocks: [
      markdownBlock(
        'Organizei os cartões sugeridos em um lote. Revise os detalhes e use **Aprovar** apenas quando quiser simular o fluxo — nenhuma alteração real será aplicada.',
        0,
      ),
      toolRunBlock({
        toolId: 'board.card.search',
        status: 'completed',
        summary: '12 cartões candidatos encontrados no board (mock).',
        title: 'Ferramenta: board.card.search',
      }, 1),
      cardBatchProposalBlock({
        title: 'Adicionar 4 cartões em “Em progresso”',
        description: 'Cartões derivados do seu pedido, com títulos e descrições curtas.',
        highlights: ['Coluna: Em progresso', 'Quantidade: 4'],
      }, 2),
      cardReferenceBlock({
        title: 'Definir critérios de aceite',
        entityId: 'mock-card-1',
        href: `${buildWorkspaceBoardPath(MOCK_PLAN_ROUTE_ID)}?card=mock-card-1`,
        snapshot: {
          subtitle: 'Em progresso',
          statusLabel: 'Pré-visualização',
          mock: true,
        },
      }, 3),
    ],
    memoryCandidates: [],
  }
}

function buildGithubScenario() {
  return {
    summary: 'Commits e PR recentes do repositório (simulação).',
    blocks: [
      markdownBlock(
        'Consultei o GitHub conectado (mock) e destaquei o commit mais recente e o PR aberto relacionado ao seu pedido.',
        0,
      ),
      toolRunBlock({
        toolId: 'github.search',
        status: 'completed',
        summary: '2 commits e 1 pull request nos últimos 7 dias (mock).',
        title: 'Ferramenta: github.search',
      }, 1),
      githubCommitReferenceBlock({
        title: 'feat(intelligence): blocos mock na thread',
        externalId: 'abc1234',
        href: 'https://github.com/plan-things/web/commit/abc1234',
        snapshot: {
          subtitle: 'Arthur · há 2 horas',
          statusLabel: 'main',
          mock: true,
        },
      }, 2),
      githubPullRequestReferenceBlock({
        title: 'Intelligence: contrato visual de blocos',
        externalId: '42',
        href: 'https://github.com/plan-things/web/pull/42',
        snapshot: {
          subtitle: 'Aberto · +128 −12',
          statusLabel: 'Revisão pendente',
          mock: true,
        },
      }, 3),
    ],
    memoryCandidates: [],
  }
}

function buildCalendarScenario() {
  return {
    summary: 'Sugestão de blocos de foco para o calendário.',
    blocks: [
      markdownBlock(
        'Posso organizar isso em blocos de foco:\n\n1. Mapear reuniões fixas\n2. Separar **2 janelas** para execução profunda\n3. Reservar um checkpoint curto no fim do dia\n\n> Modo simulação — ajuste os horários antes de sincronizar de verdade.',
        0,
      ),
    ],
    memoryCandidates: [],
  }
}

function buildPitchScenario() {
  return {
    summary: 'Estrutura de pitch deck sugerida.',
    blocks: [
      markdownBlock(
        'Uma boa base para o deck:\n\n| Seção | Conteúdo |\n| --- | --- |\n| Problema | Dor do usuário |\n| Solução | Como o Plan Things ajuda |\n| Próximos passos | MVP e métricas |\n\nPosso transformar isso em roteiro slide a slide na próxima mensagem.',
        0,
      ),
    ],
    memoryCandidates: [],
  }
}

function buildUiScenario() {
  return {
    summary: 'Roteiro inicial de UI system.',
    blocks: [
      markdownBlock(
        'Vamos começar pelo essencial:\n\n- Tokens de cor e espaçamento\n- Tipografia\n- Botões, inputs e cards\n- Estados de feedback\n\nDepois conectamos aos fluxos principais do produto.',
        0,
      ),
    ],
    memoryCandidates: [],
  }
}

function buildDefaultScenario(prompt) {
  return {
    summary: 'Próximos passos sugeridos.',
    blocks: [
      markdownBlock(
        'Entendi. Eu começaria separando a ideia em **objetivo**, usuários, fluxo principal, riscos e primeiro entregável.\n\n'
        + 'Para ver o fluxo completo (ferramenta → proposta → referência), tente pedir para **criar um plano** ou **adicionar cartões**.',
        0,
      ),
    ],
    memoryCandidates: prompt ? [] : [],
  }
}

/**
 * Mock structured assistant reply for phase 0.5.2 (visual contract only).
 *
 * @param {string} prompt
 * @param {import('../../../shared/contracts/intelligenceContracts.js').ContextSnapshot|null} [contextSnapshot]
 * @returns {import('../../../shared/contracts/intelligenceContracts.js').StructuredAssistantResponse}
 */
export function buildMockIntelligenceReply(prompt, contextSnapshot = null) {
  const normalized = normalizePrompt(prompt)

  if (
    normalized.includes('bloco')
    || normalized.includes('demo')
    || normalized.includes('simul')
  ) {
    return buildPlanCreationScenario(prompt, contextSnapshot)
  }

  if (
    normalized.includes('plano')
    || normalized.includes('plan')
    || normalized.includes('criar plan')
    || hasContextKind(contextSnapshot, 'plan')
  ) {
    return buildPlanCreationScenario(prompt, contextSnapshot)
  }

  if (
    normalized.includes('cart')
    || normalized.includes('card')
    || normalized.includes('kanban')
    || hasContextKind(contextSnapshot, 'card')
  ) {
    return buildCardBatchScenario(prompt)
  }

  if (
    normalized.includes('github')
    || normalized.includes('commit')
    || normalized.includes('pull request')
    || normalized.includes('pr ')
    || normalized.includes('reposit')
  ) {
    return buildGithubScenario()
  }

  if (normalized.includes('calend')) {
    return buildCalendarScenario()
  }

  if (normalized.includes('pitch')) {
    return buildPitchScenario()
  }

  if (normalized.includes('ui')) {
    return buildUiScenario()
  }

  return buildDefaultScenario(prompt)
}

export function isMockProposalBlockType(type) {
  return PROPOSAL_TYPES.has(String(type ?? '').toUpperCase())
}
