package com.planthings.api.intelligence.blocks;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planthings.api.board.BoardCardEntity;
import com.planthings.api.board.BoardCardRepository;
import com.planthings.api.board.BoardColumnEntity;
import com.planthings.api.board.BoardColumnRepository;
import com.planthings.api.files.FileEntryEntity;
import com.planthings.api.files.FileEntryRepository;
import com.planthings.api.files.FilePlanShareRepository;
import com.planthings.api.intelligence.model.AiMessageBlockType;
import com.planthings.api.plans.PlanAccessService;
import com.planthings.api.plans.PlanEntity;
import com.planthings.api.plans.PlanMemberRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiEntityReferenceResolverTest {

  @Mock
  private PlanMemberRepository planMemberRepository;

  @Mock
  private PlanAccessService planAccessService;

  @Mock
  private BoardCardRepository boardCardRepository;

  @Mock
  private BoardColumnRepository boardColumnRepository;

  @Mock
  private FileEntryRepository fileEntryRepository;

  @Mock
  private FilePlanShareRepository filePlanShareRepository;

  private AiEntityReferenceResolver resolver;
  private UUID userId;
  private UUID planId;
  private UUID cardId;

  @BeforeEach
  void setUp() {
    resolver = new AiEntityReferenceResolver(
        new ObjectMapper(),
        planMemberRepository,
        planAccessService,
        boardCardRepository,
        boardColumnRepository,
        fileEntryRepository,
        filePlanShareRepository
    );
    userId = UUID.randomUUID();
    planId = UUID.randomUUID();
    cardId = UUID.randomUUID();
  }

  @Test
  void shouldResolvePlanReferenceFromContextChip() {
    PlanEntity plan = new PlanEntity();
    plan.setId(planId);
    plan.setName("Marketing Q2");

    when(planAccessService.requirePlanMember(planId, userId)).thenReturn(plan);
    when(planMemberRepository.findByPlanId(planId)).thenReturn(List.of());

    String snapshotJson = """
        {
          "version": 1,
          "contextChips": [
            { "id": "1", "kind": "plan", "type": "plan-%s", "label": "Marketing Q2" }
          ],
          "imageAttachments": [],
          "fileAttachments": []
        }
        """.formatted(planId);

    List<ResolvedEntityReferenceBlock> blocks = resolver.resolveFromSnapshotJson(snapshotJson, userId);

    assertEquals(1, blocks.size());
    assertEquals(AiMessageBlockType.PLAN_REFERENCE, blocks.get(0).blockType());
    assertEquals(AiEntityHrefBuilder.planBoardHref(planId), blocks.get(0).href());
    assertEquals("Marketing Q2", blocks.get(0).title());
  }

  @Test
  void shouldMarkUnavailablePlanWhenAccessFails() {
    when(planAccessService.requirePlanMember(eq(planId), eq(userId)))
        .thenThrow(new RuntimeException("forbidden"));

    String snapshotJson = """
        {
          "version": 1,
          "contextChips": [
            { "id": "1", "kind": "plan", "type": "plan-%s", "label": "Plano antigo" }
          ],
          "imageAttachments": [],
          "fileAttachments": []
        }
        """.formatted(planId);

    List<ResolvedEntityReferenceBlock> blocks = resolver.resolveFromSnapshotJson(snapshotJson, userId);

    assertEquals(1, blocks.size());
    assertNull(blocks.get(0).href());
    assertTrue(blocks.get(0).snapshotJson().contains("Indispon"));
  }

  @Test
  void shouldResolveCardReferenceWithBoardHref() {
    BoardCardEntity card = new BoardCardEntity();
    card.setId(cardId);
    card.setPlanId(planId);
    card.setColumnId(UUID.randomUUID());
    card.setTitle("Implementar hero");

    BoardColumnEntity column = new BoardColumnEntity();
    column.setId(card.getColumnId());
    column.setTitle("Em andamento");

    when(boardCardRepository.findById(cardId)).thenReturn(Optional.of(card));
    when(planAccessService.requirePlanMember(planId, userId)).thenReturn(new PlanEntity());
    when(boardColumnRepository.findById(card.getColumnId())).thenReturn(Optional.of(column));

    String snapshotJson = """
        {
          "version": 1,
          "contextChips": [
            { "id": "1", "kind": "card", "type": "card-%s", "label": "Hero" }
          ],
          "imageAttachments": [],
          "fileAttachments": []
        }
        """.formatted(cardId);

    List<ResolvedEntityReferenceBlock> blocks = resolver.resolveFromSnapshotJson(snapshotJson, userId);

    assertEquals(1, blocks.size());
    assertEquals(AiMessageBlockType.CARD_REFERENCE, blocks.get(0).blockType());
    assertEquals(AiEntityHrefBuilder.cardBoardHref(planId, cardId), blocks.get(0).href());
  }

  @Test
  void shouldResolveFileAttachmentReference() {
    UUID fileId = UUID.randomUUID();
    FileEntryEntity file = new FileEntryEntity();
    file.setId(fileId);
    file.setOwnerUserId(userId);
    file.setName("brief.pdf");
    file.setMimeType("application/pdf");

    when(fileEntryRepository.findById(fileId)).thenReturn(Optional.of(file));

    String snapshotJson = """
        {
          "version": 1,
          "contextChips": [],
          "imageAttachments": [],
          "fileAttachments": [
            { "id": "f1", "kind": "file", "type": "file-upload", "label": "brief.pdf", "fileId": "%s" }
          ]
        }
        """.formatted(fileId);

    List<ResolvedEntityReferenceBlock> blocks = resolver.resolveFromSnapshotJson(snapshotJson, userId);

    assertEquals(1, blocks.size());
    assertEquals(AiMessageBlockType.FILE_REFERENCE, blocks.get(0).blockType());
    assertEquals(AiEntityHrefBuilder.fileWorkspaceHref(fileId), blocks.get(0).href());
  }
}
