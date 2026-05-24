# Frente 02: Contrato de UI no frontend

## Missao do agente

Implemente ou remodele a UI mockada de Intelligence para virar o contrato visual da integracao real. Esta frente deve produzir componentes, estados e dados fake com o mesmo formato que o backend enviara depois.

Nao implemente OpenAI, banco, GitHub OAuth ou File Search aqui. O objetivo e deixar Workspace e Kanban prontos para receber streaming, blocos estruturados, propostas e entity references sem redesenho posterior.

## Arquivos de entrada

Inspecione primeiro:

```txt
apps/web/src/features/workspace/pages/Workspace/Workspace.jsx
apps/web/src/features/workspace/pages/Workspace/Workspace.module.css
apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx
apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.module.css
```

Crie ou prepare a area compartilhada:

```txt
apps/web/src/features/intelligence
```

## Entregas

- `AiComposer` compartilhado.
- `AiConversation` compartilhado.
- `AiBlockRenderer` compartilhado.
- Blocos visuais para markdown, propostas, entidades e status de tool.
- Dados fake com o contrato esperado do backend.
- Workspace e Kanban usando a mesma arquitetura visual.
- Estados de streaming, erro, proposta e entidade real representados.

## Arquitetura de blocos

Implemente a UI considerando esta separacao:

```txt
MarkdownBlock = narrativa, listas, tabelas, codigo, links, citacoes, diagramas.
EntityReferenceBlock = objetos reais clicaveis do app ou externos.
ActionProposalBlock = propostas aprovaveis pelo usuario.
QuestionBlock = perguntas objetivas.
ToolRunStatusBlock = estado de execucao de tools.
```

Nao renderize plano, card, arquivo, membro, Inbox, commit, PR ou proposta como markdown customizado. Esses objetos precisam de componente proprio porque possuem href, status, snapshot, permissoes e acoes.

## Componentes sugeridos

```txt
apps/web/src/features/intelligence/api/intelligenceApi.js
apps/web/src/features/intelligence/hooks/useAiConversation.js
apps/web/src/features/intelligence/hooks/useAiStream.js
apps/web/src/features/intelligence/components/AiComposer.jsx
apps/web/src/features/intelligence/components/AiConversation.jsx
apps/web/src/features/intelligence/components/AiBlockRenderer.jsx
apps/web/src/features/intelligence/components/blocks/MarkdownBlock.jsx
apps/web/src/features/intelligence/components/blocks/PlanReferenceBlock.jsx
apps/web/src/features/intelligence/components/blocks/CardReferenceBlock.jsx
apps/web/src/features/intelligence/components/blocks/FileReferenceBlock.jsx
apps/web/src/features/intelligence/components/blocks/MemberReferenceBlock.jsx
apps/web/src/features/intelligence/components/blocks/InboxReferenceBlock.jsx
apps/web/src/features/intelligence/components/blocks/GitHubCommitBlock.jsx
apps/web/src/features/intelligence/components/blocks/GitHubPullRequestBlock.jsx
apps/web/src/features/intelligence/components/blocks/ActionProposalBlock.jsx
apps/web/src/features/intelligence/components/blocks/QuestionBlock.jsx
apps/web/src/features/intelligence/components/blocks/ToolRunStatusBlock.jsx
```

Use os nomes como guia, mas siga os padroes reais do projeto se houver convencao diferente.

## Contrato fake obrigatorio

Crie fixtures/mock data que cubram pelo menos:

```txt
markdown
plan_reference
card_reference
file_reference
member_reference
inbox_reference
github_commit_reference
github_pull_request_reference
action_proposal
question
tool_run_status
```

Exemplo de plan reference:

```js
{
  id: 'block-1',
  type: 'plan_reference',
  title: 'Landing Page Launch',
  href: '/plans/plan-1',
  entityType: 'plan',
  entityId: 'plan-1',
  snapshot: {
    cardCount: 12,
    memberCount: 4,
    updatedAt: '2026-05-24T10:00:00Z'
  }
}
```

Exemplo de card reference:

```js
{
  id: 'block-card-1',
  type: 'card_reference',
  title: 'Implementar login',
  href: '/plans/plan-1?card=card-1',
  entityType: 'card',
  entityId: 'card-1',
  parentEntityType: 'plan',
  parentEntityId: 'plan-1',
  snapshot: {
    column: 'Em andamento',
    assignees: ['Arthur'],
    dueAt: null
  }
}
```

Exemplo de proposta:

```js
{
  id: 'proposal-1',
  type: 'action_proposal',
  status: 'pending',
  actionType: 'CARD_BATCH_CREATE',
  title: 'Criar 5 cartoes',
  preview: {},
  actions: ['apply', 'edit', 'reject']
}
```

## Estados obrigatorios da UI

Renderize e teste visualmente:

```txt
empty
drafting
streaming
tool_running
proposal_pending
proposal_approved
proposal_rejected
proposal_failed
entity_created
entity_updated
entity_unavailable
error_retryable
error_permission
```

O estado aprovado deve mostrar a transicao: proposta aprovada, aplicacao em andamento e entity reference resultante. Nao troque apenas o texto do bloco.

## Composer

O composer deve suportar:

- prompt digitado;
- chips de contexto anexado;
- indicadores de tools/integracoes habilitadas;
- botao de voz se ja existir no app;
- envio;
- parar geracao;
- estados disabled/loading;
- menu para anexar arquivos, itens Kanban, Inbox e plugins.

Chips de contexto representam objetos reais selecionados pelo usuario. Eles devem ter ids/tipos suficientes para virar attached context no backend.

## Markdown

Use renderer markdown seguro para narrativa:

- sanitizar conteudo;
- suportar GFM basico;
- renderizar code blocks;
- evitar reparse caro a cada delta de streaming;
- manter blocos estruturados fora do markdown.

Durante streaming, mostre texto parcial como `MarkdownBlock` temporario. Crie blocos estruturados apenas a partir de eventos explicitos simulados, como `proposal.created` ou `block.created`.

## Eventos simulados

Prepare a UI para estes eventos:

```txt
message.created
assistant.delta
tool.started
tool.completed
tool.failed
proposal.created
entity.created
entity.updated
block.created
assistant.completed
assistant.failed
```

Ids estaveis sao obrigatorios para evitar duplicacao em retry/reconexao.

## Navegacao

- Plano abre o plano.
- Cartao abre o plano e seleciona o card/modal.
- Arquivo abre preview/download.
- Inbox abre item selecionado.
- Commit/PR abre GitHub em nova aba ou detalhe local.
- Entidade indisponivel mantem snapshot historico e bloqueia acao principal.

Se nao existir rota direta para card, implemente rota ou query param compativel com o padrao do app.

## Limites desta frente

- Nao chame OpenAI.
- Nao implemente persistencia real.
- Nao implemente OAuth GitHub.
- Nao implemente indexacao de arquivos.
- Nao mude regras de negocio de board/workspace fora do necessario para navegacao visual.

## Aceite

- Workspace e Kanban usam a mesma base de Intelligence.
- Fixtures cobrem todos os tipos de bloco do MVP.
- Estados obrigatorios aparecem na UI mockada.
- Proposta e entity reference sao visualmente e semanticamente diferentes.
- O contrato fake pode ser trocado por resposta backend sem redesenho.
