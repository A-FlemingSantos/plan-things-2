# Frente 02: Contrato de UI no frontend

Este arquivo e autossuficiente para esta frente de trabalho. Nao leia outros documentos de planejamento, a menos que o usuario peca explicitamente.

## Objetivo

Remodelar a UI incompleta de Intelligence no app web em um contrato visual e interativo que a integracao real com backend podera alimentar depois.

A intencao desta frente nao e apenas "embelezar o mock". Ela deve transformar a UI atual do Workspace e do Kanban em um contrato de experiencia: os mesmos blocos, estados e interacoes usados com dados fake devem receber eventos reais do backend depois. Isso evita reconstruir a interface quando streaming, propostas e entity references chegarem.

Arquivos atuais relevantes:

```txt
apps/web/src/features/workspace/pages/Workspace/Workspace.jsx
apps/web/src/features/workspace/pages/Workspace/Workspace.module.css
apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx
apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.module.css
```

Area compartilhada futura:

```txt
apps/web/src/features/intelligence
```

## Decisao arquitetural

Markdown e apenas um tipo de bloco. Objetos reais e propostas devem ser blocos estruturados fora do markdown.

```txt
MarkdownBlock = narrativa, listas, tabelas, codigo, links, citacoes, diagramas.
EntityReferenceBlock = objetos reais clicaveis do app ou externos.
ActionProposalBlock = propostas aprovaveis pelo usuario.
ToolRunStatusBlock = estado de execucao de tools.
```

Nao embutir planos, cartoes, arquivos, membros, itens de Inbox, commits ou propostas como markdown customizado.

Essa separacao e essencial porque objetos do app possuem estado, permissoes, href, snapshots e acoes. Markdown deve ser renderizado com seguranca para narrativa; blocos estruturados devem carregar comportamento.

## Componentes

Estrutura recomendada:

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

`WorkspaceIntelligenceSection` e o painel de Intelligence do Kanban devem se tornar consumidores desse conjunto compartilhado, nao implementacoes paralelas. A diferenca entre Workspace e Kanban deve entrar por props de escopo, contexto inicial e capacidades habilitadas.

## Contrato de dados fake

Use dados fake com o mesmo formato esperado dos blocos reais do backend:

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

Referencia de cartao:

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

Blocos de proposta devem incluir:

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

O mock deve representar a transicao completa: proposta pendente, proposta aprovada, aplicacao em andamento, proposta aplicada e entity reference resultante. A aprovacao nao deve trocar apenas texto; deve produzir visualmente um objeto real clicavel.

## Renderizacao de markdown

Use renderer markdown seguro para blocos narrativos. Open WebUI e uma referencia util: markdown e parseado/tokenizado e renderizado por componentes controlados, em vez de ser inserido como HTML cru.

Requisitos:

- sanitizar markdown vindo do usuario/modelo;
- suportar tabelas/listas/code blocks GFM;
- evitar reparse caro de markdown a cada chunk de streaming;
- usar throttle/debounce durante streaming;
- renderizar blocos estruturados separadamente do markdown.

Durante streaming, o texto parcial pode aparecer em um `MarkdownBlock` temporario. Blocos estruturados so devem entrar quando houver evento explicito do backend, como `block.created`, `proposal.created`, `entity.created` ou `entity.updated`. Isso evita que o frontend tente interpretar markdown incompleto como estrutura de produto.

## Requisitos do composer

O composer deve suportar:

- prompt digitado;
- chips de contexto anexado;
- indicadores de ferramentas/integracoes habilitadas;
- botao de voz;
- botao de envio;
- parar geracao;
- estados disabled/loading;
- menu para inserir contexto de arquivos, itens Kanban, Inbox e plugins.

Chips de contexto anexado devem mostrar objetos reais selecionados pelo usuario. Eles nao sao prompt decorativo: devem virar attached context na mensagem enviada ao backend.

## Requisitos de navegacao

- Bloco de plano abre o plano.
- Bloco de cartao abre o plano e o card/modal selecionado.
- Bloco de arquivo abre preview/download.
- Bloco de Inbox abre painel Inbox com item selecionado.
- Commit/PR do GitHub abre link externo ou bloco de detalhes.

Se rotas atuais nao suportarem abertura direta de card, adicionar rota ou padrao por query param.

Cada bloco deve lidar com `entity_unavailable`: manter o snapshot historico, bloquear a acao principal quando necessario e mostrar que o objeto nao esta mais disponivel.

## Eventos esperados do backend

O frontend deve estar pronto para reconciliar estes eventos:

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

Ids estaveis sao obrigatorios para evitar duplicacao durante reconexao/retry de SSE.

## Fora do escopo

- Chamada real para OpenAI.
- Persistencia backend.
- OAuth do GitHub.
- Indexacao de arquivos.

## Definition of Done

- Workspace e Kanban usam o mesmo conceito de block renderer.
- UI mockada cobre todos os estados obrigatorios.
- Blocos fake podem ser trocados por blocos do backend sem redesenho.
- Markdown e objetos estruturados sao visualmente distintos.
- Blocos de proposta mostram claramente estados pendente/aplicando/aplicado/rejeitado/falho.
- Chips de contexto e eventos simulados exercitam o mesmo fluxo esperado do backend.
