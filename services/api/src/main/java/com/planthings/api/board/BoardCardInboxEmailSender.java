package com.planthings.api.board;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import com.planthings.api.plans.PlanEntity;
import com.planthings.api.settings.GmailMessageSender;
import com.planthings.api.settings.GmailMimeSupport;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class BoardCardInboxEmailSender {

  private final GmailMessageSender gmailMessageSender;
  private final BrazilDateTimeMapper brazilDateTimeMapper;
  private final String frontendBaseUrl;

  public BoardCardInboxEmailSender(
      GmailMessageSender gmailMessageSender,
      BrazilDateTimeMapper brazilDateTimeMapper,
      @Value("${app.frontend-base-url:http://localhost:5173}") String frontendBaseUrl
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
    String subject = "[Plan Things] " + card.getTitle() + " - " + plan.getName();
    String cardUrl = frontendBaseUrl + "/workspace/board/" + plan.getId();
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

    String textBody = """
        Olá,

        %s enviou um cartão do plano %s pelo Plan Things.

        Cartão: %s
        Tipo: %s
        Responsáveis: %s
        Início: %s
        Prazo: %s

        Descrição:
        %s

        Abrir no Plan Things:
        %s
        """.formatted(senderName, plan.getName(), card.getTitle(), kindLabel, assigneeNames, emptyDash(startText), emptyDash(dueText), description, cardUrl);

    String htmlBody = """
        <!doctype html>
        <html>
          <body style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
            <p>Olá,</p>
            <p><strong>%s</strong> enviou um cartão do plano <strong>%s</strong> pelo Plan Things.</p>
            <table style="border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Cartão</td><td style="padding:4px 0"><strong>%s</strong></td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Tipo</td><td style="padding:4px 0">%s</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Responsáveis</td><td style="padding:4px 0">%s</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Início</td><td style="padding:4px 0">%s</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Prazo</td><td style="padding:4px 0">%s</td></tr>
            </table>
            <p style="white-space:pre-line">%s</p>
            <p>
              <a href="%s" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:6px">
                Abrir cartão no quadro
              </a>
            </p>
            <p style="color:#6b7280;font-size:13px">Ou acesse este link: <a href="%s">%s</a></p>
          </body>
        </html>
        """.formatted(
        GmailMimeSupport.htmlEscape(senderName),
        GmailMimeSupport.htmlEscape(plan.getName()),
        GmailMimeSupport.htmlEscape(card.getTitle()),
        GmailMimeSupport.htmlEscape(kindLabel),
        GmailMimeSupport.htmlEscape(assigneeNames),
        GmailMimeSupport.htmlEscape(emptyDash(startText)),
        GmailMimeSupport.htmlEscape(emptyDash(dueText)),
        GmailMimeSupport.htmlEscape(description),
        GmailMimeSupport.htmlEscape(cardUrl),
        GmailMimeSupport.htmlEscape(cardUrl),
        GmailMimeSupport.htmlEscape(cardUrl)
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
    String normalized = value == null || value.isBlank() ? "http://localhost:5173" : value.trim();
    return normalized.replaceAll("/+$", "");
  }

  public record Delivery(boolean emailSent, String sentFrom, List<String> sentTo, String messageId, String threadId) {
  }
}
