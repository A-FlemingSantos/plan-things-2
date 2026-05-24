# Workstream 08: Database Schema

This file is self-contained for this workstream. Do not read other planning files unless the user explicitly asks.

## Goal

Add persistence for Intelligence conversations, messages, blocks, proposals, tool calls, snapshots, compaction metadata, memory, and integration links.

## Core Tables

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

## Proposals And Tool Calls

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

## Context And Memory

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

## Settings And Audit

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

## Integration Tables

See GitHub and File Search workstreams for provider-specific tables, but schema work should reserve migrations for:

```txt
ai_file_index
github_installations
github_repositories
github_webhook_events
external_entity_links
```

## Requirements

- Use Flyway migrations consistent with existing API service.
- Add indexes for workspace, conversation, message, entity references, and status.
- Store JSON as `nvarchar(max)` unless existing project has a JSON convention.
- Avoid destructive changes to existing board/workspace tables.

## Definition Of Done

- Migrations create core tables.
- Constraints and indexes support common reads.
- Proposals and entity reference blocks can be linked.
- Context snapshots and compaction metadata can coexist.
- Audit events can trace applied actions.

