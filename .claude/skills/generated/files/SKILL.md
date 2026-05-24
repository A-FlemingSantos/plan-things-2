---
name: files
description: "Skill for the Files area of plan-things-2. 227 symbols across 53 files."
---

# Files

227 symbols | 53 files | Cohesion: 65%

## When to Use

- Working with code in `services/`
- Understanding how FilePlanShareEntity, FileBlobEntity, FileEntryEntity work
- Modifying files-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/files/FileService.java` | upload, download, delete, restore, permanentlyDelete (+29) |
| `services/api/src/main/java/com/planthings/api/settings/SettingsExportService.java` | exportCurrentUserData, buildSharedHistory, buildFilesSection, planBundle, userMap (+17) |
| `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java` | getWorkspaceId, getOwnerUserId, getParentId, getType, getName (+14) |
| `services/api/src/main/java/com/planthings/api/files/FileController.java` | download, removeAttachment, uploadAndAttachToCard, shareToPlan, attachToCard (+4) |
| `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | login, sessionForUserId, refreshSession, me, buildSessionResponse (+3) |
| `services/api/src/main/java/com/planthings/api/plans/PlanService.java` | listAccessiblePlans, getPlan, listMembers, listLabels, toPlanSummary (+3) |
| `services/api/src/main/java/com/planthings/api/settings/SettingsService.java` | updateAccount, uploadAccountAvatar, removeAccountAvatar, getAccountAvatar, changePassword (+3) |
| `services/api/src/main/java/com/planthings/api/files/CardAttachmentEntity.java` | getCardId, getFileEntryId, getAttachedByUserId, CardAttachmentEntity, setCardId (+2) |
| `services/api/src/main/java/com/planthings/api/files/FilePlanShareEntity.java` | getFileEntryId, getPlanId, FilePlanShareEntity, setFileEntryId, setPlanId (+2) |
| `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | getFullName, getEmail, getPasswordHash, isLocalPasswordEnabled, getLocaleTag (+1) |

## Entry Points

Start here when exploring this area:

- **`FilePlanShareEntity`** (Class) — `services/api/src/main/java/com/planthings/api/files/FilePlanShareEntity.java:8`
- **`FileBlobEntity`** (Class) — `services/api/src/main/java/com/planthings/api/files/FileBlobEntity.java:9`
- **`FileEntryEntity`** (Class) — `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java:11`
- **`CardAttachmentEntity`** (Class) — `services/api/src/main/java/com/planthings/api/files/CardAttachmentEntity.java:8`
- **`login`** (Method) — `services/api/src/main/java/com/planthings/api/auth/AuthService.java:99`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `FilePlanShareEntity` | Class | `services/api/src/main/java/com/planthings/api/files/FilePlanShareEntity.java` | 8 |
| `FileBlobEntity` | Class | `services/api/src/main/java/com/planthings/api/files/FileBlobEntity.java` | 9 |
| `FileEntryEntity` | Class | `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java` | 11 |
| `CardAttachmentEntity` | Class | `services/api/src/main/java/com/planthings/api/files/CardAttachmentEntity.java` | 8 |
| `login` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 99 |
| `sessionForUserId` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 136 |
| `refreshSession` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 145 |
| `me` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 203 |
| `buildSessionResponse` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 210 |
| `buildSessionResponse` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 215 |
| `toUserSummary` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 220 |
| `toWorkspaceSummary` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 234 |
| `getFullName` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 29 |
| `getEmail` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 37 |
| `getPasswordHash` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 45 |
| `isLocalPasswordEnabled` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 53 |
| `getLocaleTag` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 61 |
| `getTimeZone` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 69 |
| `isEmailVerified` | Method | `services/api/src/main/java/com/planthings/api/auth/UserExternalIdentityEntity.java` | 65 |
| `getDisplayName` | Method | `services/api/src/main/java/com/planthings/api/auth/UserExternalIdentityEntity.java` | 73 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateEvent → UnauthorizedException` | cross_community | 6 |
| `CreateFolder → UnauthorizedException` | cross_community | 6 |
| `CreatePlan → UnauthorizedException` | cross_community | 6 |
| `SendCardToInbox → UnauthorizedException` | cross_community | 6 |
| `ListEvents → UnauthorizedException` | cross_community | 6 |
| `ListFiles → UnauthorizedException` | cross_community | 6 |
| `Upload → UnauthorizedException` | cross_community | 6 |
| `UploadAndAttachToCard → UnauthorizedException` | cross_community | 6 |
| `Restore → UnauthorizedException` | cross_community | 6 |
| `Favorite → UnauthorizedException` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Board | 27 calls |
| Settings | 17 calls |
| Auth | 11 calls |
| Plans | 8 calls |
| Avatar | 5 calls |
| Workspace | 5 calls |
| Api | 3 calls |
| Calendar | 3 calls |

## How to Explore

1. `gitnexus_context({name: "FilePlanShareEntity"})` — see callers and callees
2. `gitnexus_query({query: "files"})` — find related execution flows
3. Read key files listed above for implementation details
