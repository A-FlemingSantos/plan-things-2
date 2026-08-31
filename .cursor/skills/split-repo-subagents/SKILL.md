---
name: split-repo-subagents
description: Orchestrate architecture review of plan-things-2 with subagents. Use when you must assign scopes and merge results.
disable-model-invocation: true
---

# Split this repo with subagents

Walk the **whole tree** (every layer of folders) and only record structure — names, sizes, how parts sit next to each other. Do not review code, debt, or behavior.

Launch a **subagent** only when you have a slice that fits one product (and a smaller context window than yours). That subagent **reviews** the slice. It does not exist to list what it skipped.

Do not rewrite architecture; suggest small, local changes. Do not freeze today’s feature list. **List the folders that exist**. New features are split the same way.

You launch every subagent. Do not tell a subagent to spawn others. A subagent of a subagent cannot spawn further children.

## Attention

**You:** all layers, structure only. Open enough of the tree to split; do not investigate.

**Subagent:** review the assigned slice in full. Budget: about 8–20 implementation files, or one clear product — whatever fits the subagent’s window. If you still see a hub, split **before** launch.

Never give two subagents the same folder. Do not mix web and API, or web and mobile, in one prompt.

## You

Walk `apps/web`, `apps/mobile`, `services/api`, and `shared`. Descend into `features/*` and API packages until each remaining piece is a slice. Do not open feature internals for review.

| Path | Role |
|------|------|
| `apps/web` | Web app |
| `apps/mobile` | Native client (separate code) |
| `services/api` | Java packages under `com.planthings.api` |
| `apps/web/src/shared` | Shell, API client, adapters |
| `apps/web/src/features/*` | Product features (whatever directories exist) |

A directory is **one subagent** when it is already one product. If it holds several products (multiple large pages/components), keep descending and do **not** launch on the outer folder.

Git history is a hint, not a verdict. On `main` (not WIP), repeated **fix** commits on the same path suggest fragility. Feature work and the current phase do not. Use this while splitting; still do not review.

## Orchestrate

1. Walk the tree. Skip missing paths. Stop descending a branch when it is one product that fits a subagent.
2. Queue those slices. Launch in **batches** up to the runtime parallel limit; when a batch finishes, launch the rest. Do not drop leftover directories.
3. Each prompt: allowed paths, forbidden paths, return format. Tell the subagent to review, not to spawn children.
4. Merge maps and changes. If a subagent reports a child that still did not fit, split that path and launch another **reviewer**. Do not treat unread-folder lists as the subagent’s job.
5. Pass 3 only if a slice is still large. Then merge the system table.

## Pass 1 — one scope each

Launch only slices you already judged as one product.

**Web:** one subagent per `features/*` directory that is not a hub, plus `shared` if in scope.

**Hub:** you already looked inside (structure only). Do not launch “the whole feature.” Pass 1 may be only the shell (home, list, context); inner products wait for pass 2. Typical shape: `workspace` home vs board/modal/dnd.

**API:** one subagent per package that fits; not the whole `services/api` tree.

**Mobile:** its own pass, never with web.

## Pass 2 — punctual slices

You create these from the tree (or from a child that still did not fit). One subagent per **product inside** a hub. Each one reviews.

Split on clusters that have one job, for example:

- one UI component directory
- one hook/util cluster (e.g. drag-and-drop)
- one state module
- the orchestrating page, without components already given to others
- side panels vs the main canvas
- CSS only for the UI that owns those rules (never one agent for an entire board stylesheet)

Workspace-shaped features often split like: column UI, drag-and-drop, board state, board page, card modal, side panels, an integration modal. **Re-derive from the tree**; do not assume these names always exist.

Pass 3: one more split if an inner folder is still large. Stop at file-level scopes.

## Handoff

Your prompt: allowed paths, forbidden paths. Review this slice. Do not spawn subagents. Do not spend the turn listing unread folders as the result.

Subagent return:

1. Table: **path | approx. size | role | note**. Max 5–12 rows; group small files.
2. **Changes** — each row points at a table path: what, why (debt, inconsistency, fragility, extra abstraction), size (small/medium), and what not to do.
3. **Did not fit** (optional) — a child that is still another product; you will assign a reviewer.

You merge: one system table + ranked local changes, each with a path owner.
