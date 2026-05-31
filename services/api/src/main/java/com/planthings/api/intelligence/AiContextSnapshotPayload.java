package com.planthings.api.intelligence;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = false)
public record AiContextSnapshotPayload(
    Integer version,
    @Valid @Size(max = AiContextBuilder.MAX_CONTEXT_CHIPS) List<ContextChipPayload> contextChips,
    @Valid @Size(max = AiContextBuilder.MAX_ATTACHMENTS) List<AttachmentPayload> imageAttachments,
    @Valid @Size(max = AiContextBuilder.MAX_ATTACHMENTS) List<AttachmentPayload> fileAttachments
) {

  private static final int MAX_METADATA_LENGTH = 500;

  @JsonIgnoreProperties(ignoreUnknown = false)
  public record ContextChipPayload(
      @Size(max = 120) String id,
      @Size(max = 120) String type,
      @Size(max = 40) String kind,
      @NotBlank @Size(max = AiContextBuilder.MAX_LABEL_LENGTH) String label
  ) {
  }

  @JsonIgnoreProperties(ignoreUnknown = false)
  public record AttachmentPayload(
      @Size(max = MAX_METADATA_LENGTH) String id,
      @Size(max = MAX_METADATA_LENGTH) String type,
      @Size(max = 40) String kind,
      @NotBlank @Size(max = AiContextBuilder.MAX_LABEL_LENGTH) String label,
      Boolean isImage,
      @Size(max = 500) String previewUrl,
      @Size(max = 120) String mimeType,
      @Size(max = 120) String fileId,
      Boolean isMock
  ) {
  }
}
