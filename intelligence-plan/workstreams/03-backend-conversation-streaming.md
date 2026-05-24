# Workstream 03: Backend Conversation And Streaming

This file is self-contained for this workstream. Do not read other planning files unless the user explicitly asks.

## Goal

Create the backend foundation for Intelligence conversations, message persistence, OpenAI Responses API calls, and server-sent event streaming to the web app.

## Package

Suggested package:

```txt
services/api/src/main/java/com/planthings/api/intelligence
```

Suggested classes:

```txt
AiConversationController
AiConversationService
AiStreamingService
AiOpenAiClient
AiPromptBuilder
AiBlockFactory
AiAuditService
```

## API Endpoints

Initial endpoints:

```txt
POST /api/intelligence/conversations
GET  /api/intelligence/conversations/{conversationId}
GET  /api/intelligence/conversations/{conversationId}/messages
POST /api/intelligence/conversations/{conversationId}/messages
GET  /api/intelligence/conversations/{conversationId}/stream
```

Action endpoints belong to the tool/proposal workstream but must be compatible:

```txt
POST /api/intelligence/actions/{proposalId}/apply
POST /api/intelligence/actions/{proposalId}/reject
```

## OpenAI Runtime

Use `gpt-5.4-mini` via Responses API. Frontend must never call OpenAI directly.

Configuration:

```yaml
planthings:
  intelligence:
    enabled: true
    model: gpt-5.4-mini
    reasoning-effort: low
    max-output-tokens: 6000
    store-openai-responses: false
```

## Streaming Events

Use SSE between backend and frontend.

Event names:

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

Rules:

- Deltas are for narrative streaming.
- Structured blocks should be emitted as explicit block/proposal/entity events.
- Persist before broadcasting when possible.
- Include enough ids for the frontend to reconcile optimistic UI.

## Persistence Requirements

Persist:

- conversations;
- user messages;
- assistant messages;
- message blocks;
- OpenAI response id;
- token usage;
- errors;
- stream status.

## Error Handling

Handle:

- OpenAI timeout;
- OpenAI rate limit;
- invalid model response;
- SSE disconnect;
- user lacks permission;
- conversation not found;
- feature disabled.

Retry should not duplicate user messages or applied actions.

## Out Of Scope

- File Search indexing.
- GitHub App integration.
- Full action routing.
- Long-term memory.

## Definition Of Done

- A conversation can be created and loaded.
- User message can be posted.
- Backend calls OpenAI through server-side client.
- Assistant response streams to frontend via SSE.
- Messages and blocks persist.
- Retry/error states are represented.
- No API key reaches the browser.

