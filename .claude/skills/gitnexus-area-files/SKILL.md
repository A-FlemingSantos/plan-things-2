---
name: gitnexus-area-files
description: "Skill for the Files area of plan-things-2. 50 symbols across 12 files."
---

# Files

50 symbols | 12 files | Cohesion: 64%

## When to Use

- Working with code in `services/`
- Understanding how FileEntryEntity, FilePlanShareEntity, CardAttachmentEntity work
- Modifying files-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/files/FileService.java` | createFolder, persistUploadedFile, requireName, attachToCard, ensureFileSharedWithPlan (+10) |
| `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java` | FileEntryEntity, setMimeType, setName, setOwnerUserId, setParentId (+3) |
| `services/api/src/main/java/com/planthings/api/files/FileController.java` | createFolder, attachToCard, shareToPlan, uploadAndAttachToCard, removeAttachment (+2) |
| `services/api/src/main/java/com/planthings/api/files/FilePlanShareEntity.java` | FilePlanShareEntity, setFileEntryId, setPlanId, setSharedByUserId, getSharedByUserId |
| `services/api/src/main/java/com/planthings/api/files/CardAttachmentEntity.java` | CardAttachmentEntity, setAttachedByUserId, setCardId, setFileEntryId, getCardId |
| `services/api/src/main/java/com/planthings/api/files/FileBlobEntity.java` | setContent, setFileEntryId |
| `services/api/src/main/java/com/planthings/api/files/CardAttachmentRepository.java` | findByCardId, findByFileEntryId |
| `services/api/src/main/java/com/planthings/api/files/FileEntryRepository.java` | findByWorkspaceIdAndDeletedAtIsNotNullOrderByUpdatedAtDesc, findByWorkspaceIdAndOwnerUserIdAndDeletedAtIsNullOrderByTypeAscNameAsc |
| `services/api/src/test/java/com/planthings/api/IntelligenceApiIntegrationTest.java` | saveFileEntry |
| `services/api/src/test/java/com/planthings/api/intelligence/blocks/AiEntityReferenceResolverTest.java` | shouldResolveFileAttachmentReference |

## Entry Points

Start here when exploring this area:

- **`FileEntryEntity`** (Class) — `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java:11`
- **`FilePlanShareEntity`** (Class) — `services/api/src/main/java/com/planthings/api/files/FilePlanShareEntity.java:8`
- **`CardAttachmentEntity`** (Class) — `services/api/src/main/java/com/planthings/api/files/CardAttachmentEntity.java:8`
- **`setContent`** (Method) — `services/api/src/main/java/com/planthings/api/files/FileBlobEntity.java:32`
- **`setFileEntryId`** (Method) — `services/api/src/main/java/com/planthings/api/files/FileBlobEntity.java:24`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `FileEntryEntity` | Class | `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java` | 11 |
| `FilePlanShareEntity` | Class | `services/api/src/main/java/com/planthings/api/files/FilePlanShareEntity.java` | 8 |
| `CardAttachmentEntity` | Class | `services/api/src/main/java/com/planthings/api/files/CardAttachmentEntity.java` | 8 |
| `setContent` | Method | `services/api/src/main/java/com/planthings/api/files/FileBlobEntity.java` | 32 |
| `setFileEntryId` | Method | `services/api/src/main/java/com/planthings/api/files/FileBlobEntity.java` | 24 |
| `createFolder` | Method | `services/api/src/main/java/com/planthings/api/files/FileController.java` | 42 |
| `setMimeType` | Method | `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java` | 87 |
| `setName` | Method | `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java` | 79 |
| `setOwnerUserId` | Method | `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java` | 55 |
| `setParentId` | Method | `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java` | 63 |
| `setSizeBytes` | Method | `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java` | 95 |
| `setType` | Method | `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java` | 71 |
| `setWorkspaceId` | Method | `services/api/src/main/java/com/planthings/api/files/FileEntryEntity.java` | 47 |
| `createFolder` | Method | `services/api/src/main/java/com/planthings/api/files/FileService.java` | 96 |
| `persistUploadedFile` | Method | `services/api/src/main/java/com/planthings/api/files/FileService.java` | 350 |
| `requireName` | Method | `services/api/src/main/java/com/planthings/api/files/FileService.java` | 497 |
| `attachToCard` | Method | `services/api/src/main/java/com/planthings/api/files/FileController.java` | 101 |
| `shareToPlan` | Method | `services/api/src/main/java/com/planthings/api/files/FileController.java` | 91 |
| `uploadAndAttachToCard` | Method | `services/api/src/main/java/com/planthings/api/files/FileController.java` | 52 |
| `setFileEntryId` | Method | `services/api/src/main/java/com/planthings/api/files/FilePlanShareEntity.java` | 25 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateFolder → ApiException` | cross_community | 7 |
| `ListFiles → ApiException` | cross_community | 7 |
| `UploadAndAttachToCard → ApiException` | cross_community | 7 |
| `ShareToPlan → ApiException` | cross_community | 7 |
| `AttachToCard → ApiException` | cross_community | 7 |
| `CreateFolder → GetUserId` | cross_community | 5 |
| `ListFiles → GetUserId` | cross_community | 5 |
| `UploadAndAttachToCard → GetUserId` | cross_community | 5 |
| `UploadAndAttachToCard → FindByPlanIdAndUserId` | cross_community | 5 |
| `ShareToPlan → GetUserId` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Settings | 34 calls |
| Board | 10 calls |
| Plans | 4 calls |
| Blocks | 1 calls |

## How to Explore

1. `context({name: "FileEntryEntity"})` — see callers and callees
2. `query({search_query: "files"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
