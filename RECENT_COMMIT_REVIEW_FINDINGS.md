# Recent Commit Review Findings

Branch reviewed: `codex/web-app-features`

## Summary

Recent changes in this branch touched authentication, session refresh, Gmail OAuth return flow, settings UI, and the workspace identity contract. The highest-risk issues found are:

1. Web session bootstrap now logs the user out on any refresh failure, including transient network errors.
2. The backend session/workspace contract moved from `avatarUrl` to `iconKey`, but at least one mobile consumer still reads `session.workspace.avatarUrl`.
3. The account deletion dialog in the web settings page is duplicated in two render branches, increasing maintenance cost and divergence risk.

## Findings

### 1. Web bootstrap clears the session on any refresh error

Severity: High

Files:

- `apps/web/src/features/auth/context/AuthContext.jsx`
- `apps/web/src/features/auth/context/AuthContext.test.jsx`

What changed:

- The bootstrap flow now calls `POST /api/auth/refresh` instead of hydrating from `GET /api/me`.
- In the bootstrap `catch`, the implementation immediately calls `saveSession(null)`.

Why this is risky:

- A temporary network failure during page load now behaves like an authentication failure.
- Users can be logged out even when their session is still valid.
- This is stricter than the periodic refresh flow in the same file, which only clears the session for `401/403` or an actually expired token and otherwise retries later.

Evidence:

- `apps/web/src/features/auth/context/AuthContext.jsx:150`
- `apps/web/src/features/auth/context/AuthContext.jsx:162`
- `apps/web/src/features/auth/context/AuthContext.jsx:213`
- `apps/web/src/features/auth/context/AuthContext.jsx:227`

Test coverage gap:

- The added tests cover the happy path for bootstrap refresh and scheduled token renewal.
- There is no coverage for transient refresh failures during bootstrap.

Evidence:

- `apps/web/src/features/auth/context/AuthContext.test.jsx:54`
- `apps/web/src/features/auth/context/AuthContext.test.jsx:94`

Recommended follow-up:

- Align bootstrap behavior with the periodic refresh path.
- Only clear the session on confirmed auth failure or expired token.
- Add a test for network or `5xx` failure during bootstrap.

### 2. Workspace contract changed, but mobile still reads the removed field

Severity: Medium

Files:

- `services/api/src/main/java/com/planthings/api/auth/AuthService.java`
- `services/api/src/main/java/com/planthings/api/workspace/WorkspaceService.java`
- `apps/mobile/src/screens/SettingsScreen.js`

What changed:

- Backend workspace/session payloads now expose `iconKey`.
- The old workspace-level `avatarUrl` is no longer returned in the updated auth/workspace summaries.

Why this is risky:

- The mobile settings screen still renders `session.workspace.avatarUrl`.
- The mobile UI will likely fall back to initials instead of showing the actual selected workspace icon.
- This is a silent behavior regression rather than an obvious crash, which makes it easier to miss.

Evidence:

- `services/api/src/main/java/com/planthings/api/auth/AuthService.java:235`
- `services/api/src/main/java/com/planthings/api/auth/AuthService.java:416`
- `services/api/src/main/java/com/planthings/api/workspace/WorkspaceService.java:57`
- `services/api/src/main/java/com/planthings/api/workspace/WorkspaceService.java:126`
- `apps/mobile/src/screens/SettingsScreen.js:528`
- `apps/mobile/src/screens/SettingsScreen.js:531`

Recommended follow-up:

- Update mobile consumers to use `iconKey`.
- Introduce a shared mobile workspace icon renderer equivalent to the web `WorkspaceIconGlyph`.
- Add a regression test or snapshot around workspace identity rendering in mobile settings.

### 3. Account deletion dialog is duplicated in the web settings page

Severity: Medium

File:

- `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx`

What changed:

- The account deletion dialog markup and logic appear twice: once in the modal branch and once in the non-modal branch.

Why this is risky:

- Future fixes must be applied in two places.
- Accessibility, validation, copy, and behavior can drift between the two blocks.
- The size of the file is already very large, so duplication increases review and maintenance cost.

Evidence:

- `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx:2365`
- `apps/web/src/features/settings/pages/SettingsPage/SettingsPage.jsx:2477`

Recommended follow-up:

- Extract the delete-account dialog into a shared component or render helper.
- Keep a single source of truth for validation, copy, and button disabled logic.

## Recommended Order

1. Fix the auth bootstrap logout regression first.
2. Update mobile workspace icon consumption next to restore contract compatibility.
3. Refactor the duplicated settings dialog after behavior is stable.

## Notes

- GitNexus review for the branch showed broad impact because auth/session and settings flows were touched together.
- Local web tests were not runnable in the review environment because `vitest` was not available on PATH in that worktree at the time of review.
