# Workstream 01: Product Experience

This file is self-contained for this workstream. Do not read other planning files unless the user explicitly asks.

## Goal

Define the product behavior for Plan Things Intelligence: an operational assistant for workspaces and Kanban plans, not just a text chatbot.

The assistant should:

- answer conversationally;
- inspect relevant workspace/plan context;
- propose actions;
- wait for user approval before changing data;
- return real clickable objects after approved actions execute.

## Core Interaction Model

Expected flow:

1. User asks for help.
2. Assistant searches context or asks clarifying questions.
3. Assistant proposes an action when data would change.
4. User approves, edits, or rejects the proposal.
5. Backend applies approved actions.
6. Conversation receives entity reference blocks for created/updated objects.
7. User clicks those objects to open the real plan, card, file, Inbox item, or external GitHub object.

## Object Categories

The assistant experience must support these object categories:

- workspace;
- plan;
- board column;
- card;
- member;
- invite;
- file;
- Inbox item;
- GitHub commit;
- GitHub pull request;
- action proposal;
- question/answer prompt.

## UX Principles

- A proposal is not an applied change.
- A real entity reference must feel clickable and persistent.
- A conversation is an operational timeline, not a plain transcript.
- The assistant should not claim that data was changed before the backend confirms it.
- After approval, the conversation should show actual created/updated entities.
- If a referenced entity was deleted later, the block should remain in history and show an unavailable state.

## Required States

The mock and implementation must represent:

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

## Primary User Flows

### Create a Plan

1. User asks to create a plan.
2. Assistant proposes plan metadata and initial cards.
3. User approves.
4. Backend creates the plan.
5. Conversation renders a `PlanReferenceBlock`.
6. Clicking the block opens the plan.

### Create Cards from Context

1. User asks to break work into tasks.
2. Assistant calls context search.
3. Assistant proposes card batch creation.
4. User approves.
5. Backend creates cards.
6. Conversation renders clickable card references.

### Attach GitHub Commits

1. User asks for recent commits related to a topic.
2. Assistant searches GitHub.
3. Assistant proposes attaching commits to a card or creating cards from commits.
4. User approves.
5. Backend creates links inside Plan Things.
6. Conversation renders GitHub commit references and card references.

## Out Of Scope

- Autonomous data mutation without user approval.
- Direct model access from frontend.
- Writing to GitHub in the MVP.
- Treating markdown as the container for real app objects.

## Definition Of Done

- Product flows distinguish narrative, proposal, and real entity reference.
- Approval/rejection/editing behavior is specified for proposals.
- Click behavior is specified for plans, cards, files, Inbox, commits, and PRs.
- Error/unavailable states are specified.
- MVP scope is clear enough for frontend and backend implementation.

