# Workstream 06: File Search

This file is self-contained for this workstream. Do not read other planning files unless the user explicitly asks.

## Goal

Enable Intelligence to search file metadata and file content while respecting Plan Things permissions.

## Two-Layer Search

Use two layers:

```txt
Local metadata search = file name, type, owner, relationships, permissions.
OpenAI File Search = semantic/content search through vector stores.
```

File Search must not replace local access control.

## Model-Facing Tool

Expose only:

```txt
file.search
```

when files are enabled and the user has access.

Internal capabilities:

```txt
file.search_metadata
file.search_content
file.get_summary
file.attach_to_card_proposal
file.apply_attach_to_card
```

`file.apply_attach_to_card` is internal only and runs after user approval.

## Vector Store Strategy

Recommended:

- workspace vector store for shared searchable files;
- conversation vector store for temporary uploaded chat context;
- optional plan-level vector store later if isolation/performance needs it.

Before a vector store or file is included in a model request, backend must filter by workspace, plan, file permissions, and user access.

## Table

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

## Indexing Events

When a file is created, updated, deleted, attached, detached, or permission changes:

1. update local metadata;
2. enqueue indexing/removal;
3. update OpenAI file/vector store if needed;
4. record failure and retry state.

## Result Blocks

File results should become:

```txt
FileReferenceBlock
```

with:

- file id;
- title/name;
- mime type;
- size;
- owner/shared state;
- href;
- optional citation/source metadata.

## Security

- Never search files outside authorized workspace scope.
- Never trust file ids from model without validating access.
- Do not expose raw OpenAI file ids to frontend unless needed.
- Avoid indexing unsupported or sensitive files until policy exists.

## Definition Of Done

- `file.search` routes to local metadata and content capabilities.
- File indexing table exists.
- Search respects permissions.
- File results render as structured blocks, not markdown links only.
- Attach-file proposals require user approval.

