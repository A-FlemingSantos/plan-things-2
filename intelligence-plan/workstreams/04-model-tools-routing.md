# Workstream 04: Model Tools And Routing

This file is self-contained for this workstream. Do not read other planning files unless the user explicitly asks.

## Goal

Implement a small, robust model-facing tool palette backed by granular internal capabilities.

## Core Decision

Use two levels:

```txt
AiCapabilityRegistry = internal granular operations.
AiModelToolRegistry = small set of tools exposed to the model.
```

Do not expose many specific tools directly to `gpt-5.4-mini`. The model should see a small dynamic palette.

## Model-Facing Tools

MVP tools:

```txt
context.search
entity.get
action.propose
file.search
github.search
```

Dynamic exposure:

- Workspace general: `context.search`, `entity.get`, `action.propose`.
- Kanban with files: add `file.search`.
- Kanban with GitHub connected: add `github.search`.
- If a provider is disconnected or disabled, do not send its tool.

Target: no more than 5 model-facing tools per request in MVP.

## Internal Capabilities

Initial internal capabilities:

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

Apply capabilities are internal only:

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

The model can propose changes but cannot apply them.

Flow:

```txt
model calls action.propose
backend validates schema and permissions
backend creates pending ai_action_proposals row
frontend renders ActionProposalBlock
user approves/rejects/edits
frontend calls apply endpoint
backend revalidates and applies through existing services
conversation receives real entity reference blocks
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

## Strict Schemas

All model-facing tools should use JSON Schema with `strict: true`.

Rules:

- `additionalProperties: false` for objects;
- all declared properties are required;
- optional values use `type: ["string", "null"]` or equivalent;
- generic payloads must still use closed fields;
- backend performs stricter per-action validation after the model call.

## Routers And Handlers

Suggested classes:

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

## Out Of Scope

- Applying proposals directly from model output.
- Exposing granular write tools to the model.
- GitHub write operations.

## Definition Of Done

- Model-facing tools are built dynamically per conversation.
- Disabled or unauthorized tools are not sent to OpenAI.
- `context.search` and `entity.get` route to internal read capabilities.
- `action.propose` creates pending proposals only.
- Apply endpoint is frontend/user driven, not model driven.
- Tool calls record routed capabilities for audit.

