# Frente 04: Tools do modelo e roteamento

Este arquivo e autossuficiente para esta frente de trabalho. Nao leia outros documentos de planejamento, a menos que o usuario peca explicitamente.

## Objetivo

Implementar uma paleta pequena e robusta de model-facing tools, apoiada por capabilities internas granulares.

A intencao desta frente e reduzir a carga cognitiva do `gpt-5.4-mini` sem empobrecer o backend. O modelo deve escolher entre poucas tools agregadoras. O backend traduz essa intencao para capabilities internas especificas, valida tudo e decide se o resultado e leitura direta, proposta pendente ou erro recuperavel.

## Decisao central

Usar dois niveis:

```txt
AiCapabilityRegistry = operacoes internas granulares.
AiModelToolRegistry = pequeno conjunto de tools expostas ao modelo.
```

Nao expor muitas tools especificas diretamente ao `gpt-5.4-mini`. O modelo deve ver uma paleta pequena e dinamica.

Essa divisao evita sobreposicao como `card.create`, `card.batch_create`, `card.move`, `card.assign` competindo no mesmo prompt. Internamente essas operacoes continuam separadas; externamente o modelo aprende uma regra simples: buscar contexto, buscar entidade, propor acao, buscar arquivo ou buscar GitHub.

## Model-facing tools

Tools do MVP:

```txt
context.search
entity.get
action.propose
file.search
github.search
```

Exposicao dinamica:

- Workspace geral: `context.search`, `entity.get`, `action.propose`.
- Kanban com arquivos: adicionar `file.search`.
- Kanban com GitHub conectado: adicionar `github.search`.
- Se um provedor esta desconectado ou desabilitado, nao enviar sua tool.

Meta: no maximo 5 model-facing tools por request no MVP.

Papel de cada tool:

| Tool | Intencao | Resultado esperado |
| ---- | -------- | ------------------ |
| `context.search` | Encontrar contexto operacional por escopo e intencao do usuario. | Lista categorizada de planos, cards, membros, Inbox e estado do board. |
| `entity.get` | Carregar detalhes de uma entidade ja identificada. | Snapshot detalhado e permissionado da entidade. |
| `action.propose` | Preparar mudanca revisavel pelo usuario. | Registro pendente e `ActionProposalBlock`. |
| `file.search` | Buscar metadados/conteudo de arquivos autorizados. | Resultados de arquivo e possiveis citacoes. |
| `github.search` | Buscar repos, commits e PRs autorizados. | Referencias externas ou insumos para proposta. |

`context.search.query` nao deve ser quebrado palavra por palavra para mapear tools. Ele e uma frase de intencao usada por busca local/semantica/ranking. A selecao de tools acontece antes, por contexto, permissoes e prompt do modelo; o backend pode usar a query para buscar entidades relevantes, nao para liberar capacidade sensivel.

## Capabilities internas

Capabilities internas iniciais:

```txt
workspace.get_summary
workspace.search_plans
plan.get
plan.create_proposal
plan.update_proposal
board.get
board.card.search
board.card.get
board.card.batch_create_proposal
board.card.update_proposal
board.card.move_proposal
board.card.assign_proposal
member.search
member.suggest_assignees
member.invite_proposal
file.search_metadata
file.search_content
file.get_summary
file.attach_to_card_proposal
inbox.list
inbox.get_item
inbox.convert_to_card_proposal
github.repo.search
github.commit.search
github.commit.get
github.pull_request.search
github.pull_request.get
github.commit.attach_to_card_proposal
github.pull_request.attach_to_card_proposal
github.suggest_cards_from_commits
```

Capabilities de apply sao internas:

```txt
plan.apply_create
plan.apply_update
board.card.apply_create
board.card.apply_update
board.card.apply_move
member.apply_invite
file.apply_attach_to_card
inbox.apply_convert_to_card
github.apply_attach_to_card
```

## action.propose

O modelo pode propor mudancas, mas nao pode aplica-las.

Fluxo:

```txt
modelo chama action.propose
backend valida schema e permissoes
backend cria registro pendente em ai_action_proposals
frontend renderiza ActionProposalBlock
usuario aprova/rejeita/edita
frontend chama endpoint de apply
backend revalida e aplica usando servicos existentes
conversa recebe blocos de referencia a entidades reais
```

Action types:

```txt
PLAN_CREATE
PLAN_UPDATE
CARD_BATCH_CREATE
CARD_UPDATE
CARD_MOVE
CARD_ASSIGN
MEMBER_INVITE
FILE_ATTACH_TO_CARD
INBOX_CONVERT_TO_CARD
GITHUB_ATTACH_TO_CARD
```

Cada `actionType` deve mapear para uma capability interna de proposta. Exemplo: `CARD_BATCH_CREATE` roteia para `board.card.batch_create_proposal`. O endpoint de apply depois roteia a proposta persistida para a capability interna de aplicacao correspondente, como `board.card.apply_create`.

O backend deve segurar a proposta em `ai_action_proposals` enquanto o usuario nao aprovar. Nesse periodo, nada foi alterado na entidade real. A proposta pode expirar, ser editada, rejeitada ou falhar no apply se permissao/estado mudarem.

## Schemas estritos

Todas as model-facing tools devem usar JSON Schema com `strict: true`.

Regras:

- `additionalProperties: false` para objetos;
- todas as propriedades declaradas ficam em `required`;
- valores opcionais usam `type: ["string", "null"]` ou equivalente;
- payloads genericos ainda precisam usar campos fechados;
- backend faz validacao mais estrita por action type depois da chamada do modelo.

Para `action.propose`, evitar `payload` livre. Use campos fechados como `plan`, `cards`, `memberInvites` e `attachments`; campos nao usados ficam `null` ou array vazio. Isso mantem compatibilidade com Structured Outputs e reduz argumentos incompletos.

## Routers e handlers

Classes sugeridas:

```txt
AiCapabilityRegistry
AiModelToolRegistry
AiToolPermissionService
AiModelToolRouter
AiCapabilityExecutor
ActionProposalRouter
ActionProposalHandler
```

Handlers:

```txt
PlanCreateProposalHandler
PlanUpdateProposalHandler
CardBatchCreateProposalHandler
CardUpdateProposalHandler
CardMoveProposalHandler
CardAssignProposalHandler
MemberInviteProposalHandler
FileAttachToCardProposalHandler
InboxConvertToCardProposalHandler
GithubAttachToCardProposalHandler
```

Responsabilidades:

- `AiModelToolRegistry` monta as tools que serao enviadas ao modelo naquela request.
- `AiToolPermissionService` filtra por usuario, workspace, provider e escopo.
- `AiModelToolRouter` recebe uma chamada model-facing e chama capabilities internas.
- `ActionProposalRouter` valida `actionType`, target e payload, depois cria preview/proposta.
- `AiCapabilityExecutor` executa capabilities read-only ou handlers internos com auditoria.

## Fora do escopo

- Aplicar propostas diretamente a partir de output do modelo.
- Expor granular write tools ao modelo.
- Operacoes de escrita no GitHub.

## Definition of Done

- Model-facing tools sao montadas dinamicamente por conversa.
- Tools desabilitadas ou nao autorizadas nao sao enviadas para OpenAI.
- `context.search` e `entity.get` roteiam para capabilities internas de leitura.
- `action.propose` cria apenas propostas pendentes.
- Endpoint de apply e acionado pelo frontend/usuario, nao pelo modelo.
- Tool calls registram capabilities roteadas para auditoria.
