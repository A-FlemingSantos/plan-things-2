---
name: gitnexus-area-github
description: "Skill for the Github area of plan-things-2. 234 symbols across 38 files."
---

# Github

234 symbols | 38 files | Cohesion: 63%

## When to Use

- Working with code in `services/`
- Understanding how CardModalGitHubLinkedItems, CardModalGitHubMainPreview, CardModalGitHubPanel work
- Modifying github-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/github/BoardCardGitHubLinkEntity.java` | setGithubNumber, setGithubRef, setGithubSha, setTitle, setUrl (+28) |
| `services/api/src/main/java/com/planthings/api/github/DefaultGitHubApiClient.java` | encodeRef, getBranch, getCommit, getIssue, getPullRequest (+21) |
| `services/api/src/main/java/com/planthings/api/github/PlanGitHubRepoEntity.java` | setConnectedAt, setConnectedByUserId, setDefaultBranch, setGithubRepoId, setIsPrivate (+15) |
| `services/api/src/main/java/com/planthings/api/github/GitHubRestExecutor.java` | get, applyDefaultHeaders, exchange, mapFailure, postForm (+13) |
| `services/api/src/main/java/com/planthings/api/github/GitHubLinkMapper.java` | mapPullRequestStatus, extractBodyPreview, extractSnapshotUpdatedAt, formatNumber, formatUpdatedAt (+11) |
| `services/api/src/test/java/com/planthings/api/GitHubIntegrationApiIntegrationTest.java` | getCommit, getPullRequest, refreshCommit, refreshPullRequest, getRepository (+10) |
| `services/api/src/main/java/com/planthings/api/github/GitHubApiClient.java` | getBranch, getCommit, getIssue, getPullRequest, getRepository (+9) |
| `services/api/src/main/java/com/planthings/api/github/PlanGitHubService.java` | connectRepository, requireActivePlanRepo, formatDateTime, toConnectedRepoView, buildIssueSearchQuery (+3) |
| `services/api/src/main/java/com/planthings/api/github/CardGitHubService.java` | populateFromGitHub, createLink, unlink, listLinks, requireCard (+2) |
| `services/api/src/test/java/com/planthings/api/github/GitHubAnchorServiceTest.java` | anchor, shouldCompleteClosedIssueAnchor, shouldCompleteOnlyMergedPullRequestAnchor, shouldNotCompleteBranchOrCommitAnchors, shouldNotCompleteClosedPullRequestWithoutMerge (+1) |

## Entry Points

Start here when exploring this area:

- **`CardModalGitHubLinkedItems`** (Function) — `apps/web/src/features/workspace/components/CardModal/components/github/CardModalGitHubLinkedItems.jsx:21`
- **`CardModalGitHubMainPreview`** (Function) — `apps/web/src/features/workspace/components/CardModal/components/github/CardModalGitHubMainPreview.jsx:24`
- **`CardModalGitHubPanel`** (Function) — `apps/web/src/features/workspace/components/CardModal/components/github/CardModalGitHubPanel.jsx:51`
- **`CardModalGitHubSearchBar`** (Function) — `apps/web/src/features/workspace/components/CardModal/components/github/components/CardModalGitHubSearchBar.jsx:23`
- **`CardModalGitHubStateView`** (Function) — `apps/web/src/features/workspace/components/CardModal/components/github/components/CardModalGitHubStateView.jsx:20`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `BoardCardGitHubLinkEntity` | Class | `services/api/src/main/java/com/planthings/api/github/BoardCardGitHubLinkEntity.java` | 11 |
| `PlanGitHubRepoEntity` | Class | `services/api/src/main/java/com/planthings/api/github/PlanGitHubRepoEntity.java` | 9 |
| `DefaultGitHubApiClient` | Class | `services/api/src/main/java/com/planthings/api/github/DefaultGitHubApiClient.java` | 13 |
| `DefaultGitHubOAuthClient` | Class | `services/api/src/main/java/com/planthings/api/github/DefaultGitHubOAuthClient.java` | 12 |
| `GitHubUrlParser` | Class | `services/api/src/main/java/com/planthings/api/github/GitHubUrlParser.java` | 9 |
| `CardModalGitHubLinkedItems` | Function | `apps/web/src/features/workspace/components/CardModal/components/github/CardModalGitHubLinkedItems.jsx` | 21 |
| `CardModalGitHubMainPreview` | Function | `apps/web/src/features/workspace/components/CardModal/components/github/CardModalGitHubMainPreview.jsx` | 24 |
| `CardModalGitHubPanel` | Function | `apps/web/src/features/workspace/components/CardModal/components/github/CardModalGitHubPanel.jsx` | 51 |
| `CardModalGitHubSearchBar` | Function | `apps/web/src/features/workspace/components/CardModal/components/github/components/CardModalGitHubSearchBar.jsx` | 23 |
| `CardModalGitHubStateView` | Function | `apps/web/src/features/workspace/components/CardModal/components/github/components/CardModalGitHubStateView.jsx` | 20 |
| `CardModalGitHubUrlInput` | Function | `apps/web/src/features/workspace/components/CardModal/components/github/components/CardModalGitHubUrlInput.jsx` | 17 |
| `GitHubApiClient` | Interface | `services/api/src/main/java/com/planthings/api/github/GitHubApiClient.java` | 6 |
| `GitHubOAuthClient` | Interface | `services/api/src/main/java/com/planthings/api/github/GitHubOAuthClient.java` | 2 |
| `setGithubNumber` | Method | `services/api/src/main/java/com/planthings/api/github/BoardCardGitHubLinkEntity.java` | 101 |
| `setGithubRef` | Method | `services/api/src/main/java/com/planthings/api/github/BoardCardGitHubLinkEntity.java` | 109 |
| `setGithubSha` | Method | `services/api/src/main/java/com/planthings/api/github/BoardCardGitHubLinkEntity.java` | 117 |
| `setTitle` | Method | `services/api/src/main/java/com/planthings/api/github/BoardCardGitHubLinkEntity.java` | 133 |
| `setUrl` | Method | `services/api/src/main/java/com/planthings/api/github/BoardCardGitHubLinkEntity.java` | 141 |
| `populateFromGitHub` | Method | `services/api/src/main/java/com/planthings/api/github/CardGitHubService.java` | 169 |
| `getBranch` | Method | `services/api/src/main/java/com/planthings/api/github/GitHubApiClient.java` | 16 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `PopulateFromGitHub → ApiException` | cross_community | 10 |
| `PopulateFromGitHub → RetryAfterSeconds` | cross_community | 9 |
| `PopulateFromGitHub → GetApiVersion` | cross_community | 8 |
| `PopulateFromGitHub → GetUserAgent` | cross_community | 8 |
| `PopulateFromGitHub → NotModified` | cross_community | 8 |
| `RefreshFromGitHub → ApiException` | cross_community | 8 |
| `PopulateFromGitHub → GetApiBaseUrl` | cross_community | 7 |
| `RefreshFromGitHub → RetryAfterSeconds` | cross_community | 7 |
| `SearchGitHubRepositories → ApiException` | cross_community | 7 |
| `SearchObjects → ApiException` | cross_community | 7 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Settings | 29 calls |
| Board | 14 calls |
| Plans | 5 calls |
| Components | 2 calls |
| PlanGitHubIntegrationModal | 2 calls |

## How to Explore

1. `context({name: "CardModalGitHubLinkedItems"})` — see callers and callees
2. `query({search_query: "github"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
