---
name: files
description: "Skill for the Files area of plan-things-2. 230 symbols across 52 files."
---

# Files

230 symbols | 52 files | Cohesion: 60%

## When to Use

- Working with code in `services/`
- Understanding how completed, FilePlanShareEntity, FileBlobEntity work
- Modifying files-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/files/FileService.java` | listPersonalFiles, upload, uploadAndAttachToCard, delete, restore (+25) |
| `services/api/src/main/java/com/planthings/api/settings/SettingsExportService.java` | exportCurrentUserData, buildSharedHistory, buildFilesSection, planBundle, userMap (+16) |
| `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java` | getWorkspaceId, getOwnerUserId, getParentId, getType, getName (+14) |
| `services/api/src/main/java/com/planthings/api/files/FileController.java` | listFiles, upload, uploadAndAttachToCard, delete, permanentlyDelete (+8) |
| `services/api/src/main/java/com/planthings/api/settings/SettingsController.java` | getAccountAvatar, exportSettingsData, updateAccount, uploadAccountAvatar, removeAccountAvatar (+5) |
| `services/api/src/main/java/com/planthings/api/settings/SettingsService.java` | updateAccount, uploadAccountAvatar, removeAccountAvatar, getAccountAvatar, changePassword (+3) |
| `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | sessionForUserId, refreshSession, me, buildSessionResponse, buildSessionResponse (+2) |
| `services/api/src/main/java/com/planthings/api/files/FilePlanShareEntity.java` | getFileEntryId, getPlanId, FilePlanShareEntity, setFileEntryId, setPlanId (+2) |
| `services/api/src/main/java/com/planthings/api/files/CardAttachmentEntity.java` | getFileEntryId, getAttachedByUserId, CardAttachmentEntity, setCardId, setFileEntryId (+1) |
| `services/api/src/main/java/com/planthings/api/plans/PlanEntity.java` | getOwnerUserId, getName, getDescription, getCoverThemeId, getCoverColor (+1) |

## Entry Points

Start here when exploring this area:

- **`completed`** (Function) — `apps/web/src/features/workspace/pages/KanbanBoard/plannerFilters.js:75`
- **`FilePlanShareEntity`** (Class) — `services/api/src/main/java/com/planthings/api/files/FilePlanShareEntity.java:8`
- **`FileBlobEntity`** (Class) — `services/api/src/main/java/com/planthings/api/files/FileBlobEntity.java:9`
- **`FileEntryEntity`** (Class) — `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java:11`
- **`CardAttachmentEntity`** (Class) — `services/api/src/main/java/com/planthings/api/files/CardAttachmentEntity.java:8`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `FilePlanShareEntity` | Class | `services/api/src/main/java/com/planthings/api/files/FilePlanShareEntity.java` | 8 |
| `FileBlobEntity` | Class | `services/api/src/main/java/com/planthings/api/files/FileBlobEntity.java` | 9 |
| `FileEntryEntity` | Class | `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java` | 11 |
| `CardAttachmentEntity` | Class | `services/api/src/main/java/com/planthings/api/files/CardAttachmentEntity.java` | 8 |
| `completed` | Function | `apps/web/src/features/workspace/pages/KanbanBoard/plannerFilters.js` | 75 |
| `sessionForUserId` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 136 |
| `refreshSession` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 145 |
| `me` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 203 |
| `buildSessionResponse` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 210 |
| `buildSessionResponse` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 215 |
| `toUserSummary` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 220 |
| `toWorkspaceSummary` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 234 |
| `getFullName` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 29 |
| `getEmail` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 37 |
| `isLocalPasswordEnabled` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 53 |
| `getLocaleTag` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 61 |
| `getTimeZone` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 69 |
| `isEmailVerified` | Method | `services/api/src/main/java/com/planthings/api/auth/UserExternalIdentityEntity.java` | 65 |
| `getDisplayName` | Method | `services/api/src/main/java/com/planthings/api/auth/UserExternalIdentityEntity.java` | 73 |
| `getAvatarUrl` | Method | `services/api/src/main/java/com/planthings/api/auth/UserExternalIdentityEntity.java` | 81 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateEvent → UnauthorizedException` | cross_community | 6 |
| `CreateFolder → UnauthorizedException` | cross_community | 6 |
| `CreateConversation → UnauthorizedException` | cross_community | 6 |
| `CreatePlan → UnauthorizedException` | cross_community | 6 |
| `SendCardToInbox → UnauthorizedException` | cross_community | 6 |
| `ListEvents → UnauthorizedException` | cross_community | 6 |
| `ListFiles → UnauthorizedException` | cross_community | 6 |
| `Upload → UnauthorizedException` | cross_community | 6 |
| `UploadAndAttachToCard → UnauthorizedException` | cross_community | 6 |
| `Restore → UnauthorizedException` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Board | 40 calls |
| Auth | 11 calls |
| Settings | 6 calls |
| Workspace | 5 calls |
| Avatar | 4 calls |
| Plans | 4 calls |
| Calendar | 3 calls |
| Security | 2 calls |

## How to Explore

1. `gitnexus_context({name: "completed"})` — see callers and callees
2. `gitnexus_query({query: "files"})` — find related execution flows
3. Read key files listed above for implementation details
