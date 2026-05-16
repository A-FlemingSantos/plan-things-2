# Handoff: Web Multi-Account Auth and Sidebar Switching

## Context

- Commit under review: `c1423be` (`Add multi-account switching to web auth`)
- Scope: web app only
- Intentionally not changed: mobile auth provider, backend auth contracts, API payloads
- Unrelated local changes still present in worktree and not part of the commit:
  - `AGENTS.md`
  - `CLAUDE.md`

## Goal Delivered

This implementation turns `Adicionar conta` into real multi-account support in the web app:

- multiple accounts can be saved locally
- the newly added account becomes active immediately
- saved accounts can be switched from a secondary submenu in the sidebar avatar menu
- `Sair` still clears all saved accounts
- after switching accounts, the app now redirects to the target user’s home route, not the previous account’s active page

## Main Architectural Change

### 1. Session storage model moved from single session to versioned store

Primary file:

- [AuthContext.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/features/auth/context/AuthContext.jsx:6)

Old behavior:

- `plan-things.session` stored one session object

New behavior:

- `plan-things.session` stores a versioned account container:
  - `version`
  - `activeAccountId`
  - `accounts`

Important implementation points:

- legacy single-session payloads are still readable and normalized into the new format at load time
- persistence is centralized through account-store helpers
- only the active account drives the refresh timer
- `patchSession(...)` updates both the in-memory active session and the corresponding saved account entry

Relevant anchors:

- store constants and helpers: [AuthContext.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/features/auth/context/AuthContext.jsx:6)
- legacy + versioned store read path: [AuthContext.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/features/auth/context/AuthContext.jsx:160)
- `switchAccount(...)`: [AuthContext.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/features/auth/context/AuthContext.jsx:472)
- public context value shape: [AuthContext.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/features/auth/context/AuthContext.jsx:649)

### 2. Auth API expanded on the web provider

The web `useAuth()` context now exposes:

- `savedAccounts`
- `activeAccountId`
- `switchAccount(accountId)`
- `login(credentials, options?)`
- `register(payload, options?)`
- `startOAuthLogin(provider, options?)`
- `completeOAuthLogin(code, options?)`

Supported auth modes:

- `default`
- `add-account`

Mode semantics:

- `default`: replace store with one authenticated account
- `add-account`: upsert authenticated account into saved store and activate it

## Add-Account Flow

### 1. Form login/register

Primary file:

- [Auth.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/features/auth/pages/Auth/Auth.jsx:97)

Behavior:

- `authMode` is read from `location.state.authMode`
- in add-account mode, submit calls `login/register(..., { mode: 'add-account' })`
- copy changes from normal auth wording to “Adicionar conta” / “Entre com outra conta” / “Crie outra conta”

Important lines:

- auth mode read: [Auth.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/features/auth/pages/Auth/Auth.jsx:97)
- add-account submit wiring: [Auth.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/features/auth/pages/Auth/Auth.jsx:100)
- add-account copy: [Auth.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/features/auth/pages/Auth/Auth.jsx:171)

### 2. OAuth add-account intent persistence

New file:

- [authIntent.js](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/features/auth/utils/authIntent.js:1)

Why it exists:

- `location.state` is lost during external OAuth round-trips

Behavior:

- before starting OAuth in add-account mode, the app writes an intent object to `sessionStorage`
- callback reads this object, recovers `mode` and `redirectTo`, then clears it

### 3. OAuth callback merge behavior

Primary file:

- [OAuthCallback.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/features/auth/pages/OAuthCallback/OAuthCallback.jsx:25)

Behavior:

- reads callback params
- reads persisted auth intent
- calls `completeOAuthLogin(code, { mode: 'add-account' })` when appropriate
- navigates to recovered redirect target or fallback initial route
- always clears stored auth intent in `finally`

## Sidebar UX Change

Primary files:

- [SidebarAccountMenu.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx:259)
- [SidebarAccountMenu.module.css](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/shared/components/SidebarAccountMenu/SidebarAccountMenu.module.css:106)

Behavior:

- the main avatar menu still contains:
  - `Meu perfil`
  - `Upgrade`
  - `Configurações`
  - `Sair`
- `Adicionar conta` was moved into a secondary submenu
- the submenu opens from the active-account header area
- it lists saved accounts as `menuitemradio`
- selecting an account calls `switchAccount(...)`
- after success, the menu closes and the app navigates to the target account’s home route

Implementation notes:

- submenu opens on hover and also supports click fallback
- submenu shows active badge
- submenu shows inline error text when switching fails
- switching disables account actions temporarily via `switchingAccountId`

Relevant anchors:

- submenu trigger and account list: [SidebarAccountMenu.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx:310)
- switch handler: [SidebarAccountMenu.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx:259)

## Redirect Behavior After Account Switch

This was adjusted after the initial implementation.

Expected behavior now:

- switching accounts must not keep the current page from the previous user
- it must always go to the switched user’s initial route

Current implementation:

- [SidebarAccountMenu.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx:229)

Important nuance:

- this redirect intentionally ignores `lastContext`
- it uses `readStoredLocalPreferences(accountId)` plus `resolveInitialRouteForState(..., lastContext: null)`
- that means the redirect respects the target user’s preferred home page (`workspace`, `calendar`, `files`) but not their last visited screen

This was necessary because using `resolveInitialRoute(accountId)` would often pick up `/files` or another previous route and preserve the wrong context during account switch.

## Test Coverage Added/Expanded

### Auth context

- [AuthContext.test.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/features/auth/context/AuthContext.test.jsx:1)

Coverage includes:

- legacy store migration into versioned store
- bootstrap refresh persistence
- transient bootstrap refresh failure
- token renewal for active account
- add-account login merge
- add-account OAuth merge
- dedupe on re-adding same account
- successful account switching
- invalid/expired switched account removal
- global logout clearing all accounts

### Auth UI / OAuth

- [oauthStart.test.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/features/auth/pages/Auth/oauthStart.test.jsx:1)
- [oauthFlow.test.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/features/auth/pages/Auth/oauthFlow.test.jsx:1)

Coverage includes:

- OAuth start with `mode: 'default'`
- OAuth start with `mode: 'add-account'`
- email login in add-account mode
- register in add-account mode
- OAuth callback storing one account in versioned format
- OAuth callback merging a second account through persisted intent

### Sidebar menu / smoke

- [SidebarAccountMenu.test.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/shared/components/SidebarAccountMenu/SidebarAccountMenu.test.jsx:1)
- [app.smoke.test.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/test/app.smoke.test.jsx:344)

Coverage includes:

- submenu opening
- hover and click fallback behavior
- switching accounts from submenu
- opening add-account flow from submenu
- redirect after switch

### Test utility updates

- [renderApp.jsx](C:/Users/Arthur%20Fleming/plan-things-2/apps/web/src/test/renderApp.jsx:8)

Important test utility changes:

- added `createAccountStore(...)`
- added read helpers for stored session
- demo sessions now derive deterministic IDs and tokens from email

This deterministic demo behavior is important for multi-account tests because otherwise two demo logins would collapse onto the same fake user identity.

## Review Checklist for Second Agent

- Confirm legacy session migration is safe and cannot produce malformed active-account states
- Confirm `switchAccount(...)` handles all token failure modes correctly and never accidentally clears unrelated saved accounts
- Confirm there is no hidden dependency elsewhere in the web app that still assumes `plan-things.session` is a plain session object
- Confirm the sidebar submenu interaction is stable enough for keyboard, touch, and hover scenarios
- Confirm redirect-after-switch behavior is correct for all target users with different `homePage` preferences
- Confirm no unintended mobile coupling was introduced

## Known Constraints / Intentional Decisions

- No backend changes
- No mobile changes
- No remove-account UI
- No per-account logout
- `Sair` still clears all saved accounts
- Redirect after switch uses home preference only, not last context

## Validation Performed

Executed successfully before handoff:

- `npm --workspace apps/web run test:run -- src/features/auth/context/AuthContext.test.jsx src/features/auth/pages/Auth/oauthStart.test.jsx src/features/auth/pages/Auth/oauthFlow.test.jsx src/shared/components/SidebarAccountMenu/SidebarAccountMenu.test.jsx`
- `npm --workspace apps/web run test:run -- src/shared/components/SidebarAccountMenu/SidebarAccountMenu.test.jsx src/test/app.smoke.test.jsx`
- `npm --workspace apps/web run test:run`

Latest full-suite result at implementation time:

- `38` test files passed
- `165` tests passed

## Suggested Next Steps for Reviewer

1. Review `AuthContext.jsx` first, especially storage helpers and `switchAccount(...)`.
2. Review `Auth.jsx` + `OAuthCallback.jsx` together to validate add-account flow integrity.
3. Review `SidebarAccountMenu.jsx` for interaction complexity and redirect behavior.
4. Run the app manually and test:
   - add second account by email
   - add second account by OAuth
   - switch from files/calendar/workspace and verify redirect always lands on target user home
   - switch to an expired saved account if a realistic repro is available
