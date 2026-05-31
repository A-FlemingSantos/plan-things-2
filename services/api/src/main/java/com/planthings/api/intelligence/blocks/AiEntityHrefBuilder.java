package com.planthings.api.intelligence.blocks;

import java.util.UUID;

public final class AiEntityHrefBuilder {

  public static final String WORKSPACE_PATH = "/workspace";
  public static final String WORKSPACE_BOARD_PATH = "/workspace/board";

  private AiEntityHrefBuilder() {
  }

  public static String planBoardHref(UUID planId) {
    return WORKSPACE_BOARD_PATH + "/" + planId;
  }

  public static String cardBoardHref(UUID planId, UUID cardId) {
    return planBoardHref(planId) + "?card=" + cardId;
  }

  public static String fileWorkspaceHref(UUID fileId) {
    return WORKSPACE_PATH + "?file=" + fileId;
  }
}
