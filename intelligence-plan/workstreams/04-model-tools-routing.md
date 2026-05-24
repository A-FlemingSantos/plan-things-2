# Frente 04: Tools do modelo e roteamento

## Missao do agente

Implemente a camada de tools do Intelligence com duas superficies: poucas `model-facing tools` para o modelo e varias capabilities internas granulares no backend.

O objetivo e reduzir erro de escolha do `gpt-5.4-mini` sem limitar o backend. O modelo escolhe tools agregadoras; o backend valida, roteia, persiste e audita.

## Decisao obrigatoria

Use dois niveis:

```txt
AiCapabilityRegistry = catalogo interno granular.
AiModelToolRegistry = tools enviadas ao modelo.
```

Nao exponha capabilities granulares diretamente ao modelo no MVP.

## Model-facing tools do MVP

Exponha dinamicamente no maximo:

```txt
context.search
entity.get
action.propose
file.search
github.search
```

Regras de montagem:

- Workspace geral: `context.search`, `entity.get`, `action.propose`.
- Kanban com arquivos habilitados: adicionar `file.search`.
- Kanban com GitHub conectado: adicionar `github.search`.
- Provider desconectado ou desabilitado: nao envie a tool.
- Usuario sem permissao: nao envie a tool.

## Intencao de cada tool

| Tool | Quando usar | Resultado |
| ---- | ----------- | --------- |
| `context.search` | Buscar contexto operacional por escopo/intencao. | Resultados categorizados de planos, cards, membros, Inbox e board. |
| `entity.get` | Detalhar entidade ja identificada. | Snapshot permissionado da entidade. |
| `action.propose` | Preparar mudanca revisavel. | `ai_action_proposals` pendente e `ActionProposalBlock`. |
| `file.search` | Buscar arquivos autorizados. | `FileReferenceBlock` e citacoes/metadados. |
| `github.search` | Buscar repos, commits e PRs autorizados. | Blocos GitHub ou insumos para proposta. |

`context.search.query` e frase de busca/ranking. Nao use essa query para liberar ferramentas por palavra-chave. Tools sao liberadas antes, por escopo, permissoes, configuracoes e integracoes.

## Capabilities internas iniciais

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

## `action.propose`

O modelo pode propor mudancas, mas nao pode aplica-las.

Fluxo obrigatorio:

```txt
modelo chama action.propose
backend valida schema e permissoes
backend cria ai_action_proposals pendente
frontend renderiza ActionProposalBlock
usuario aprova/rejeita/edita
frontend chama endpoint de apply
backend revalida e aplica usando servicos existentes
conversa recebe entity references reais
```

`actionType` iniciais:

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

Mapeie cada `actionType` para uma capability interna de proposta. Exemplo: `CARD_BATCH_CREATE` -> `board.card.batch_create_proposal`.

O endpoint de apply usa a proposta persistida para chamar a capability interna de aplicacao correspondente. Enquanto o usuario nao aprovar, nada muda nas entidades reais.

## Schemas estritos

Todas as model-facing tools devem usar JSON Schema com `strict: true`.

Regras:

- `additionalProperties: false` em objetos.
- Todas as propriedades declaradas entram em `required`.
- Campos opcionais usam union com `null`.
- Nao use `payload` livre.
- Valide novamente no backend por `actionType`.

Para `action.propose`, use payload fechado com campos como:

```txt
plan
cards
memberInvites
attachments
```

Campos nao usados ficam `null` ou array vazio.

## Classes alvo

```txt
AiCapabilityRegistry
AiModelToolRegistry
AiToolPermissionService
AiModelToolRouter
AiCapabilityExecutor
ActionProposalRouter
ActionProposalHandler
```

Handlers sugeridos:

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

## Limites desta frente

- Nao exponha apply ao modelo.
- Nao exponha granular write tools ao modelo.
- Nao implemente escrita no GitHub.
- Nao confie em ids vindos do modelo sem revalidar.

## Aceite

- Tools sao montadas dinamicamente por conversa.
- Tools desabilitadas/nao autorizadas nao sao enviadas para OpenAI.
- `context.search` e `entity.get` roteiam para leitura.
- `action.propose` cria apenas proposta pendente.
- Apply e acionado pelo frontend/usuario.
- `ai_tool_calls` registra tool model-facing e capabilities roteadas.
