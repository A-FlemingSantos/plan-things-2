---
name: split-repo-subagents
description: Orchestrate a structural architecture review of plan-things-2 with subagents. Use when you must split the tree, collect reports, wait for the user, then dispatch implementation and check joins.
disable-model-invocation: true
---

# Split this repo with subagents

Structural review only. Existing behavior must stay. Do not rewrite architecture; prefer small local changes.

You launch every subagent. Do not tell a subagent to spawn others. A subagent of a subagent cannot spawn further children.

Never give two subagents the same folder. Do not mix web and API, or web and mobile, in one prompt.

## Attention

Work is **procedural**. You deepen by step; you are not stuck on architecture the whole time.

1. **Map** — structure only (folders, sizes, how parts sit).
2. **After handoffs** — the reports. Open **cited files/spans** if you need them to agree or disagree. Not the whole slice.
3. **After implement** — joins and **contracts** (inside web, inside the API, web↔API).

**You do not** investigate a slice’s full source yourself. That is noise and it biases you. Subagents own that pass.

**Subagent:** the assigned slice in full — slice architecture, inconsistencies, dead code, extra abstraction. Do not change behavior. Implement only after you send them, and only what was **decided**.

If you still see nested products, split **before** launch. Budget per slice: about 8–20 implementation files, or one clear product.

## You

Walk `apps/web`, `apps/mobile`, `services/api`, and `shared`. Descend into `features/*` and API packages until each remaining piece is a slice. Note where slices meet (sibling UI, sibling packages, web↔API). Do not review slice internals on this pass.

| Path | Role |
|------|------|
| `apps/web` | Web app |
| `apps/mobile` | Native client (separate code) |
| `services/api` | Java packages under `com.planthings.api` |
| `apps/web/src/shared` | Shell, API client, adapters |
| `apps/web/src/features/*` | Product features (whatever directories exist) |

Mark each feature as **one subagent** or **needs a nested pass**. Nested pass: one folder holds several products. Do **not** launch on the outer folder.

## Orchestrate

Follow the steps in order. Each step is a deeper layer than the last.

1. Map architecture (structure only). Skip missing paths. Stop when a branch is one product that fits a subagent.
2. Queue slices. Launch **investigation** in **batches** up to the parallel limit; then the rest. Do not drop leftover directories.
3. Prompt: allowed paths, forbidden paths, return format. Investigate only. Do not spawn children. Do not implement. Do not change behavior.
4. Read **handoffs** — detailed. Open cited files/spans only if you need them to judge. See if reports clash at joins.
5. Report to the **user**: what you agree with, what you do not, how work will run. Ask follow-up questions if needed. **Stop until the user continues.**
6. Send each subagent to **implement the decided work** — same owners, no overlapping files, batches if needed.
7. Review again: implementation matches the decision, and **contracts** hold (inside web, inside the API, web↔API — route, adapter, response shape). Do not re-do each slice’s structural audit.

## Pass 1 — one scope each

Launch only slices you already judged as one product.

**Web:** one subagent per `features/*` directory that does not need a nested pass, plus `shared` if in scope.

**Exception — nested products:** Pass 1 may be only the shell (home, list, context). Inner products wait for pass 2. Typical shape: `workspace` home vs board/modal/dnd.

**API:** one subagent per package that fits; not the whole `services/api` tree.

**Mobile:** its own pass, never with web.

## Pass 2 — punctual slices

One subagent per **product inside** a nested feature.

Split on one-job clusters, for example: one UI directory, one hook/util cluster, one state module, side panels vs canvas, CSS only for the UI that owns those rules (never one agent for an entire board stylesheet).

Do not give a subagent the **wiring** between slices. That join is yours after implement (with contracts).

Workspace-shaped features often split like: column UI, drag-and-drop, board state, card modal, side panels, an integration modal. **Re-derive from the tree.**

Pass 3: split again if an inner folder is still large. Stop at file-level scopes.

## Handoff

**Investigate prompt:** allowed paths, forbidden paths. Structural review of this slice. Do not spawn subagents. Do not implement. Do not change existing behavior.

Subagent return (detailed):

1. Table: **path | approx. size | role | note**. Max 5–12 rows.
2. **Findings** — inconsistencies, dead code, extra abstraction; each with file + snippet (or line span) and why.
3. **Proposed work** — what it would change, still preserving behavior.

**To the user:** your read of those reports, agreed vs not, questions. Wait.

**Implement prompt:** the **decided** list only.

**After implement:** contracts and join points only — not a second full-slice review.
