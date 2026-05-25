# Plan Things Intelligence: plano de implementacao robusta

Data de referencia: 2026-05-23

Este documento descreve um plano completo para transformar a UI incompleta de IA do Plan Things em um copiloto operacional real: chat com `gpt-5.4-mini`, ferramentas internas permissionadas, blocos interativos vinculados a objetos reais, memoria/contexto por conversa, File Search, e integracao GitHub.

## 1. Objetivo do produto

O objetivo nao e apenas "adicionar chat". O objetivo e criar o **Plan Things Intelligence**: uma camada de orquestracao que entende o workspace, usa ferramentas internas, consulta fontes externas e entrega resultados como objetos navegaveis dentro da conversa.

Fluxos-alvo:

1. Usuario pede para criar um plano.
2. IA prepara uma proposta estruturada.
3. Usuario aprova.
4. Backend executa a criacao real usando os servicos existentes.
5. Conversa recebe um bloco de entidade persistida, por exemplo `PlanObjectBlock`.
6. Usuario clica no bloco e abre o plano real no app.

O mesmo padrao vale para cartoes, listas, arquivos, membros, Inbox, commits, pull requests e anexos.

## 2. Estado atual do projeto

Pontos ja existentes no app web:

- `apps/web/src/features/workspace/pages/Workspace/Workspace.jsx`
  
  - Contem `WorkspaceIntelligenceSection`.
  - Hoje usa `buildWorkspaceIntelligenceReply(prompt)`, com resposta simulada por timer.
  - Ja possui prompt, sugestoes, historico simples, voz e botao para adicionar contexto.

- `apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx`
  
  - Contem painel `board-intelligence-panel`.
  - Hoje o submit apenas mostra notificacao de integracao futura.
  - Ja possui menu para adicionar arquivos, item do Kanban, Inbox e plugins GitHub/Teams/Slack.

Isso e uma boa base visual, mas a logica precisa sair do componente e virar uma feature backend-first.

## 3. Decisoes tecnicas principais

### 3.1 Modelo e API

Usar `gpt-5.4-mini` via **Responses API**.

Motivos:

- A pagina do modelo informa suporte a Responses API, streaming, function calling, structured outputs e file search.
- O modelo tem janela de contexto grande, mas ainda assim devemos controlar contexto e custo.
- Responses API se encaixa melhor em tool use, contexto, streaming e estado de conversa do que uma integracao ad hoc por Chat Completions.

Configuracao sugerida:

```yaml
planthings:
  intelligence:
    enabled: true
    model: gpt-5.4-mini
    reasoning-effort: low
    max-output-tokens: 6000
    use-openai-conversations: false
    store-openai-responses: false
```

Para producao com comportamento mais estavel, avaliar pinagem por snapshot (`gpt-5.4-mini-2026-03-17`) depois de criar evals basicos.

### 3.2 Backend como AI Gateway

O frontend nunca deve chamar OpenAI diretamente. O backend Spring deve ser o gateway:

- guarda chaves;
- aplica permissoes;
- decide ferramentas disponiveis;
- executa ferramentas;
- registra auditoria;
- persiste mensagens, blocos e propostas;
- filtra contexto por workspace/plano/usuario;
- faz streaming para o browser.

### 3.3 Streaming

Usar Server-Sent Events entre backend e frontend.

Endpoints sugeridos:

```txt
GET  /api/intelligence/conversations/status
POST /api/intelligence/conversations
GET  /api/intelligence/conversations/{conversationId}
GET  /api/intelligence/conversations/{conversationId}/messages
POST /api/intelligence/conversations/{conversationId}/messages
GET  /api/intelligence/conversations/{conversationId}/stream
POST /api/intelligence/actions/{proposalId}/apply
POST /api/intelligence/actions/{proposalId}/reject
```

Para o primeiro MVP, `POST /messages` pode retornar o `messageId` e iniciar a execucao assincrona; o front abre/escuta o stream da conversa.

Status da Fase 0:

- `GET /status`, criacao/busca de conversa, criacao de mensagem e listagem de mensagens ja existem no backend.
- `POST /messages` ja persiste uma mensagem do usuario e cria uma mensagem do assistente em `PENDING`, mas ainda nao executa o modelo.
- `GET /stream` ja abre um canal SSE validado por usuario e conversa; por enquanto envia apenas `stream.ready`. O streaming real de deltas, blocos e erro continua na Fase 1.
- O backend fecha qualquer stream anterior da mesma conversa antes de registrar um novo emissor.

Eventos SSE sugeridos:

```txt
stream.ready
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

## 4. Modelo conceitual

### 4.1 Conversa

A conversa e uma linha do tempo operacional. Ela contem mensagens, chamadas de ferramenta, propostas, resultados e referencias a objetos reais.

Escopos:

```txt
WORKSPACE
PLAN
CARD
FILE
INBOX
GITHUB_REPOSITORY
```

Uma conversa pode comecar no Workspace e depois anexar contexto de um plano, mas deve ter um escopo primario para autorizacao e recuperacao.

### 4.2 Tipos de mensagem

```txt
USER
ASSISTANT
SYSTEM_EVENT
TOOL_EVENT
ACTION_EVENT
```

`ASSISTANT` nao deve ser so texto. Deve apontar para uma lista de blocos estruturados.

### 4.3 Tipos de bloco

Separar blocos em quatro familias:

```txt
NarrativeBlock
ProposalBlock
EntityReferenceBlock
ExternalEntityReferenceBlock
```

Exemplos:

```txt
markdown
question
plan_proposal
card_batch_proposal
member_invite_proposal
file_attach_proposal
plan_reference
card_reference
file_reference
member_reference
inbox_reference
github_commit_reference
github_pull_request_reference
tool_run_summary
```

### 4.4 Proposal vs Entity Reference

Esta distincao e critica.

`ProposalBlock`:

- algo ainda nao aplicado;
- editavel antes de aplicar;
- pode expirar;
- pode ser rejeitado;
- nao deve navegar para uma entidade que ainda nao existe.

`EntityReferenceBlock`:

- aponta para objeto persistido no banco;
- contem `entityType`, `entityId`, `href` e `snapshot`;
- renderiza uma previa;
- clique navega para a entidade real;
- se a entidade for apagada, o bloco continua historico, mas exibe estado indisponivel.

Exemplo de referencia de plano:

```json
{
  "type": "entity_reference",
  "entityType": "plan",
  "entityId": "uuid",
  "title": "Lancamento da landing page",
  "href": "/workspace/plans/uuid",
  "snapshot": {
    "tag": "Marketing",
    "cardCount": 12,
    "memberCount": 4,
    "updatedAt": "2026-05-23T10:30:00Z"
  }
}
```

Exemplo de referencia de cartao:

```json
{
  "type": "entity_reference",
  "entityType": "card",
  "entityId": "uuid",
  "parentEntityType": "plan",
  "parentEntityId": "uuid-plan",
  "title": "Implementar hero da landing page",
  "href": "/plans/uuid-plan/cards/uuid",
  "snapshot": {
    "column": "Em andamento",
    "assignees": ["Arthur"],
    "dueAt": "2026-06-10T12:00:00Z"
  }
}
```

## 5. Ferramentas da IA e tool routing

### 5.1 Dois niveis de ferramentas

O MVP deve separar claramente:

```txt
Capabilities internas do backend = muitas, granulares, especificas
Tools expostas ao modelo = poucas, agregadoras, bem desenhadas
```

Essa separacao e importante para `gpt-5.4-mini`: reduzir a paleta exposta diminui ambiguidade, economiza tokens, evita sobreposicao de responsabilidade e deixa o backend com mais controle.

Criar dois registries:

```txt
AiCapabilityRegistry      catalogo interno granular
AiModelToolRegistry       ferramentas realmente enviadas ao modelo
```

Nenhuma ferramenta deve existir apenas como texto no prompt. Toda tool exposta ao modelo deve mapear para uma ou mais capabilities internas.

### 5.2 Capabilities internas

As capabilities internas representam operacoes reais ou propostas especificas. Elas podem ser muitas e granulares porque o modelo nao escolhe diretamente entre elas.

Metadados por capability:

```json
{
  "id": "board.card.batch_create_proposal",
  "displayName": "Criar cartao",
  "description": "Prepara uma proposta para criar varios cartoes em uma coluna de um plano.",
  "category": "BOARD",
  "mode": "PROPOSE",
  "requiresConfirmation": true,
  "requiredPermission": "BOARD_CARD_CREATE",
  "defaultEnabled": true,
  "inputSchema": {},
  "outputSchema": {}
}
```

Categorias:

```txt
WORKSPACE
PLAN
BOARD
CARD
MEMBER
FILE
INBOX
CALENDAR
GITHUB
```

Modos:

```txt
READ       executa direto
PROPOSE    gera proposta aplicavel
WRITE      executa apenas apos confirmacao explicita
```

Capabilities internas iniciais:

```txt
workspace.get_summary
workspace.search_plans
plan.get
plan.create_proposal
plan.update_proposal
board.get
board.column.create_proposal
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

Capabilities de aplicacao tambem existem internamente, mas nao sao enviadas ao modelo no MVP:

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

### 5.3 Tools expostas ao modelo no MVP

A paleta model-facing do MVP deve ser pequena e dinamica. Regra pratica:

```txt
Enviar no maximo 5 tools por request no MVP.
Em versoes futuras, permitir ate 8 quando forem contextuais e nao redundantes.
Nao enviar tools de integracao desconectada ou desabilitada.
Nao enviar tools de aplicacao/write direta ao modelo.
```

Tools recomendadas:

```txt
context.search
entity.get
action.propose
file.search
github.search
```

| Tool exposta     | Papel                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `context.search` | Busca contexto operacional do workspace/plano: planos, cards, membros, Inbox, calendario e estado do board. |
| `entity.get`     | Busca detalhes de uma entidade especifica ja identificada.                                                  |
| `action.propose` | Cria uma proposta de acao, sem aplicar diretamente.                                                         |
| `file.search`    | Busca arquivos por metadados e/ou conteudo semantico.                                                       |
| `github.search`  | Busca repositorios, commits e pull requests autorizados.                                                    |

Exemplos de paleta dinamica:

```txt
Workspace geral:
context.search
entity.get
action.propose

Kanban com arquivos habilitados:
context.search
entity.get
action.propose
file.search

Kanban com GitHub conectado:
context.search
entity.get
action.propose
file.search
github.search
```

### 5.4 Tool routing

O backend deve rotear tools agregadoras para capabilities internas.

Fluxo:

```txt
Modelo chama action.propose
|
ActionProposalRouter valida actionType, target e payload
|
Handler especifico cria preview/proposta
|
Usuario aprova no frontend
|
POST /api/intelligence/actions/{proposalId}/apply
|
Backend revalida permissoes e executa servico interno real
```

Handlers internos sugeridos:

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

### 5.5 Function Calling e schemas

Cada ferramenta exposta para OpenAI deve usar JSON Schema com `strict: true`.

Exemplo conceitual de `action.propose`:

```json
{
  "type": "function",
  "name": "action_propose",
  "description": "Cria uma proposta de acao no Plan Things. Nao aplica a acao diretamente.",
  "strict": true,
  "parameters": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "actionType": {
        "type": "string",
        "enum": [
          "PLAN_CREATE",
          "PLAN_UPDATE",
          "CARD_BATCH_CREATE",
          "CARD_UPDATE",
          "CARD_MOVE",
          "CARD_ASSIGN",
          "MEMBER_INVITE",
          "FILE_ATTACH_TO_CARD",
          "INBOX_CONVERT_TO_CARD",
          "GITHUB_ATTACH_TO_CARD"
        ]
      },
      "target": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "workspaceId": { "type": ["string", "null"] },
          "planId": { "type": ["string", "null"] },
          "cardId": { "type": ["string", "null"] },
          "fileId": { "type": ["string", "null"] }
        },
        "required": ["workspaceId", "planId", "cardId", "fileId"]
      },
      "payload": {
        "type": "object",
        "description": "Payload especifico do actionType em campos fechados. O backend validara com schema interno mais estrito.",
        "additionalProperties": false,
        "properties": {
          "plan": {
            "type": ["object", "null"],
            "additionalProperties": false,
            "properties": {
              "name": { "type": ["string", "null"] },
              "tag": { "type": ["string", "null"] },
              "description": { "type": ["string", "null"] }
            },
            "required": ["name", "tag", "description"]
          },
          "cards": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "title": { "type": "string" },
                "description": { "type": "string" },
                "columnId": { "type": ["string", "null"] },
                "assigneeUserIds": {
                  "type": "array",
                  "items": { "type": "string" }
                },
                "dueAt": { "type": ["string", "null"] }
              },
              "required": ["title", "description", "columnId", "assigneeUserIds", "dueAt"]
            }
          },
          "memberInvites": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "email": { "type": "string" },
                "role": { "type": ["string", "null"] }
              },
              "required": ["email", "role"]
            }
          },
          "attachments": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "sourceType": { "type": "string" },
                "sourceId": { "type": "string" },
                "targetType": { "type": "string" },
                "targetId": { "type": "string" }
              },
              "required": ["sourceType", "sourceId", "targetType", "targetId"]
            }
          }
        },
        "required": ["plan", "cards", "memberInvites", "attachments"]
      },
      "reason": {
        "type": "string",
        "description": "Motivo curto para mostrar ao usuario na proposta."
      }
    },
    "required": ["actionType", "target", "payload", "reason"]
  }
}
```

Exemplo de chamada para criar varios cartoes:

```json
{
  "actionType": "CARD_BATCH_CREATE",
  "target": {
    "workspaceId": "uuid-workspace",
    "planId": "uuid-plan",
    "cardId": null,
    "fileId": null
  },
  "payload": {
    "plan": null,
    "cards": [
      {
        "title": "Implementar tela de login",
        "description": "Criar UI, validacoes e integracao com autenticacao.",
        "columnId": "uuid-column",
        "assigneeUserIds": [],
        "dueAt": null
      }
    ],
    "memberInvites": [],
    "attachments": []
  },
  "reason": "Transformar o pedido do usuario em tarefas executaveis no Kanban."
}
```

O schema exposto ao modelo deve ser simples, mas fechado. Campos nao usados ficam `null` ou arrays vazios. O backend deve aplicar schemas internos mais especificos por `actionType`. Se `payload` nao bater com o schema interno, a proposta falha com erro recuperavel e o modelo pode pedir os dados faltantes.

Exemplo conceitual de `context.search`:

```json
{
  "scope": {
    "type": "PLAN",
    "workspaceId": "uuid-workspace",
    "planId": "uuid-plan"
  },
  "query": "cards relacionados a login",
  "include": ["plans", "cards", "members", "inbox"],
  "limit": 12
}
```

`query` e uma frase de intencao para busca e ranking, nao um mecanismo de permissao nem um parser palavra por palavra. O backend nao deve liberar tools por detectar termos como "arquivo", "commit" ou "card" dentro da query. A paleta de tools ja deve ter sido montada antes, com base em escopo, permissoes, integracoes habilitadas e configuracoes do usuario/workspace. Depois disso, `context.search` usa a query para encontrar entidades relevantes dentro do universo autorizado.

Resposta deve ser categorizada, nao texto solto:

```json
{
  "results": [
    {
      "entityType": "card",
      "entityId": "uuid-card",
      "title": "Implementar tela de login",
      "summary": "Card em Em andamento com uma checklist pendente."
    }
  ]
}
```

Exemplo conceitual de `github.search`:

```json
{
  "entityTypes": ["commit", "pull_request"],
  "query": "alteracoes recentes relacionadas ao login",
  "repoIds": ["uuid-repo"],
  "dateRange": {
    "from": "2026-05-01",
    "to": "2026-05-23"
  },
  "limit": 10
}
```

O backend decide internamente se lista commits, busca PRs, pega detalhes ou usa cache local.

O backend valida novamente usando DTOs Java, schemas internos e permissoes reais. O schema ajuda o modelo, mas nao substitui autorizacao.

### 5.6 Aplicacao de propostas

Ferramentas de apply nao devem ser expostas ao modelo no MVP.

Quando o modelo chama `action.propose`, o backend valida os argumentos e persiste uma proposta em `ai_action_proposals`. A proposta fica "segura" enquanto o usuario nao aprovar: nada foi alterado na entidade real. Nesse estado, ela pode expirar, ser editada, rejeitada ou falhar depois se permissao/estado mudarem.

Aplicacao e sempre acionada pelo frontend:

```txt
POST /api/intelligence/actions/{proposalId}/apply
```

O backend entao:

1. carrega a proposta;
2. verifica status, expiracao e usuario;
3. revalida permissoes atuais;
4. chama o handler interno de aplicacao;
5. executa servicos existentes do Plan Things;
6. registra auditoria;
7. cria blocos de entidade real na conversa.

## 6. Permissoes e configuracoes

### 6.1 Tres niveis de permissao

1. Permissao do usuario no app.
2. Ferramenta habilitada/desabilitada nas configuracoes.
3. Permissao do provedor externo, quando houver integracao.

Uma ferramenta so pode ser enviada ao modelo se passar pelos tres filtros.

### 6.2 Configuracoes por usuario e workspace

Tabelas sugeridas:

```txt
ai_tool_settings
- id
- workspace_id
- user_id nullable
- tool_id
- enabled
- created_at
- updated_at

ai_integration_settings
- id
- workspace_id
- provider
- enabled
- settings_json
- created_at
- updated_at
```

Regra:

- workspace define padrao;
- usuario pode restringir mais;
- usuario nao pode habilitar ferramenta bloqueada pelo workspace;
- capabilities de escrita devem permitir configuracao separada de "propor" vs "aplicar";
- tools model-facing so devem ser montadas depois de aplicar permissoes, integracoes conectadas e escopo atual da conversa.

### 6.3 Confirmacao humana obrigatoria

Todas as ferramentas que criam, editam, removem, convidam, atribuem, enviam e-mails ou anexam arquivos devem exigir confirmacao.

Nao permitir que o modelo tenha ferramenta direta de escrita no primeiro ciclo. Em vez disso:

```txt
tool proposal -> usuario aprova -> backend aplica -> entity reference
```

## 7. Contexto e memoria

### 7.1 Tipos de contexto

Separar contexto em:

```txt
Conversation state: mensagens e tool calls da conversa atual.
Working context: snapshot do workspace/plano no momento da mensagem.
Attached context: objetos explicitamente anexados pelo usuario.
Long-term memory: preferencias e fatos estaveis aprovados.
External context: GitHub, arquivos indexados e outros conectores.
Runtime compaction: itens opacos da OpenAI para continuidade eficiente de conversas longas.
```

### 7.2 Estrategia recomendada

Persistir o estado proprio no banco do Plan Things e usar OpenAI como runtime.

Motivos:

- auditoria;
- controle multi-tenant;
- capacidade de reprocessar;
- controle de retencao;
- independencia caso mude a API;
- renderizacao historica dos blocos interativos.

Mesmo se usarmos `previous_response_id`, Conversations API ou Compaction da OpenAI, o banco local deve continuar sendo a fonte de verdade da UI, das acoes, dos snapshots auditaveis e das permissoes.

### 7.3 Snapshot por mensagem

Cada mensagem do usuario deve gerar um snapshot:

```txt
ai_context_snapshots
- id
- conversation_id
- message_id
- workspace_id
- plan_id nullable
- context_json
- token_estimate
- created_at
```

Conteudo do snapshot:

- usuario atual;
- workspace ativo;
- plano ativo;
- colunas do Kanban;
- cartoes relevantes, nao todos quando houver muitos;
- membros;
- preferencias;
- anexos explicitamente selecionados;
- resultados de capabilities read-only;
- repos GitHub habilitados, se pertinente.

### 7.4 Long-term memory

Memoria nao deve ser gravada automaticamente sem criterio.

Exemplos aceitaveis:

- "Usuario prefere planos com colunas Backlog, Doing, Review, Done."
- "Workspace usa sprints semanais."
- "Projeto X costuma mapear commits para cartoes por prefixo PT-."

Tabela:

```txt
ai_memories
- id
- workspace_id
- user_id nullable
- scope
- content
- source_message_id
- status: active | archived | rejected
- confidence
- created_at
- updated_at
```

Memorias sensiveis ou que alterem comportamento de escrita devem exigir confirmacao.

### 7.5 Compaction da OpenAI

Incorporar a Compaction oficial da Responses API como mecanismo de runtime para conversas longas. Ela reduz o tamanho do contexto preservando estado necessario para turnos seguintes, ajudando a equilibrar qualidade, custo e latencia.

Modos disponiveis:

```txt
Server-side compaction:
usar context_management com compact_threshold em /responses.
Quando o limite renderizado de tokens e ultrapassado, a OpenAI compacta no proprio fluxo.

Standalone compact endpoint:
usar /responses/compact para compactar explicitamente uma janela de contexto.
O endpoint retorna uma nova janela compactada para usar no proximo /responses.
```

Exemplo conceitual de server-side compaction:

```json
{
  "model": "gpt-5.4-mini",
  "input": [],
  "store": false,
  "context_management": [
    {
      "type": "compaction",
      "compact_threshold": 120000
    }
  ]
}
```

Politica recomendada para o Plan Things:

1. Manter `ai_context_snapshots` como fonte auditavel e legivel.
2. Usar `context_management.compaction` em conversas longas ou com muitas tool calls.
3. Definir `compact_threshold` por modelo, plano de uso e ambiente.
4. Armazenar metadados dos itens de compaction recebidos, mas tratar o conteudo como opaco.
5. Nao usar compaction para permissoes, auditoria, explicabilidade ou renderizacao historica.
6. Manter resumo proprio legivel da conversa para debug/produto quando necessario.
7. Se usar `previous_response_id`, nao podar manualmente o historico.
8. Se usar input-array stateless, podar apenas itens anteriores ao item de compaction mais recente.
9. Se usar `/responses/compact`, passar a saida compactada para a proxima chamada como veio, sem poda manual.

Separacao de responsabilidades:

```txt
Compaction OpenAI = continuidade eficiente de runtime, opaca e nao auditavel.
Snapshots locais = auditoria, debug, reprocessamento, permissao e historico de UI.
Resumo proprio = legivel por humanos, util para suporte e continuidade de produto.
```

Tabela opcional:

```txt
ai_compaction_items
- id uuid pk
- conversation_id uuid not null
- message_id uuid nullable
- openai_response_id varchar nullable
- compaction_mode varchar not null
- compact_threshold int nullable
- input_token_estimate int nullable
- output_item_ref varchar nullable
- opaque_payload_json nvarchar(max) nullable
- created_at datetimeoffset
```

## 8. File Search e arquivos

### 8.1 Duas camadas de busca

Usar duas camadas:

1. Busca local no banco: nome, tipo, dono, anexos, permissoes e relacoes.
2. OpenAI File Search: busca semantica no conteudo de documentos.

Nunca deixar File Search substituir o controle local de acesso.

### 8.2 Vector stores

Opcoes:

```txt
Por workspace: melhor para busca ampla, exige cuidado com permissoes internas.
Por plano: melhor isolamento, mais simples para contexto de Kanban.
Por conversa: bom para arquivos temporarios anexados no chat.
```

Recomendacao inicial:

- vector store por workspace para arquivos compartilhados;
- vector store por conversa para anexos ad hoc;
- sempre filtrar quais vector stores e arquivos entram na request a partir das permissoes do usuario.

Tabela de mapeamento:

```txt
ai_file_index
- id
- workspace_id
- plan_id nullable
- file_id
- openai_file_id
- openai_vector_store_id
- index_status
- content_hash
- last_indexed_at
- created_at
```

### 8.3 Eventos de arquivo

Quando arquivo for criado, atualizado, removido ou permissao mudar:

1. atualizar registro local;
2. enfileirar indexacao;
3. atualizar/remover no vector store;
4. registrar falha se houver erro.

## 9. Integracao GitHub

### 9.1 Usar GitHub App

Usar GitHub App, nao OAuth App puro, para a integracao do workspace.

Motivos:

- permissoes granulares;
- instalacao por organizacao/usuario;
- selecao de repositorios;
- webhooks nativos;
- installation access tokens de curta duracao;
- melhor isolamento para workspace.

Permissoes iniciais recomendadas:

```txt
Metadata: read
Contents: read
Pull requests: read
Commit statuses: read opcional
Checks: read opcional
Issues: read opcional, write somente em fase futura
```

Nao pedir permissao de escrita no GitHub no primeiro release. O app pode anexar commits/PRs a cartoes dentro do Plan Things sem escrever no GitHub.

### 9.2 Instalacao e tokens

Modelo:

```txt
github_installations
- id
- workspace_id
- installation_id
- account_login
- account_type
- repository_selection
- status
- created_at
- updated_at

github_repositories
- id
- workspace_id
- installation_id
- github_repo_id
- owner
- name
- full_name
- default_branch
- private
- enabled
- last_synced_at
```

O backend gera installation access token sob demanda. Tokens expiram em uma hora; nao guardar token longo em banco. Guardar apenas installation id e metadados.

### 9.3 Webhooks

Eventos iniciais:

```txt
installation
installation_repositories
push
pull_request
pull_request_review
check_suite ou check_run opcional
```

Seguranca:

- validar `X-Hub-Signature-256`;
- usar segredo de webhook;
- rejeitar payload invalido;
- idempotencia por delivery id;
- enfileirar processamento, responder rapido ao GitHub.

Tabela:

```txt
github_webhook_events
- id
- delivery_id
- event_type
- action
- installation_id
- repository_id nullable
- payload_json
- processed_at nullable
- status
- created_at
```

### 9.4 Objetos externos no chat

Commits e PRs entram como `ExternalEntityReferenceBlock`:

```json
{
  "type": "external_entity_reference",
  "provider": "github",
  "entityType": "commit",
  "externalId": "sha",
  "title": "feat: add kanban filters",
  "href": "https://github.com/org/repo/commit/sha",
  "snapshot": {
    "repo": "org/repo",
    "author": "arthur",
    "committedAt": "2026-05-23T10:00:00Z"
  },
  "attachedTo": {
    "entityType": "card",
    "entityId": "uuid-card"
  }
}
```

### 9.5 Relacionar GitHub com Plan Things

Tabelas:

```txt
external_entity_links
- id
- workspace_id
- provider
- external_type
- external_id
- external_url
- entity_type
- entity_id
- metadata_json
- created_by_user_id
- created_at
```

Interface model-facing inicial:

```txt
github.search
```

Capabilities internas iniciais:

```txt
github.commit.search
github.pull_request.get
github.pull_request.search
github.commit.get
github.commit.attach_to_card_proposal
github.pull_request.attach_to_card_proposal
github.suggest_cards_from_commits
```

## 10. Banco de dados sugerido

### 10.1 Conversas e mensagens

```txt
ai_conversations
- id uuid pk
- workspace_id uuid not null
- plan_id uuid nullable
- card_id uuid nullable
- created_by_user_id uuid not null
- title varchar
- scope_type varchar not null
- status varchar not null
- openai_conversation_id varchar nullable
- last_openai_response_id varchar nullable
- created_at datetimeoffset
- updated_at datetimeoffset

ai_messages
- id uuid pk
- conversation_id uuid not null
- role varchar not null
- status varchar not null
- content_text nvarchar(max) nullable
- openai_response_id varchar nullable
- token_usage_json nvarchar(max) nullable
- error_code varchar nullable
- created_at datetimeoffset
```

### 10.2 Blocos

```txt
ai_message_blocks
- id uuid pk
- message_id uuid not null
- block_type varchar not null
- position int not null
- entity_type varchar nullable
- entity_id uuid nullable
- external_provider varchar nullable
- external_type varchar nullable
- external_id varchar nullable
- action_proposal_id uuid nullable
- href varchar nullable
- title nvarchar(300) nullable
- payload_json nvarchar(max) not null
- snapshot_json nvarchar(max) nullable
- created_at datetimeoffset
```

### 10.3 Propostas e execucao

```txt
ai_action_proposals
- id uuid pk
- conversation_id uuid not null
- message_id uuid not null
- action_type varchar not null
- capability_id varchar not null
- status varchar not null
- input_json nvarchar(max) not null
- preview_json nvarchar(max) not null
- result_json nvarchar(max) nullable
- result_entity_type varchar nullable
- result_entity_id uuid nullable
- created_by_user_id uuid not null
- approved_by_user_id uuid nullable
- created_at datetimeoffset
- approved_at datetimeoffset nullable
- applied_at datetimeoffset nullable
- expires_at datetimeoffset nullable

ai_tool_calls
- id uuid pk
- conversation_id uuid not null
- message_id uuid nullable
- tool_id varchar not null
- routed_capability_ids_json nvarchar(max) nullable
- mode varchar not null
- status varchar not null
- input_json nvarchar(max) not null
- output_json nvarchar(max) nullable
- error_code varchar nullable
- duration_ms int nullable
- created_at datetimeoffset
```

### 10.4 Configuracoes, memoria e auditoria

```txt
ai_tool_settings
ai_integration_settings
ai_context_snapshots
ai_compaction_items
ai_memories
ai_audit_events
```

Status da Fase 0:

- A migration `V21__ai_intelligence_core.sql` ja criou `ai_conversations`, `ai_messages` e `ai_message_blocks`.
- `ai_conversations` ja guarda `workspace_id`, `plan_id`, `card_id`, usuario criador, `scope_type`, status e ids de continuidade da OpenAI.
- `ai_messages` ja guarda role, status, texto, `openai_response_id`, uso de tokens e erro.
- `ai_message_blocks` ja esta preparado para blocos narrativos, propostas, referencias internas e externas, com `payload_json` e `snapshot_json`.
- `ai_action_proposals`, `ai_tool_calls`, settings, snapshots, compaction items, memories e audit events continuam planejados para fases posteriores.
- O cleanup dos testes de integracao ja limpa as tabelas de IA antes das entidades de board/plano para respeitar as FKs novas.

`ai_audit_events` deve registrar:

- quem pediu;
- quais model-facing tools estavam habilitadas;
- qual tool foi chamada e para quais capabilities ela roteou;
- quais entidades foram afetadas;
- quem aprovou;
- resultado;
- erro.

## 11. Backend: pacotes e classes

Pacote sugerido:

```txt
com.planthings.api.intelligence
```

Classes:

```txt
AiConversationController
AiConversationService
AiStreamingService
AiOpenAiClient
DefaultAiOpenAiClient
IntelligenceFeatureService
IntelligenceProperties
AiPromptBuilder
AiContextBuilder
AiContextCompactionService
AiCapabilityRegistry
AiModelToolRegistry
AiToolPermissionService
AiModelToolRouter
AiCapabilityExecutor
ActionProposalRouter
AiActionProposalService
AiBlockFactory
AiMemoryService
AiAuditService
AiFileSearchService
AiGithubToolAdapter
```

Subpacotes:

```txt
intelligence.tools
intelligence.blocks
intelligence.github
intelligence.files
intelligence.persistence
```

Status da Fase 0:

- `AiConversationController`, `AiConversationService`, `AiStreamingService`, `AiOpenAiClient`, `DefaultAiOpenAiClient`, `IntelligenceFeatureService`, `IntelligenceProperties`, modelos enum e repositories JPA ja existem.
- `DefaultAiOpenAiClient` ja monta chamadas para a Responses API, extrai `output_text` e captura `usage`, mas ainda nao esta conectado ao fluxo de resposta do chat.
- `IntelligenceProperties` ja cobre feature flag, `OPENAI_API_KEY`, modelo, reasoning effort, limite de output, opcao de store, opcao de conversations e `compact_threshold`.
- A criacao de conversa ja valida workspace/plano/card: quando `cardId` vem no request, o backend deriva o `planId`, valida acesso ao plano do card e rejeita combinacoes `planId`/`cardId` inconsistentes.
- `AiConversationService` ainda nao deve duplicar regra de negocio; nas proximas fases, tools e propostas devem continuar chamando servicos existentes como `BoardService`, `PlanService`, `FileService` e servicos de convites.

Observacao importante: as ferramentas devem chamar os servicos existentes (`WorkspaceService`, `BoardService`, servicos de arquivos, convites etc.) em vez de duplicar regra de negocio.

## 12. Frontend: componentes e hooks

Criar feature compartilhada:

```txt
apps/web/src/features/intelligence
```

Estrutura:

```txt
api/intelligenceApi.js
hooks/useAiConversation.js
hooks/useAiStream.js
components/AiComposer
components/AiConversation
components/AiBlockRenderer
components/blocks/MarkdownBlock
components/blocks/PlanReferenceBlock
components/blocks/CardReferenceBlock
components/blocks/FileReferenceBlock
components/blocks/MemberReferenceBlock
components/blocks/GitHubCommitBlock
components/blocks/GitHubPullRequestBlock
components/blocks/ActionProposalBlock
components/blocks/QuestionBlock
```

Integracao:

- `WorkspaceIntelligenceSection` passa a usar `AiConversation`.
- `KanbanBoard` passa a usar o mesmo componente com `scopeType=PLAN` e `planId`.
- O menu `+` do Kanban cria anexos de contexto reais em vez de apenas mostrar notificacao.

### 12.1 Navegacao

Cada bloco de entidade deve ter `href` e metadata suficiente.

Exemplos:

```txt
plan -> navega para o Kanban do plano
card -> abre plano e modal do card
file -> abre preview/download/arquivo
inbox -> abre painel Inbox com item selecionado
commit -> abre GitHub em nova aba ou bloco de detalhes
```

Se a rota atual nao suporta abrir card por URL, criar suporte:

```txt
/plans/{planId}/cards/{cardId}
```

ou query param:

```txt
/plans/{planId}?card={cardId}
```

### 12.2 Mock visual como contrato de implementacao

A UI atual de IA no Workspace e no Kanban ainda deve ser remodelada antes da integracao real. Esse mock final deve ser tratado como **contrato visual e interativo** para a implementacao, nao como uma camada descartavel.

O mock deve definir:

- hierarquia do chat e do composer;
- comportamento de streaming;
- formato visual de blocos narrativos;
- formato visual de propostas pendentes;
- formato visual de objetos reais clicaveis;
- estados de erro, retry, cancelamento e loading;
- anexos/contexto adicionados ao prompt;
- indicacao de ferramentas ou integracoes habilitadas;
- diferencas entre Workspace, Kanban e contexto de card.

O mock deve usar dados fake, mas com os mesmos tipos esperados pelo contrato real:

```txt
MarkdownBlock
PlanReferenceBlock
CardReferenceBlock
FileReferenceBlock
MemberReferenceBlock
InboxReferenceBlock
GitHubCommitBlock
GitHubPullRequestBlock
ActionProposalBlock
QuestionBlock
ToolRunStatusBlock
```

Estados obrigatorios a representar:

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

Regras para o mock:

- blocos de entidade devem parecer objetos navegaveis, nao mensagens soltas;
- propostas devem deixar claro que nada foi aplicado ainda;
- depois de uma proposta aprovada, o mock deve mostrar o objeto real criado/editado como entity reference;
- o composer deve suportar texto, contexto anexado, ferramentas/integracoes, voz e cancelamento de geracao;
- o layout deve evitar depender de texto explicativo dentro do app para ensinar a feature;
- o `AiBlockRenderer` real deve conseguir substituir os dados fake sem trocar a arquitetura visual.

Essa etapa deve acontecer antes da implementacao completa de tools e propostas, porque ela define o contrato de experiencia que o backend precisa alimentar.

### 12.3 Renderizacao markdown e blocos estruturados

Projetos como Open WebUI usam uma abordagem **markdown-first**: o conteudo do assistente e processado por um parser, transformado em tokens e renderizado por componentes especificos para headings, tabelas, code blocks, KaTeX, Mermaid, citacoes, detalhes colapsaveis e tool calls. Essa referencia e util para o `MarkdownBlock`, principalmente por dois motivos:

- renderizar markdown com componentes controlados e extensoes explicitas e mais seguro/manutenivel do que injetar HTML cru;
- durante streaming, reprocessar markdown pesado a cada chunk pode travar a UI, entao o renderer deve usar throttle/debounce ou uma renderizacao parcial leve.

Para o Plan Things, a decisao arquitetural e:

```txt
MarkdownBlock = narrativa, listas, tabelas, codigo, links, citacoes e diagramas.
EntityReferenceBlock = objetos reais navegaveis, fora do markdown.
ActionProposalBlock = propostas aprovaveis, fora do markdown.
ToolRunStatusBlock = estado de ferramentas, fora do markdown.
```

Ou seja, nao embutir planos, cartoes, arquivos, membros, Inbox ou commits como markdown customizado. Esses itens devem continuar como blocos estruturados tipados, renderizados pelo `AiBlockRenderer`. O markdown pode mencionar ou explicar objetos, mas a navegacao, o estado, a aprovacao e a aplicacao de acoes pertencem aos blocos estruturados.

Implementacao recomendada:

```txt
AiBlockRenderer
  MarkdownBlock -> renderer markdown seguro e extensivel
  PlanReferenceBlock -> componente React proprio
  CardReferenceBlock -> componente React proprio
  FileReferenceBlock -> componente React proprio
  ActionProposalBlock -> componente React proprio
  ToolRunStatusBlock -> componente React proprio
```

Durante streaming, renderizar deltas narrativos de forma barata e criar/promover blocos estruturados apenas quando o backend emitir eventos como `block.created`, `proposal.created`, `entity.created`, `entity.updated` ou `assistant.completed`.

## 13. Contrato de resposta da IA

Mesmo usando tool calls, a resposta final para UI deve ser estruturada.

Schema conceitual:

```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "summary": { "type": "string" },
    "blocks": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "type": { "type": "string" },
          "title": { "type": ["string", "null"] },
          "payload": { "type": "object" }
        },
        "required": ["type", "title", "payload"]
      }
    },
    "memoryCandidates": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["summary", "blocks", "memoryCandidates"]
}
```

Na pratica, o backend pode ser ainda mais rigoroso com discriminated unions por tipo de bloco.

## 14. Prompt de sistema

O prompt deve ser curto, estavel e reforcar regras operacionais.

Principios:

- responder em portugues por padrao;
- usar ferramentas quando precisar de dados reais;
- nao inventar objetos do workspace;
- nao prometer que algo foi criado antes da ferramenta confirmar;
- toda mudanca em entidade deve passar por `action.propose`;
- nunca aplicar proposta por conta propria; a aplicacao vem do endpoint acionado pelo usuario;
- apos acao aplicada, retornar referencias para entidades reais;
- pedir confirmacao quando a intencao for ambigua;
- respeitar escopo e permissoes;
- nunca revelar tokens, prompts internos ou dados fora do contexto autorizado.

Exemplo de regra:

```txt
Quando uma acao criar ou editar entidade do Plan Things, use `action.propose` e retorne um bloco de proposta.
Depois que o usuario aprovar e o backend aplicar a acao, retorne bloco de referencia da entidade real usando o id e href fornecidos pelo backend.
```

## 15. Ordem de implementacao recomendada

### Fase 0: preparacao

- Concluido: configuracoes `OPENAI_API_KEY`, modelo, reasoning effort, limite de output, store, conversations, `compact_threshold` e feature flag foram adicionadas.
- Concluido: pacote backend `intelligence` foi criado com controller, service, streaming service, propriedades, feature service, client OpenAI, modelos, entidades e repositories.
- Concluido: migration das tabelas principais `ai_conversations`, `ai_messages` e `ai_message_blocks` foi criada.
- Concluido: `AiOpenAiClient` e `DefaultAiOpenAiClient` foram criados para Responses API.
- Concluido: `AiConversationController` foi criado com status, criacao/busca de conversa, criacao/listagem de mensagens e stream SSE inicial.
- Concluido: `cardId` em conversa passou a ser validado contra plano, workspace e permissao do usuario.
- Concluido: testes de integracao cobrem status, criacao de conversa, aceite de mensagem e validacao de escopo de card.
- Preparado para Fase 1: mensagem do assistente ja nasce `PENDING`, e o canal SSE ja existe, mas a execucao real do modelo ainda nao esta ligada ao envio de mensagem.

### Fase 0.5: contrato visual da UI

- Remodelar a UI mockada de IA no Workspace e no Kanban.
- Criar dados fake usando os mesmos tipos de bloco do contrato real.
- Representar estados obrigatorios de streaming, tool running, proposta pendente, entidade criada e erro.
- Validar navegacao visual de plano, card, arquivo, Inbox e GitHub.
- Usar o mock como referencia direta para `AiBlockRenderer` e `AiComposer`.

### Fase 1: chat real sem ferramentas mutantes

- Substituir respostas simuladas do Workspace por chamada real.
- Implementar streaming SSE.
- Persistir conversas, mensagens e blocos `markdown`.
- Implementar renderizacao segura de markdown.
- Configurar `context_management.compaction` para conversas que ultrapassarem o limiar definido.
- Persistir metadados de compaction sem tratar o item opaco como conteudo auditavel.
- Testar erro, retry, stop e loading.

### Fase 2: blocos estruturados

- Criar `AiBlockRenderer`.
- Implementar `PlanReferenceBlock`, `CardReferenceBlock`, `FileReferenceBlock`.
- Criar contrato JSON de blocos.
- Fazer backend salvar blocos em `ai_message_blocks`.
- Fazer blocos navegarem para objetos reais.

### Fase 3: Model-facing tools e contexto read-only

- Criar `AiCapabilityRegistry`.
- Criar `AiModelToolRegistry`.
- Criar `AiToolPermissionService`.
- Criar `AiModelToolRouter`.
- Implementar capabilities read-only:
  - `workspace.get_summary`
  - `plan.get`
  - `board.get`
  - `board.card.search`
  - `file.search_metadata`
- Expor ao modelo apenas `context.search` e `entity.get` nessa fase.
- Enviar somente model-facing tools habilitadas, conectadas e relevantes ao escopo.
- Registrar `ai_tool_calls`.

### Fase 4: propostas confirmaveis via `action.propose`

- Implementar `ai_action_proposals`.
- Implementar `ActionProposalRouter`.
- Expor ao modelo `action.propose`.
- Implementar `actionType` iniciais e mapear cada um para capability interna:
  - `PLAN_CREATE` -> `plan.create_proposal`
  - `CARD_BATCH_CREATE` -> `board.card.batch_create_proposal`
  - `CARD_UPDATE` -> `board.card.update_proposal`
  - `MEMBER_INVITE` -> `member.invite_proposal`
- UI:
  - `ActionProposalBlock`
  - revisar detalhes;
  - editar campos basicos;
  - aplicar;
  - rejeitar.

### Fase 5: aplicacao de acoes

- `POST /api/intelligence/actions/{proposalId}/apply`.
- Nao expor tools de apply ao modelo.
- Aplicar usando servicos existentes.
- Revalidar permissoes.
- Criar evento de auditoria.
- Retornar entity reference real.
- Atualizar conversa com bloco de resultado.

### Fase 6: File Search

- Criar mapeamento `ai_file_index`.
- Criar fila de indexacao.
- Indexar arquivos suportados.
- Implementar capability interna `file.search_content`.
- Expor ao modelo `file.search` quando arquivos estiverem habilitados.
- Renderizar citacoes/referencias a arquivos.
- Respeitar permissoes antes de anexar vector stores na request.

### Fase 7: GitHub read-only

- Criar GitHub App.
- Implementar OAuth/instalacao/retorno.
- Salvar installations e repositorios.
- Validar webhooks.
- Implementar capabilities read-only:
  - listar repos;
  - listar commits;
  - listar PRs;
  - buscar commits por periodo/autor/texto.
- Expor ao modelo apenas `github.search` quando GitHub estiver conectado e autorizado.
- Renderizar `GitHubCommitBlock` e `GitHubPullRequestBlock`.

### Fase 8: GitHub + Kanban

- Propor cartoes a partir de commits/PRs.
- Anexar commits/PRs a cartoes do Plan Things.
- Criar `external_entity_links`.
- Fazer `github.search` alimentar referencias externas e `action.propose` criar propostas de anexos/cartoes.
- Mostrar anexos GitHub dentro do card/modal.

### Fase 9: configuracoes e governanca

- Tela de configuracoes de ferramentas.
- Habilitar/desabilitar por workspace/usuario.
- Logs de auditoria.
- Rate limits por usuario/workspace.
- Evals de ferramentas e blocos.

## 16. Testes

Backend:

- testes unitarios de `AiToolPermissionService`;
- testes de schema/validacao de ferramentas;
- testes de aplicacao de propostas;
- testes de auditoria;
- testes de isolamento entre workspaces;
- testes de webhooks GitHub com assinatura valida/invalida;
- testes de retry para OpenAI/GitHub.

Frontend:

- renderizacao de cada bloco;
- clique em entity reference;
- aplicar/rejeitar proposta;
- streaming incremental;
- erro de stream;
- permissao/ferramenta desabilitada;
- regressao nos testes existentes do Workspace e Kanban.

Evals:

- usuario pede criacao de plano;
- usuario pede criacao de cartoes;
- usuario pede resumo do board;
- usuario pede commits recentes;
- usuario pede anexo de commit em cartao;
- usuario pede acao sem permissao.

## 17. Seguranca e privacidade

Regras:

- nao enviar dados fora do workspace autorizado;
- nao enviar ferramentas desabilitadas ao modelo;
- nao confiar em ids vindos do modelo sem validar;
- todas as escritas exigem confirmacao humana;
- todas as escritas usam servicos internos existentes;
- chaves OpenAI e GitHub apenas em backend/secret manager;
- logs nao devem armazenar segredo;
- payloads podem conter dados sensiveis, portanto precisam de retencao definida;
- GitHub webhook sempre validado por assinatura;
- File Search deve respeitar permissoes locais.

## 18. Observabilidade

Registrar:

- modelo usado;
- latencia total;
- latencia por ferramenta;
- tokens de input/output;
- eventos de compaction e thresholds usados;
- custo estimado;
- quantidade de tool calls;
- falhas de schema;
- propostas criadas/aprovadas/rejeitadas;
- entidades criadas/editadas;
- erros OpenAI;
- erros GitHub;
- rate limit restante do GitHub quando disponivel.

Dashboard interno futuro:

```txt
AI usage por workspace
AI actions applied
AI failed tools
GitHub sync status
File index status
```

## 19. Riscos e mitigacoes

Risco: modelo inventar objeto.
Mitigacao: ferramentas read-only para buscar dados reais, schema estrito, backend valida ids.

Risco: acao indevida.
Mitigacao: propostas confirmaveis e revalidacao no apply.

Risco: vazamento entre workspaces.
Mitigacao: contexto montado no backend, queries sempre por workspace_id, vector stores filtrados.

Risco: custo alto.
Mitigacao: snapshots compactos, limites por workspace, resumo de conversa, Compaction da OpenAI, prompt caching quando fizer sentido.

Risco: tratar compaction opaca como auditoria.
Mitigacao: manter snapshots locais e resumos proprios legiveis; usar compaction apenas para continuidade de runtime.

Risco: GitHub rate limit.
Mitigacao: cache local, webhooks, sync incremental, backoff.

Risco: blocos antigos apontarem para entidade removida.
Mitigacao: snapshot historico + live lookup opcional + estado "indisponivel".

## 20. Definition of Done do MVP

MVP pronto quando:

- Workspace e Kanban usam backend real de IA.
- Streaming funciona.
- Conversas e mensagens persistem.
- Markdown seguro renderiza.
- Pelo menos tres blocos interativos existem: plano, cartao, proposta.
- IA consegue ler contexto basico do workspace/plano via `context.search` e `entity.get`.
- IA consegue propor criacao de cartoes via `action.propose`.
- Usuario aprova e o backend cria cartoes reais.
- Conversa mostra cartoes criados como referencias clicaveis.
- Model-facing tools e capabilities internas podem ser desabilitadas por configuracao.
- Auditoria registra tool calls e acoes aplicadas.
- Testes cobrem permissao, proposta, apply e renderizacao.

## 21. Fontes oficiais consultadas

OpenAI:

- Function Calling: https://developers.openai.com/api/docs/guides/function-calling
- File Search: https://developers.openai.com/api/docs/guides/tools-file-search
- Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- Conversation State: https://developers.openai.com/api/docs/guides/conversation-state
- Streaming Responses: https://developers.openai.com/api/docs/guides/streaming-responses
- GPT-5.4 mini: https://developers.openai.com/api/docs/models/gpt-5.4-mini
- Compaction: https://developers.openai.com/api/docs/guides/compaction
- Production Best Practices: https://developers.openai.com/api/docs/guides/production-best-practices
- Prompt Engineering: https://developers.openai.com/api/docs/guides/prompt-engineering

GitHub:

- REST API commits: https://docs.github.com/en/rest/commits/commits
- REST API pull requests: https://docs.github.com/en/rest/pulls/pulls
- GitHub Apps REST API: https://docs.github.com/en/rest/apps/apps
- GitHub Apps vs OAuth Apps: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps
- GitHub App permissions: https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app
- Webhook payloads: https://docs.github.com/en/webhooks/webhook-events-and-payloads
- Webhook signature validation: https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
- REST API rate limits: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
