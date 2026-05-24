---
name: avatar
description: "Skill for the Avatar area of plan-things-2. 20 symbols across 6 files."
---

# Avatar

20 symbols | 6 files | Cohesion: 75%

## When to Use

- Working with code in `services/`
- Understanding how AvatarImageEntity, getUserAvatar, getMimeType work
- Modifying avatar-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `services/api/src/main/java/com/planthings/api/avatar/AvatarImageEntity.java` | getMimeType, getContent, AvatarImageEntity, setOwnerType, setOwnerId (+2) |
| `services/api/src/main/java/com/planthings/api/avatar/AvatarImageService.java` | download, upload, validate, detectMimeType, normalizeMimeType |
| `services/api/src/main/java/com/planthings/api/settings/SettingsExportService.java` | buildZip, writeZipEntry, sanitizeFilename, extensionForMimeType |
| `services/api/src/main/java/com/planthings/api/files/FileBlobEntity.java` | getFileEntryId, getContent |
| `services/api/src/main/java/com/planthings/api/avatar/AvatarController.java` | getUserAvatar |
| `services/api/src/main/java/com/planthings/api/avatar/AvatarImageRepository.java` | findByOwnerTypeAndOwnerId |

## Entry Points

Start here when exploring this area:

- **`AvatarImageEntity`** (Class) — `services/api/src/main/java/com/planthings/api/avatar/AvatarImageEntity.java:12`
- **`getUserAvatar`** (Method) — `services/api/src/main/java/com/planthings/api/avatar/AvatarController.java:21`
- **`getMimeType`** (Method) — `services/api/src/main/java/com/planthings/api/avatar/AvatarImageEntity.java:49`
- **`getContent`** (Method) — `services/api/src/main/java/com/planthings/api/avatar/AvatarImageEntity.java:57`
- **`download`** (Method) — `services/api/src/main/java/com/planthings/api/avatar/AvatarImageService.java:44`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `AvatarImageEntity` | Class | `services/api/src/main/java/com/planthings/api/avatar/AvatarImageEntity.java` | 12 |
| `getUserAvatar` | Method | `services/api/src/main/java/com/planthings/api/avatar/AvatarController.java` | 21 |
| `getMimeType` | Method | `services/api/src/main/java/com/planthings/api/avatar/AvatarImageEntity.java` | 49 |
| `getContent` | Method | `services/api/src/main/java/com/planthings/api/avatar/AvatarImageEntity.java` | 57 |
| `download` | Method | `services/api/src/main/java/com/planthings/api/avatar/AvatarImageService.java` | 44 |
| `getFileEntryId` | Method | `services/api/src/main/java/com/planthings/api/files/FileBlobEntity.java` | 20 |
| `getContent` | Method | `services/api/src/main/java/com/planthings/api/files/FileBlobEntity.java` | 28 |
| `buildZip` | Method | `services/api/src/main/java/com/planthings/api/settings/SettingsExportService.java` | 324 |
| `writeZipEntry` | Method | `services/api/src/main/java/com/planthings/api/settings/SettingsExportService.java` | 369 |
| `sanitizeFilename` | Method | `services/api/src/main/java/com/planthings/api/settings/SettingsExportService.java` | 717 |
| `extensionForMimeType` | Method | `services/api/src/main/java/com/planthings/api/settings/SettingsExportService.java` | 724 |
| `setOwnerType` | Method | `services/api/src/main/java/com/planthings/api/avatar/AvatarImageEntity.java` | 37 |
| `setOwnerId` | Method | `services/api/src/main/java/com/planthings/api/avatar/AvatarImageEntity.java` | 45 |
| `setMimeType` | Method | `services/api/src/main/java/com/planthings/api/avatar/AvatarImageEntity.java` | 53 |
| `setContent` | Method | `services/api/src/main/java/com/planthings/api/avatar/AvatarImageEntity.java` | 61 |
| `findByOwnerTypeAndOwnerId` | Method | `services/api/src/main/java/com/planthings/api/avatar/AvatarImageRepository.java` | 7 |
| `upload` | Method | `services/api/src/main/java/com/planthings/api/avatar/AvatarImageService.java` | 24 |
| `validate` | Method | `services/api/src/main/java/com/planthings/api/avatar/AvatarImageService.java` | 58 |
| `detectMimeType` | Method | `services/api/src/main/java/com/planthings/api/avatar/AvatarImageService.java` | 86 |
| `normalizeMimeType` | Method | `services/api/src/main/java/com/planthings/api/avatar/AvatarImageService.java` | 121 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `UploadAccountAvatar → BadRequestException` | cross_community | 5 |
| `UploadAccountAvatar → NormalizeMimeType` | cross_community | 5 |
| `UploadAccountAvatar → DetectMimeType` | cross_community | 5 |
| `UploadAccountAvatar → FindByOwnerTypeAndOwnerId` | cross_community | 5 |
| `RemoveAccountAvatar → FindByOwnerTypeAndOwnerId` | cross_community | 5 |
| `UploadAccountAvatar → AvatarImageEntity` | cross_community | 4 |
| `UploadAccountAvatar → SetOwnerType` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Files | 5 calls |

## How to Explore

1. `gitnexus_context({name: "AvatarImageEntity"})` — see callers and callees
2. `gitnexus_query({query: "avatar"})` — find related execution flows
3. Read key files listed above for implementation details
