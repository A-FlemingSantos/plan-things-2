package com.planthings.api.board;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import com.planthings.api.plans.PlanEntity;
import com.planthings.api.settings.GmailMessageSender;
import com.planthings.api.settings.GmailMimeSupport;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.springframework.core.io.ClassPathResource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class BoardCardInboxEmailSender {

  private static final String CARD_INBOX_TEMPLATE = loadCardInboxTemplate();

  private final GmailMessageSender gmailMessageSender;
  private final BrazilDateTimeMapper brazilDateTimeMapper;
  private final String frontendBaseUrl;

  public BoardCardInboxEmailSender(
      GmailMessageSender gmailMessageSender,
      BrazilDateTimeMapper brazilDateTimeMapper,
      @Value("${app.frontend-base-url}") String frontendBaseUrl
  ) {
    this.gmailMessageSender = gmailMessageSender;
    this.brazilDateTimeMapper = brazilDateTimeMapper;
    this.frontendBaseUrl = normalizeFrontendBaseUrl(frontendBaseUrl);
  }

  public Delivery sendCard(
      UserEntity sender,
      PlanEntity plan,
      BoardCardEntity card,
      BoardService.CardKind kind,
      List<UserEntity> recipients
  ) {
    List<String> recipientEmails = recipients.stream()
        .map(UserEntity::getEmail)
        .distinct()
        .toList();
    GmailMessageSender.Delivery delivery = gmailMessageSender.send(
        sender,
        senderEmail -> GmailMimeSupport.encodeMimeMessage(buildCardMime(senderEmail, sender, plan, card, kind, recipients, recipientEmails))
    );
    return new Delivery(delivery.emailSent(), delivery.sentFrom(), recipientEmails, delivery.messageId(), delivery.threadId());
  }

  private String buildCardMime(
      String senderEmail,
      UserEntity sender,
      PlanEntity plan,
      BoardCardEntity card,
      BoardService.CardKind kind,
      List<UserEntity> recipients,
      List<String> recipientEmails
  ) {
    String boundary = "planthings-card-" + UUID.randomUUID();
    String subject = "[Plan Things] Tarefa atribuída: " + card.getTitle();
    String cardUrl = frontendBaseUrl + "/workspace/board/" + plan.getId() + "?card=" + card.getId();
    String senderName = sender.getFullName();
    String kindLabel = kindLabel(kind);
    String assigneeNames = recipients.stream().map(UserEntity::getFullName).distinct().reduce((left, right) -> left + ", " + right).orElse("Sem responsáveis");
    ApiDateTimeDto startAt = brazilDateTimeMapper.toDateTime(card.getStartAt());
    ApiDateTimeDto dueAt = brazilDateTimeMapper.toDateTime(card.getDueAt());
    String startText = startAt == null ? "" : startAt.text();
    String dueText = dueAt == null ? "" : dueAt.text();
    String description = card.getDescription() == null || card.getDescription().isBlank()
        ? "Sem descrição."
        : card.getDescription();
    String safeCardUrl = GmailMimeSupport.htmlEscape(cardUrl);

    String textBody = """
        Olá,

        %s atribuiu uma tarefa a você no plano %s.

        Tarefa: %s
        Tipo: %s
        Responsáveis: %s
        Início: %s
        Prazo: %s

        Descrição:
        %s

        Abrir tarefa no Plan Things:
        %s
        """.formatted(senderName, plan.getName(), card.getTitle(), kindLabel, assigneeNames, emptyDash(startText), emptyDash(dueText), description, cardUrl);

    String htmlBody = renderCardInboxTemplate(
        GmailMimeSupport.htmlEscape(senderName),
        GmailMimeSupport.htmlEscape(plan.getName()),
        GmailMimeSupport.htmlEscape(card.getTitle()),
        GmailMimeSupport.htmlEscape(kindLabel),
        GmailMimeSupport.htmlEscape(assigneeNames),
        GmailMimeSupport.htmlEscape(emptyDash(startText)),
        GmailMimeSupport.htmlEscape(emptyDash(dueText)),
        GmailMimeSupport.htmlEscape(description).replace("\n", "<br>"),
        safeCardUrl,
        safeCardUrl.replace("/workspace/board/", "/workspace/<br>board/")
    );

    return String.join("\r\n",
        "From: " + GmailMimeSupport.headerValue(senderEmail),
        "To: " + GmailMimeSupport.headerValue(String.join(", ", recipientEmails)),
        "Subject: " + GmailMimeSupport.encodedHeader(subject),
        "MIME-Version: 1.0",
        "Content-Type: multipart/alternative; boundary=\"" + boundary + "\"",
        "",
        "--" + boundary,
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        GmailMimeSupport.encodedBody(textBody),
        "--" + boundary,
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        GmailMimeSupport.encodedBody(htmlBody),
        "--" + boundary + "--",
        ""
    );
  }

  private String kindLabel(BoardService.CardKind kind) {
    if (kind == BoardService.CardKind.EVENTO) return "Evento";
    if (kind == BoardService.CardKind.TAREFA) return "Tarefa";
    return "Cartão";
  }

  private String emptyDash(String value) {
    return value == null || value.isBlank() ? "-" : value;
  }

  private String normalizeFrontendBaseUrl(String value) {
    String normalized = value == null ? "" : value.trim();
    if (normalized.isBlank()) {
      throw new IllegalArgumentException("app.frontend-base-url must be configured.");
    }
    return normalized.replaceAll("/+$", "");
  }

  private static String renderCardInboxTemplate(
      String safeSenderName,
      String safePlanName,
      String safeCardTitle,
      String safeKindLabel,
      String safeAssigneeNames,
      String safeStartText,
      String safeDueText,
      String safeDescription,
      String safeCardUrl,
      String safeCardUrlDisplay
  ) {
    return CARD_INBOX_TEMPLATE
        .replace("{{SENDER_NAME}}", safeSenderName)
        .replace("{{PLAN_NAME}}", safePlanName)
        .replace("{{CARD_TITLE}}", safeCardTitle)
        .replace("{{KIND_LABEL}}", safeKindLabel)
        .replace("{{ASSIGNEE_NAMES}}", safeAssigneeNames)
        .replace("{{START_AT}}", safeStartText)
        .replace("{{DUE_AT}}", safeDueText)
        .replace("{{DESCRIPTION}}", safeDescription)
        .replace("{{CARD_URL}}", safeCardUrl)
        .replace("{{CARD_URL_DISPLAY}}", safeCardUrlDisplay);
  }

  private static String loadCardInboxTemplate() {
    try {
      return new ClassPathResource("templates/email/board-card-inbox.html")
          .getContentAsString(StandardCharsets.UTF_8);
    } catch (IOException exception) {
      throw new UncheckedIOException("Could not load board card inbox email template.", exception);
    }
  }

  public record Delivery(boolean emailSent, String sentFrom, List<String> sentTo, String messageId, String threadId) {
  }
}
