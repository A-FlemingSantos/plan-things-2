package com.planthings.api.board;

import com.planthings.api.common.api.ApiEnvelope;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/plans/{planId}/board")
public class BoardController {

  private final BoardService boardService;

  public BoardController(BoardService boardService) {
    this.boardService = boardService;
  }

  @GetMapping
  public ApiEnvelope<BoardService.BoardView> getBoard(@PathVariable UUID planId) {
    return ApiEnvelope.ok(boardService.getBoard(planId));
  }

  @PostMapping("/columns")
  public ApiEnvelope<BoardService.BoardView> createColumn(@PathVariable UUID planId, @Valid @RequestBody ColumnRequest request) {
    return ApiEnvelope.ok(boardService.createColumn(planId, request.title(), request.color()));
  }

  @PatchMapping("/columns/{columnId}")
  public ApiEnvelope<BoardService.BoardView> updateColumn(@PathVariable UUID planId, @PathVariable UUID columnId, @Valid @RequestBody ColumnRequest request) {
    return ApiEnvelope.ok(boardService.updateColumn(planId, columnId, request.title(), request.color()));
  }

  @DeleteMapping("/columns/{columnId}")
  public ApiEnvelope<BoardService.MessageResponse> deleteColumn(@PathVariable UUID planId, @PathVariable UUID columnId) {
    return ApiEnvelope.ok(boardService.deleteColumn(planId, columnId));
  }

  @PutMapping("/columns/reorder")
  public ApiEnvelope<BoardService.BoardView> reorderColumns(@PathVariable UUID planId, @Valid @RequestBody ReorderColumnsRequest request) {
    return ApiEnvelope.ok(boardService.reorderColumns(planId, request.orderedColumnIds()));
  }

  @PostMapping("/cards")
  public ApiEnvelope<BoardService.BoardCardView> createCard(@PathVariable UUID planId, @Valid @RequestBody CardRequest request) {
    return ApiEnvelope.ok(boardService.createCard(planId, request.columnId(), request.title(), request.description(), request.labelId(), request.assigneeIds(), request.startAt(), request.dueAt()));
  }

  @PatchMapping("/cards/{cardId}")
  public ApiEnvelope<BoardService.BoardCardView> updateCard(@PathVariable UUID planId, @PathVariable UUID cardId, @Valid @RequestBody CardRequest request) {
    return ApiEnvelope.ok(boardService.updateCard(planId, cardId, request.columnId(), request.title(), request.description(), request.labelId(), request.assigneeIds(), request.startAt(), request.dueAt()));
  }

  @PutMapping("/cards/{cardId}/move")
  public ApiEnvelope<BoardService.BoardView> moveCard(@PathVariable UUID planId, @PathVariable UUID cardId, @Valid @RequestBody MoveCardRequest request) {
    return ApiEnvelope.ok(boardService.moveCard(planId, cardId, request.targetColumnId(), request.targetPosition()));
  }

  @DeleteMapping("/cards/{cardId}")
  public ApiEnvelope<BoardService.MessageResponse> deleteCard(@PathVariable UUID planId, @PathVariable UUID cardId) {
    return ApiEnvelope.ok(boardService.deleteCard(planId, cardId));
  }

  @PostMapping("/cards/{cardId}/inbox/send")
  public ApiEnvelope<BoardService.InboxDeliveryResponse> sendCardToInbox(
      @PathVariable UUID planId,
      @PathVariable UUID cardId,
      @RequestBody(required = false) InboxSendRequest request
  ) {
    List<UUID> recipientUserIds = request == null ? List.of() : request.recipientUserIds();
    return ApiEnvelope.ok(boardService.sendCardToInbox(planId, cardId, recipientUserIds));
  }

  @PostMapping("/cards/{cardId}/comments")
  public ApiEnvelope<BoardService.CommentView> addComment(@PathVariable UUID planId, @PathVariable UUID cardId, @Valid @RequestBody CommentRequest request) {
    return ApiEnvelope.ok(boardService.addComment(planId, cardId, request.message()));
  }

  @PostMapping("/cards/{cardId}/checklists")
  public ApiEnvelope<BoardService.ChecklistView> createChecklist(@PathVariable UUID planId, @PathVariable UUID cardId, @Valid @RequestBody ChecklistRequest request) {
    return ApiEnvelope.ok(boardService.createChecklist(planId, cardId, request.title()));
  }

  @PostMapping("/checklists/{checklistId}/items")
  public ApiEnvelope<BoardService.ChecklistItemView> createChecklistItem(@PathVariable UUID planId, @PathVariable UUID checklistId, @Valid @RequestBody ChecklistItemRequest request) {
    return ApiEnvelope.ok(boardService.createChecklistItem(planId, checklistId, request.title(), request.assigneeUserId(), request.startAt(), request.dueAt()));
  }

  @PatchMapping("/checklists/items/{itemId}")
  public ApiEnvelope<BoardService.ChecklistItemView> updateChecklistItem(@PathVariable UUID planId, @PathVariable UUID itemId, @Valid @RequestBody ChecklistItemUpdateRequest request) {
    return ApiEnvelope.ok(boardService.updateChecklistItem(planId, itemId, request.title(), request.completed(), request.assigneeUserId(), request.startAt(), request.dueAt()));
  }

  public record ColumnRequest(@NotBlank(message = "O titulo da coluna e obrigatorio.") String title, String color) {
  }

  public record ReorderColumnsRequest(List<UUID> orderedColumnIds) {
  }

  public record CardRequest(
      UUID columnId,
      @NotBlank(message = "O titulo do cartao e obrigatorio.") String title,
      String description,
      UUID labelId,
      List<UUID> assigneeIds,
      OffsetDateTime startAt,
      OffsetDateTime dueAt
  ) {
  }

  public record MoveCardRequest(UUID targetColumnId, int targetPosition) {
  }

  public record InboxSendRequest(List<UUID> recipientUserIds) {
  }

  public record CommentRequest(@NotBlank(message = "O comentario e obrigatorio.") String message) {
  }

  public record ChecklistRequest(@NotBlank(message = "O titulo do checklist e obrigatorio.") String title) {
  }

  public record ChecklistItemRequest(
      @NotBlank(message = "O titulo do item e obrigatorio.") String title,
      UUID assigneeUserId,
      OffsetDateTime startAt,
      OffsetDateTime dueAt
  ) {
  }

  public record ChecklistItemUpdateRequest(
      @NotBlank(message = "O titulo do item e obrigatorio.") String title,
      Boolean completed,
      UUID assigneeUserId,
      OffsetDateTime startAt,
      OffsetDateTime dueAt
  ) {
  }
}
