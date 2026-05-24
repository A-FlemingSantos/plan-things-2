# Workstream 02: Frontend UI Contract

This file is self-contained for this workstream. Do not read other planning files unless the user explicitly asks.

## Goal

Remodel the incomplete Intelligence UI in the web app into a visual and interactive contract that the real backend integration can later feed.

Current relevant files:

```txt
apps/web/src/features/workspace/pages/Workspace/Workspace.jsx
apps/web/src/features/workspace/pages/Workspace/Workspace.module.css
apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.jsx
apps/web/src/features/workspace/pages/KanbanBoard/KanbanBoard.module.css
```

Future shared feature area:

```txt
apps/web/src/features/intelligence
```

## Architectural Decision

Markdown is only one block type. Real objects and proposals must be structured blocks outside markdown.

```txt
MarkdownBlock = narrative text, lists, tables, code, links, citations, diagrams.
EntityReferenceBlock = real clickable app/external objects.
ActionProposalBlock = user-approvable proposals.
ToolRunStatusBlock = tool execution state.
```

Do not embed plans, cards, files, members, Inbox items, commits, or proposals as custom markdown.

## Components

Recommended structure:

```txt
apps/web/src/features/intelligence/api/intelligenceApi.js
apps/web/src/features/intelligence/hooks/useAiConversation.js
apps/web/src/features/intelligence/hooks/useAiStream.js
apps/web/src/features/intelligence/components/AiComposer.jsx
apps/web/src/features/intelligence/components/AiConversation.jsx
apps/web/src/features/intelligence/components/AiBlockRenderer.jsx
apps/web/src/features/intelligence/components/blocks/MarkdownBlock.jsx
apps/web/src/features/intelligence/components/blocks/PlanReferenceBlock.jsx
apps/web/src/features/intelligence/components/blocks/CardReferenceBlock.jsx
apps/web/src/features/intelligence/components/blocks/FileReferenceBlock.jsx
apps/web/src/features/intelligence/components/blocks/MemberReferenceBlock.jsx
apps/web/src/features/intelligence/components/blocks/InboxReferenceBlock.jsx
apps/web/src/features/intelligence/components/blocks/GitHubCommitBlock.jsx
apps/web/src/features/intelligence/components/blocks/GitHubPullRequestBlock.jsx
apps/web/src/features/intelligence/components/blocks/ActionProposalBlock.jsx
apps/web/src/features/intelligence/components/blocks/QuestionBlock.jsx
apps/web/src/features/intelligence/components/blocks/ToolRunStatusBlock.jsx
```

## Mock Data Contract

Use fake data shaped like real backend blocks:

```js
{
  id: 'block-1',
  type: 'plan_reference',
  title: 'Landing Page Launch',
  href: '/plans/plan-1',
  entityType: 'plan',
  entityId: 'plan-1',
  snapshot: {
    cardCount: 12,
    memberCount: 4,
    updatedAt: '2026-05-24T10:00:00Z'
  }
}
```

Proposal blocks should include:

```js
{
  id: 'proposal-1',
  type: 'action_proposal',
  status: 'pending',
  actionType: 'CARD_BATCH_CREATE',
  title: 'Create 5 cards',
  preview: {},
  actions: ['apply', 'edit', 'reject']
}
```

## Markdown Rendering

Use a safe markdown renderer for narrative blocks. Open WebUI is a useful reference pattern: markdown is parsed/tokenized and rendered through controlled components rather than dumped as raw HTML.

Implementation requirements:

- sanitize user/model markdown output;
- support GFM tables/lists/code blocks;
- avoid expensive full markdown reparse on every streaming chunk;
- throttle/debounce markdown parsing during streaming;
- render structured blocks separately from markdown.

## Composer Requirements

Composer should support:

- typed prompt;
- attached context chips;
- enabled integration/tool indicators;
- voice button;
- send button;
- stop generation;
- disabled/loading states;
- insert context menu for files, Kanban items, Inbox, and plugins.

## Navigation Requirements

- Plan block opens the plan.
- Card block opens plan and selected card/modal.
- File block opens preview/download route.
- Inbox block opens Inbox panel with item selected.
- GitHub commit/PR opens external link or details block.

If current routes do not support direct card opening, add a route or query param pattern.

## Out Of Scope

- Real OpenAI call implementation.
- Backend persistence.
- GitHub OAuth.
- File indexing.

## Definition Of Done

- Workspace and Kanban use the same conceptual block renderer.
- Mock UI covers all required states.
- Fake blocks can be swapped for backend blocks without redesign.
- Markdown and structured object rendering are visually distinct.
- Proposal blocks clearly show pending/applied/rejected/failed states.

