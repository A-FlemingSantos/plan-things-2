# Frente 08: Schema de banco de dados

## Missao do agente

Implemente as migrations e estruturas de persistencia do Intelligence. O banco local deve ser a fonte de verdade para UI, auditoria, propostas, snapshots, tool calls e historico.

OpenAI, File Search e GitHub sao provedores/runtime. Nao dependa deles para renderizar historico ou provar o que foi aplicado.

## Entidades principais

Crie tabelas para:

```txt
ai_conversations
ai_messages
ai_message_blocks
ai_action_proposals
ai_tool_calls
ai_context_snapshots
ai_compaction_items
ai_memories
ai_tool_settings
ai_integration_settings
ai_audit_events
ai_file_index
github_installations
github_repositories
github_webhook_events
external_entity_links
```

Se a entrega for incremental, priorize conversas, mensagens, blocos, propostas, tool calls, snapshots e auditoria.

## Conversas e mensagens

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

## Blocos

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

`ai_message_blocks` e o contrato da UI rica. Nao dependa de markdown para recuperar objetos.

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

Enquanto `ai_action_proposals.status` estiver pendente, nenhuma entidade real deve ser considerada alterada.

## Contexto, compaction e memoria

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

Snapshot e auditavel. Compaction e runtime opaco. Nao misture os papeis.

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

## Regras de migration

- Use Flyway conforme padrao do servico API.
- Adicione indices para workspace, conversa, mensagem, status e entity references.
- Use `nvarchar(max)` para JSON, salvo convencao existente diferente.
- Evite mudancas destrutivas em tabelas existentes.
- Defina enums/status no codigo mesmo que o banco use varchar.
- Planeje retencao para payloads sensiveis.

## Limites desta frente

- Nao implemente logica OpenAI.
- Nao implemente UI.
- Nao implemente handlers de tools.
- Nao crie schema que exija reexecutar modelo para renderizar historico.

## Aceite

- Migrations criam tabelas principais.
- Constraints/indices suportam leituras comuns.
- Propostas e blocos podem ser relacionados.
- Snapshots e compaction coexistem sem confusao de papel.
- Audit events rastreiam tool calls e acoes aplicadas.
