---
name: split-repo-subagents
description: Orchestrate architecture review of plan-things-2 with subagents. Use when you must assign scopes, dispatch work, and reconcile intersections.
disable-model-invocation: true
---

# Split this repo with subagents

First pass: walk the **whole tree** (every layer of folders) and only record structure — names, sizes, how parts sit next to each other. Do not review code, debt, or behavior yet.

Then launch **subagents** on the granular slices you found. Each slice fits one product (and a smaller context window than yours). They **investigate** first. They do not exist to list what they skipped.

Prefer small, local changes over rewrites.

You launch every subagent. Do not tell a subagent to spawn others. A subagent of a subagent cannot spawn further children.

## Attention

**You:** map the tree, split, choose what each subagent may implement, then — after they ship — only the **intersection / layer above** (how their changes meet). Do not re-review a subagent’s slice.

**Subagent:** investigate the assigned slice in full, then implement only what you send back. Budget: about 8–20 implementation files, or one clear product. If you still see nested products, split **before** launch.

Never give two subagents the same folder. Do not mix web and API, or web and mobile, in one prompt.

## You

Walk `apps/web`, `apps/mobile`, `services/api`, and `shared`. Descend into `features/*` and API packages until each remaining piece is a slice. Do not open feature internals for review on this pass.

| Path | Role |
|------|------|
| `apps/web` | Web app |
| `apps/mobile` | Native client (separate code) |
| `services/api` | Java packages under `com.planthings.api` |
| `apps/web/src/shared` | Shell, API client, adapters |
| `apps/web/src/features/*` | Product features (whatever directories exist) |

Mark each feature as **one subagent** or **needs a nested pass**. A nested pass is required when one folder holds several products (multiple large pages/components). Keep descending and do **not** launch on the outer folder.

Git history is a hint, not a verdict. On `main` (not WIP), repeated **fix** commits on the same path suggest fragility. Feature work and the current phase do not. Use this while splitting; still do not review internals.

## Orchestrate

1. Map the architecture (structure only). Skip missing paths. Stop descending a branch when it is one product that fits a subagent.
2. Queue those slices. Launch **investigation** in **batches** up to the runtime parallel limit; when a batch finishes, launch the rest. Do not drop leftover directories.
3. Each prompt: allowed paths, forbidden paths, return format. Investigate only. Do not spawn children. Do not implement yet.
4. If a subagent reports a child that still did not fit, split that path and launch another **investigator**.
5. Read each **handoff**. Decide what each subagent will implement (keep, drop, shrink). Send them back to implement — same owners, no overlapping files, batches if needed.
6. After they implement: look only at **intersections** — the layer above, how slices wire together, whether the changes still talk to each other. Make those join points coherent. Do not audit the work inside each slice.

## Pass 1 — one scope each

Launch only slices you already judged as one product.

**Web:** one subagent per `features/*` directory that does not need a nested pass, plus `shared` if in scope.

**Exception — nested products:** you already looked inside (structure only). Do not launch “the whole feature.” Pass 1 may be only the shell (home, list, context); inner products wait for pass 2. Typical shape: `workspace` home vs board/modal/dnd.

**API:** one subagent per package that fits; not the whole `services/api` tree.

**Mobile:** its own pass, never with web.

## Pass 2 — punctual slices

You create these from the tree (or from a child that still did not fit). One subagent per **product inside** a nested feature. Each one investigates, then implements if you say so.

Split on clusters that have one job, for example:

- one UI component directory
- one hook/util cluster (e.g. drag-and-drop)
- one state module
- side panels vs the main canvas
- CSS only for the UI that owns those rules (never one agent for an entire board stylesheet)

Do not give a subagent the **wiring** of the nested feature (the page or module that only joins the others). That join is yours after they implement.

Workspace-shaped features often split like: column UI, drag-and-drop, board state, card modal, side panels, an integration modal. **Re-derive from the tree**; do not assume these names always exist.

Pass 3: one more split if an inner folder is still large. Stop at file-level scopes.

## Handoff

**Investigate prompt:** allowed paths, forbidden paths. Investigate this slice. Do not spawn subagents. Do not implement. Do not spend the turn listing unread folders as the result.

Subagent investigation return:

1. Table: **path | approx. size | role | note**. Max 5–12 rows; group small files.
2. **Changes** — each row points at a table path: what, why (debt, inconsistency, fragility, extra abstraction), size (small/medium), and what not to do.
3. **Did not fit** (optional) — a child that is still another product; you will assign an investigator.

**You then:** pick which proposed changes run, and send an **implement** prompt to the same subagent (allowed files, what to do / not do).

**After implement:** you only touch intersection points so the slices stay coherent. You do not re-review the subagent’s slice.
