# Frente 08: Schema de banco de dados

Este arquivo e autossuficiente para esta frente de trabalho. Nao leia outros documentos de planejamento, a menos que o usuario peca explicitamente.

## Objetivo

Adicionar persistencia para conversas, mensagens, blocos, propostas, tool calls, snapshots, metadados de compaction, memoria e links de integracoes do Intelligence.

A intencao desta frente e dar ao produto uma fonte local de verdade. OpenAI, File Search e GitHub sao runtimes/provedores; a UI, auditoria, permissoes, propostas e historico precisam sobreviver no banco do Plan Things.

O schema deve permitir tres coisas ao mesmo tempo:

- renderizar conversas antigas sem reexecutar o modelo;
- provar o que foi proposto, aprovado e aplicado;
- rastrear qual contexto/tools foram usados em cada resposta.

## Tabelas principais

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

`ai_messages.content_text` guarda narrativa quando existir, mas `ai_message_blocks` e o contrato principal da UI rica. Um assistant turn pode ter markdown, proposta, tool status e entity references na mesma mensagem.

## Propostas e tool calls

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

`ai_action_proposals` representa uma intencao ainda nao aplicada. Enquanto status estiver pendente, nenhuma entidade real deve ser considerada alterada. O apply precisa preencher `approved_by_user_id`, `approved_at`, `applied_at`, `result_json` e referencias de entidade quando houver.

`ai_tool_calls` deve registrar a tool que o modelo viu e as capabilities internas roteadas. Isso e necessario porque o modelo chama `action.propose`, mas o backend pode executar `board.card.batch_create_proposal` internamente.

## Contexto e memoria

```txt
ai_context_snapshots
- id uuid pk
- conversation_id uuid not null
- message_id uuid not null
- workspace_id uuid not null
- plan_id uuid nullable
- context_json nvarchar(max) not null
- token_estimate int nullable
- created_at datetimeoffset

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

ai_memories
- id uuid pk
- workspace_id uuid not null
- user_id uuid nullable
- scope varchar not null
- content nvarchar(max) not null
- source_message_id uuid nullable
- status varchar not null
- confidence decimal nullable
- created_at datetimeoffset
- updated_at datetimeoffset
```

`ai_context_snapshots` e auditavel e legivel pelo time. `ai_compaction_items` guarda apenas metadados ou payload opaco de runtime, conforme politica de retencao. Uma coisa nao substitui a outra.

## Configuracoes e auditoria

```txt
ai_tool_settings
- id uuid pk
- workspace_id uuid not null
- user_id uuid nullable
- tool_id varchar not null
- enabled bit not null
- created_at datetimeoffset
- updated_at datetimeoffset

ai_integration_settings
- id uuid pk
- workspace_id uuid not null
- provider varchar not null
- enabled bit not null
- settings_json nvarchar(max) nullable
- created_at datetimeoffset
- updated_at datetimeoffset

ai_audit_events
- id uuid pk
- workspace_id uuid not null
- user_id uuid nullable
- conversation_id uuid nullable
- event_type varchar not null
- entity_type varchar nullable
- entity_id uuid nullable
- payload_json nvarchar(max) nullable
- created_at datetimeoffset
```

`ai_tool_settings.tool_id` pode apontar para model-facing tools ou capabilities internas, desde que o backend diferencie o tipo. Isso permite bloquear `github.search` inteiro ou apenas uma capability especifica no futuro.

## Tabelas de integracao

A frente de schema deve reservar migrations para tabelas especificas de provedores:

```txt
ai_file_index
github_installations
github_repositories
github_webhook_events
external_entity_links
```

Se a implementacao inicial nao criar todas as tabelas de provedores, pelo menos evitar escolhas que dificultem adiciona-las depois. `external_entity_links` e compartilhada por GitHub e outros conectores futuros.

## Requisitos

- Usar Flyway migrations consistentes com o servico API existente.
- Adicionar indices para workspace, conversa, mensagem, entity references e status.
- Armazenar JSON como `nvarchar(max)`, salvo se o projeto ja tiver outra convencao.
- Evitar mudancas destrutivas em tabelas existentes de board/workspace.
- Definir enums/status de forma explicita no codigo mesmo que o banco use varchar.
- Planejar retencao para payloads com dados sensiveis.

## Definition of Done

- Migrations criam tabelas principais.
- Constraints e indices suportam leituras comuns.
- Propostas e blocos de entity reference podem ser relacionados.
- Context snapshots e metadados de compaction podem coexistir.
- Audit events conseguem rastrear acoes aplicadas.
