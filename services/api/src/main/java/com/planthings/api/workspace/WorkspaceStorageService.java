package com.planthings.api.workspace;

import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.files.FileEntryRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class WorkspaceStorageService {

  private final FileEntryRepository fileEntryRepository;
  private final StorageQuotaProperties storageQuotaProperties;

  public WorkspaceStorageService(FileEntryRepository fileEntryRepository, StorageQuotaProperties storageQuotaProperties) {
    this.fileEntryRepository = fileEntryRepository;
    this.storageQuotaProperties = storageQuotaProperties;
  }

  public long storageQuotaBytes(WorkspaceSubscriptionPlan subscriptionPlan) {
    if (subscriptionPlan == null) {
      return storageQuotaProperties.getBasicBytes();
    }

    return switch (subscriptionPlan) {
      case BASIC -> storageQuotaProperties.getBasicBytes();
      case PROFESSIONAL -> storageQuotaProperties.getProfessionalBytes();
      case TEAM -> storageQuotaProperties.getTeamBytes();
    };
  }

  public long storageUsedBytes(UUID workspaceId) {
    return fileEntryRepository.sumActiveFileSizeBytes(workspaceId);
  }

  public StorageSnapshot snapshot(WorkspaceEntity workspace) {
    long usedBytes = storageUsedBytes(workspace.getId());
    long quotaBytes = storageQuotaBytes(workspace.getSubscriptionPlan());
    return new StorageSnapshot(usedBytes, quotaBytes);
  }

  public void assertCanStore(WorkspaceEntity workspace, long bytesToAdd) {
    if (bytesToAdd <= 0) {
      return;
    }

    StorageSnapshot snapshot = snapshot(workspace);
    if (snapshot.storageUsedBytes() + bytesToAdd > snapshot.storageQuotaBytes()) {
      throw new BadRequestException(
          "STORAGE_QUOTA_EXCEEDED",
          "Voce atingiu o limite de armazenamento do seu plano. Libere espaco ou faca upgrade para continuar."
      );
    }
  }

  public void assertCanDowngrade(WorkspaceEntity workspace, WorkspaceSubscriptionPlan nextPlan) {
    long usedBytes = storageUsedBytes(workspace.getId());
    long nextQuotaBytes = storageQuotaBytes(nextPlan);
    if (usedBytes > nextQuotaBytes) {
      throw new BadRequestException(
          "DOWNGRADE_BLOCKED_STORAGE_EXCEEDED",
          "Seu uso atual excede a cota do novo plano. Libere espaco antes de mudar para este plano."
      );
    }
  }

  public record StorageSnapshot(long storageUsedBytes, long storageQuotaBytes) {
  }
}

