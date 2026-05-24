# Workstream 09: Security, Permissions, And Audit

This file is self-contained for this workstream. Do not read other planning files unless the user explicitly asks.

## Goal

Ensure Intelligence can only see and do what the current user is allowed to see and do.

## Permission Layers

Every model-facing tool/capability must pass:

```txt
1. User permission in Plan Things.
2. Workspace/user AI tool setting.
3. Provider permission if external integration is involved.
4. Entity-level access validation.
```

Do not send unauthorized tools to OpenAI.

## Tool Settings

Workspace sets defaults. User can restrict further. User cannot enable a tool blocked by workspace.

Distinguish:

```txt
model-facing tool setting
internal capability setting
proposal permission
apply permission
```

Write/apply capability should be separately governable from propose capability.

## Confirmation Rules

Require explicit user confirmation for anything that:

- creates data;
- edits data;
- removes data;
- invites people;
- assigns people;
- sends email;
- attaches files;
- links external entities;
- changes workspace/plan/member state.

The model must not apply changes directly in the MVP.

## Audit Events

Audit should record:

- requesting user;
- workspace;
- conversation/message;
- model-facing tools enabled;
- tool called;
- routed capabilities;
- proposal id;
- approved by;
- entities affected;
- provider calls;
- result/failure;
- timestamps.

## Secrets

- OpenAI keys remain backend-only.
- GitHub private key/webhook secret remain backend-only.
- Do not log provider tokens.
- Do not return OpenAI or GitHub secret identifiers to frontend.

## Multi-Tenant Safety

- Always filter by `workspace_id`.
- Validate plan/card/file/member ids belong to the workspace.
- Revalidate permission when applying a proposal, not only when creating it.
- File Search vector stores must be selected only after permission filtering.
- GitHub repositories must be workspace-enabled and installation-authorized.

## Risk Controls

```txt
Model invents object -> validate ids and use context/entity tools.
Unauthorized action -> do not expose tool; revalidate on apply.
Data leak -> build context server-side and filter by workspace.
Prompt injection from files/GitHub -> treat external content as untrusted context.
Stale proposal -> expire proposals and revalidate entity state on apply.
```

## Definition Of Done

- Tool availability is permission-filtered.
- Proposal application revalidates all access.
- Audit events are written for tool calls and applied actions.
- External provider secrets are not exposed.
- Tests cover unauthorized context and unauthorized apply.

