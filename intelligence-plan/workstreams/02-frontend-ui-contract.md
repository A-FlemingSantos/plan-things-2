# Frente 02: Contrato de UI no frontend

Este arquivo e autossuficiente para esta frente de trabalho. Nao leia outros documentos de planejamento, a menos que o usuario peca explicitamente.

## Objetivo

Remodelar a UI incompleta de Intelligence no app web em um contrato visual e interativo que a integracao real com backend podera alimentar depois.

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

## Renderizacao de markdown

Use renderer markdown seguro para blocos narrativos. Open WebUI e uma referencia util: markdown e parseado/tokenizado e renderizado por componentes controlados, em vez de ser inserido como HTML cru.

Requisitos:

- sanitizar markdown vindo do usuario/modelo;
- suportar tabelas/listas/code blocks GFM;
- evitar reparse caro de markdown a cada chunk de streaming;
- usar throttle/debounce durante streaming;
- renderizar blocos estruturados separadamente do markdown.

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

## Requisitos de navegacao

- Bloco de plano abre o plano.
- Bloco de cartao abre o plano e o card/modal selecionado.
- Bloco de arquivo abre preview/download.
- Bloco de Inbox abre painel Inbox com item selecionado.
- Commit/PR do GitHub abre link externo ou bloco de detalhes.

Se rotas atuais nao suportarem abertura direta de card, adicionar rota ou padrao por query param.

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

