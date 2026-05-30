package com.planthings.api.intelligence;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.board.BoardCardEntity;
import com.planthings.api.board.BoardCardRepository;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.ForbiddenException;
import com.planthings.api.common.error.NotFoundException;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import com.planthings.api.intelligence.model.AiConversationScopeType;
import com.planthings.api.intelligence.model.AiConversationStatus;
import com.planthings.api.intelligence.model.AiMessageRole;
import com.planthings.api.intelligence.model.AiMessageStatus;
import com.planthings.api.intelligence.persistence.AiConversationEntity;
import com.planthings.api.intelligence.persistence.AiConversationRepository;
import com.planthings.api.intelligence.persistence.AiMessageBlockEntity;
import com.planthings.api.intelligence.persistence.AiMessageBlockRepository;
import com.planthings.api.intelligence.persistence.AiMessageEntity;
import com.planthings.api.intelligence.persistence.AiMessageRepository;
import com.planthings.api.plans.PlanAccessService;
import com.planthings.api.plans.PlanEntity;
import com.planthings.api.workspace.PersonalWorkspaceService;
import com.planthings.api.workspace.WorkspaceEntity;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AiConversationService {

  private static final String DEFAULT_SYSTEM_PROMPT = """
      Voce e o Plan Things Intelligence, copiloto operacional do workspace.
      Responda em portugues, seja objetivo e nunca invente objetos do workspace.
      """;

  private final IntelligenceFeatureService intelligenceFeatureService;
  private final AuthenticatedUserService authenticatedUserService;
  private final PersonalWorkspaceService personalWorkspaceService;
  private final PlanAccessService planAccessService;
  private final BoardCardRepository boardCardRepository;
  private final AiConversationRepository conversationRepository;
  private final AiMessageRepository messageRepository;
  private final AiMessageBlockRepository messageBlockRepository;
  private final BrazilDateTimeMapper brazilDateTimeMapper;

  public AiConversationService(
      IntelligenceFeatureService intelligenceFeatureService,
      AuthenticatedUserService authenticatedUserService,
      PersonalWorkspaceService personalWorkspaceService,
      PlanAccessService planAccessService,
      BoardCardRepository boardCardRepository,
      AiConversationRepository conversationRepository,
      AiMessageRepository messageRepository,
      AiMessageBlockRepository messageBlockRepository,
      BrazilDateTimeMapper brazilDateTimeMapper
  ) {
    this.intelligenceFeatureService = intelligenceFeatureService;
    this.authenticatedUserService = authenticatedUserService;
    this.personalWorkspaceService = personalWorkspaceService;
    this.planAccessService = planAccessService;
    this.boardCardRepository = boardCardRepository;
    this.conversationRepository = conversationRepository;
    this.messageRepository = messageRepository;
    this.messageBlockRepository = messageBlockRepository;
    this.brazilDateTimeMapper = brazilDateTimeMapper;
  }

  @Transactional
  public ConversationDetails createConversation(CreateConversationCommand command) {
    intelligenceFeatureService.requireEnabled();

    UserEntity currentUser = authenticatedUserService.requireUser();
    WorkspaceEntity workspace = personalWorkspaceService.getOrCreate(currentUser);
    UUID planId = command.planId();
    UUID cardId = command.cardId();
    AiConversationScopeType scopeType = command.scopeType() == null ? AiConversationScopeType.WORKSPACE : command.scopeType();

    if (cardId != null) {
      BoardCardEntity card = boardCardRepository.findById(cardId)
          .orElseThrow(() -> new NotFoundException("CARTAO_NAO_ENCONTRADO", "Nao encontramos o cartao informado."));
      if (planId != null && !planId.equals(card.getPlanId())) {
        throw new NotFoundException("CARTAO_NAO_ENCONTRADO", "Nao encontramos o cartao informado neste plano.");
      }
      planId = card.getPlanId();
      PlanEntity plan = planAccessService.requirePlanMember(planId, currentUser.getId());
      if (!plan.getWorkspaceId().equals(workspace.getId())) {
        throw new ForbiddenException("PLANO_FORA_DO_WORKSPACE", "Este plano nao pertence ao workspace atual.");
      }
      if (scopeType == AiConversationScopeType.WORKSPACE || scopeType == AiConversationScopeType.PLAN) {
        scopeType = AiConversationScopeType.CARD;
      }
    } else if (planId != null) {
      PlanEntity plan = planAccessService.requirePlanMember(planId, currentUser.getId());
      if (!plan.getWorkspaceId().equals(workspace.getId())) {
        throw new ForbiddenException("PLANO_FORA_DO_WORKSPACE", "Este plano nao pertence ao workspace atual.");
      }
      if (scopeType == AiConversationScopeType.WORKSPACE) {
        scopeType = AiConversationScopeType.PLAN;
      }
    }

    AiConversationEntity conversation = new AiConversationEntity();
    conversation.setWorkspaceId(workspace.getId());
    conversation.setPlanId(planId);
    conversation.setCardId(cardId);
    conversation.setCreatedByUserId(currentUser.getId());
    conversation.setTitle(normalizeTitle(command.title()));
    conversation.setScopeType(scopeType);
    conversation.setStatus(AiConversationStatus.ACTIVE);
    conversationRepository.save(conversation);

    return toConversationDetails(conversation);
  }

  @Transactional(readOnly = true)
  public ConversationDetails getConversation(UUID conversationId) {
    intelligenceFeatureService.requireEnabled();
    AiConversationEntity conversation = requireOwnedConversation(conversationId);
    return toConversationDetails(conversation);
  }

  @Transactional(readOnly = true)
  public List<MessageDetails> listMessages(UUID conversationId) {
    intelligenceFeatureService.requireEnabled();
    requireOwnedConversation(conversationId);
    return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId).stream()
        .map(this::toMessageDetails)
        .toList();
  }

  @Transactional
  public MessageAcceptedResult createUserMessage(UUID conversationId, String content) {
    intelligenceFeatureService.requireEnabled();

    String normalizedContent = normalizeContent(content);
    AiConversationEntity conversation = requireOwnedConversation(conversationId);
    OffsetDateTime userCreatedAt = OffsetDateTime.now(ZoneOffset.UTC).minusNanos(1_000_000);

    AiMessageEntity userMessage = new AiMessageEntity();
    userMessage.setConversationId(conversation.getId());
    userMessage.setRole(AiMessageRole.USER);
    userMessage.setStatus(AiMessageStatus.COMPLETED);
    userMessage.setContentText(normalizedContent);
    userMessage.setCreatedAt(userCreatedAt);
    messageRepository.save(userMessage);

    AiMessageEntity assistantMessage = new AiMessageEntity();
    assistantMessage.setConversationId(conversation.getId());
    assistantMessage.setRole(AiMessageRole.ASSISTANT);
    assistantMessage.setStatus(AiMessageStatus.PENDING);
    messageRepository.save(assistantMessage);

    conversationRepository.save(conversation);

    return new MessageAcceptedResult(
        conversation.getId(),
        userMessage.getId(),
        assistantMessage.getId(),
        AiMessageStatus.PENDING.name()
    );
  }

  @Transactional(readOnly = true)
  public AiConversationEntity requireOwnedConversation(UUID conversationId) {
    UUID userId = authenticatedUserService.requireUserId();
    return conversationRepository.findByIdAndCreatedByUserId(conversationId, userId)
        .orElseThrow(() -> new NotFoundException(
            "CONVERSA_NAO_ENCONTRADA",
            "Nao encontramos a conversa informada."
        ));
  }

  public String defaultSystemPrompt() {
    return DEFAULT_SYSTEM_PROMPT;
  }

  private MessageDetails toMessageDetails(AiMessageEntity message) {
    List<MessageBlockDetails> blocks = messageBlockRepository.findByMessageIdOrderByPositionAsc(message.getId()).stream()
        .map(this::toMessageBlockDetails)
        .toList();

    return new MessageDetails(
        message.getId(),
        message.getConversationId(),
        message.getRole().name(),
        message.getStatus().name(),
        message.getContentText(),
        message.getOpenaiResponseId(),
        message.getErrorCode(),
        blocks,
        toDateTime(message.getCreatedAt())
    );
  }

  private MessageBlockDetails toMessageBlockDetails(AiMessageBlockEntity block) {
    return new MessageBlockDetails(
        block.getId(),
        block.getBlockType().name(),
        block.getPosition(),
        block.getTitle(),
        block.getHref(),
        block.getEntityType(),
        block.getEntityId(),
        block.getPayloadJson(),
        block.getSnapshotJson()
    );
  }

  private ConversationDetails toConversationDetails(AiConversationEntity conversation) {
    return new ConversationDetails(
        conversation.getId(),
        conversation.getWorkspaceId(),
        conversation.getPlanId(),
        conversation.getCardId(),
        conversation.getTitle(),
        conversation.getScopeType().name(),
        conversation.getStatus().name(),
        conversation.getLastOpenaiResponseId(),
        toDateTime(conversation.getCreatedAt()),
        toDateTime(conversation.getUpdatedAt())
    );
  }

  private ApiDateTimeDto toDateTime(java.time.OffsetDateTime value) {
    return brazilDateTimeMapper.toDateTime(value);
  }

  private String normalizeTitle(String title) {
    if (!StringUtils.hasText(title)) {
      return null;
    }
    return title.trim();
  }

  private String normalizeContent(String content) {
    if (!StringUtils.hasText(content)) {
      throw new BadRequestException("MENSAGEM_VAZIA", "Escreva uma mensagem antes de enviar.");
    }
    return content.trim();
  }

  public record CreateConversationCommand(
      UUID planId,
      UUID cardId,
      AiConversationScopeType scopeType,
      String title
  ) {
  }

  public record ConversationDetails(
      UUID id,
      UUID workspaceId,
      UUID planId,
      UUID cardId,
      String title,
      String scopeType,
      String status,
      String lastOpenaiResponseId,
      ApiDateTimeDto createdAt,
      ApiDateTimeDto updatedAt
  ) {
  }

  public record MessageDetails(
      UUID id,
      UUID conversationId,
      String role,
      String status,
      String contentText,
      String openaiResponseId,
      String errorCode,
      List<MessageBlockDetails> blocks,
      ApiDateTimeDto createdAt
  ) {
  }

  public record MessageBlockDetails(
      UUID id,
      String blockType,
      int position,
      String title,
      String href,
      String entityType,
      UUID entityId,
      String payloadJson,
      String snapshotJson
  ) {
  }

  public record MessageAcceptedResult(
      UUID conversationId,
      UUID userMessageId,
      UUID assistantMessageId,
      String assistantStatus
  ) {
  }
}
