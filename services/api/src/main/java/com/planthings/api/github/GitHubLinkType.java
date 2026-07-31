package com.planthings.api.github;

public enum GitHubLinkType {
  ISSUE,
  PULL_REQUEST,
  BRANCH,
  COMMIT;

  public String toApiValue() {
    return switch (this) {
      case ISSUE -> "issue";
      case PULL_REQUEST -> "pull_request";
      case BRANCH -> "branch";
      case COMMIT -> "commit";
    };
  }

  public static GitHubLinkType fromApiValue(String value) {
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException("missing link type");
    }
    return switch (value.trim().toLowerCase()) {
      case "issue" -> ISSUE;
      case "pull_request", "pr" -> PULL_REQUEST;
      case "branch" -> BRANCH;
      case "commit" -> COMMIT;
      default -> throw new IllegalArgumentException("unsupported link type: " + value);
    };
  }

  public boolean isCompletionEligible() {
    return this == ISSUE || this == PULL_REQUEST;
  }
}
