# Workstream 05: Context, Memory, And Compaction

This file is self-contained for this workstream. Do not read other planning files unless the user explicitly asks.

## Goal

Manage conversation context, local audit snapshots, long-term memory, and OpenAI Responses API Compaction without confusing their responsibilities.

## Context Types

```txt
Conversation state = messages and tool calls in the current conversation.
Working context = snapshot of workspace/plan/card at the time of a user message.
Attached context = objects explicitly attached by the user.
Long-term memory = approved stable preferences/facts.
External context = GitHub, indexed files, other connectors.
Runtime compaction = opaque OpenAI items for efficient long conversations.
```

## Local Snapshots

Every user message should create an audit snapshot:

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

Snapshot content:

- user;
- workspace;
- active plan;
- relevant board columns;
- relevant cards, not all cards when many exist;
- members;
- preferences;
- attached context;
- read capability results;
- enabled GitHub repositories when relevant.

Snapshots are for audit, debug, replay, multi-tenant control, and explainability. They are not replaced by OpenAI compaction.

## OpenAI Compaction

Use OpenAI Responses API Compaction for runtime efficiency in long conversations.

Modes:

```txt
Server-side compaction:
send context_management with compact_threshold in /responses.

Standalone compaction:
call /responses/compact with a full context window and pass the compacted output forward.
```

Example:

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

## Policy

1. Keep local snapshots as the source of audit truth.
2. Use compaction for long conversations or many tool calls.
3. Define `compact_threshold` by model, workspace plan, and environment.
4. Treat OpenAI compaction output as opaque runtime state.
5. Do not use compaction for permissions, audit, product history, or UI rendering.
6. Maintain human-readable summaries where useful for support/debug.
7. If using `previous_response_id`, do not manually prune history.
8. If using stateless input arrays, prune only items before the latest compaction item.
9. If using `/responses/compact`, pass compacted output forward as returned.

## Storage

Optional table:

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

Long-term memory table:

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

Sensitive memories or memories that change write behavior require explicit user confirmation.

## Suggested Classes

```txt
AiContextBuilder
AiContextSnapshotService
AiContextCompactionService
AiConversationSummaryService
AiMemoryService
```

## Out Of Scope

- Treating compaction output as human-readable.
- Using compaction to bypass local permission checks.
- Sending entire boards/files when a targeted context search is enough.

## Definition Of Done

- Context snapshots are persisted per user message.
- Token estimates are recorded.
- Compaction threshold policy exists.
- OpenAI compaction metadata can be stored.
- Local snapshots remain audit source of truth.
- Long-term memory requires clear status and source message.

