---
name: gitnexus-area-files
description: "Skill for the Files area of plan-things-2. 250 symbols across 62 files."
---

# Files

250 symbols | 62 files | Cohesion: 77%

## When to Use

- Working with code in `services/`
- Understanding how FileEntryEntity, FilePlanShareEntity, CardAttachmentEntity work
- Modifying files-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/files/FileService.java` | applyRestoreRecursively, applySoftDeleteRecursively, canAccessFile, collectSubtree, delete (+27) |
| `services/api/src/main/java/com/planthings/api/settings/SettingsExportService.java` | attachmentMap, boardAssigneeMap, boardCardMap, boardChecklistMap, boardColumnMap (+18) |
| `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java` | getDeletedAt, getMimeType, getName, getOwnerUserId, getParentId (+14) |
| `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | buildSessionResponse, buildSessionResponse, login, me, refreshSession (+3) |
| `services/api/src/main/java/com/planthings/api/board/BoardCardEntity.java` | getAuthorUserId, getDescription, getDueAt, getLabelId, getPositionIndex (+3) |
| `services/api/src/main/java/com/planthings/api/board/BoardService.java` | deriveCardKind, resolveInboxRecipients, sendCardToInbox, toAttachmentView, toCardView (+3) |
| `services/api/src/main/java/com/planthings/api/files/FilePlanShareEntity.java` | getFileEntryId, getPlanId, FilePlanShareEntity, setFileEntryId, setPlanId (+2) |
| `services/api/src/main/java/com/planthings/api/settings/SettingsService.java` | accountSettingsFor, changePassword, getAccountAvatar, removeAccountAvatar, setupOAuthPassword (+2) |
| `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | getEmail, getFullName, getLocaleTag, getPasswordHash, getTimeZone (+1) |
| `services/api/src/main/java/com/planthings/api/board/BoardCardInboxDeliveryEntity.java` | getCardId, getMessageId, getPlanId, getSentByUserId, getSentFrom (+1) |

## Entry Points

Start here when exploring this area:

- **`FileEntryEntity`** (Class) — `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java:11`
- **`FilePlanShareEntity`** (Class) — `services/api/src/main/java/com/planthings/api/files/FilePlanShareEntity.java:8`
- **`CardAttachmentEntity`** (Class) — `services/api/src/main/java/com/planthings/api/files/CardAttachmentEntity.java:8`
- **`buildSessionResponse`** (Method) — `services/api/src/main/java/com/planthings/api/auth/AuthService.java:215`
- **`buildSessionResponse`** (Method) — `services/api/src/main/java/com/planthings/api/auth/AuthService.java:210`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `FileEntryEntity` | Class | `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java` | 11 |
| `FilePlanShareEntity` | Class | `services/api/src/main/java/com/planthings/api/files/FilePlanShareEntity.java` | 8 |
| `CardAttachmentEntity` | Class | `services/api/src/main/java/com/planthings/api/files/CardAttachmentEntity.java` | 8 |
| `buildSessionResponse` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 215 |
| `buildSessionResponse` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 210 |
| `login` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 99 |
| `me` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 203 |
| `refreshSession` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 145 |
| `sessionForUserId` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 136 |
| `toUserSummary` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 220 |
| `toWorkspaceSummary` | Method | `services/api/src/main/java/com/planthings/api/auth/AuthService.java` | 234 |
| `getEmail` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 37 |
| `getFullName` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 29 |
| `getLocaleTag` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 61 |
| `getPasswordHash` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 45 |
| `getTimeZone` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 69 |
| `isLocalPasswordEnabled` | Method | `services/api/src/main/java/com/planthings/api/auth/UserEntity.java` | 53 |
| `existsByUserId` | Method | `services/api/src/main/java/com/planthings/api/auth/UserExternalIdentityRepository.java` | 12 |
| `getDeviceLabel` | Method | `services/api/src/main/java/com/planthings/api/auth/UserSessionEntity.java` | 47 |
| `findByUserIdAndRevokedAtIsNullOrderByLastSeenAtDescCreatedAtDesc` | Method | `services/api/src/main/java/com/planthings/api/auth/UserSessionRepository.java` | 15 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateEvent → ApiException` | cross_community | 7 |
| `CreateFolder → ApiException` | cross_community | 7 |
| `CreateConversation → ApiException` | cross_community | 7 |
| `CreatePlan → ApiException` | cross_community | 7 |
| `ListFiles → ApiException` | cross_community | 7 |
| `ListPendingInvites → ApiException` | cross_community | 7 |
| `DeleteAccount → ApiException` | cross_community | 7 |
| `StartGmailIntegration → ApiException` | cross_community | 7 |
| `UpdateEvent → ApiException` | cross_community | 7 |
| `DeleteEvent → ApiException` | cross_community | 7 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Board | 39 calls |
| Plans | 13 calls |
| Settings | 12 calls |
| Blocks | 10 calls |
| Auth | 7 calls |
| Avatar | 5 calls |
| Calendar | 3 calls |
| Security | 2 calls |

## How to Explore

1. `context({name: "FileEntryEntity"})` — see callers and callees
2. `query({search_query: "files"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
