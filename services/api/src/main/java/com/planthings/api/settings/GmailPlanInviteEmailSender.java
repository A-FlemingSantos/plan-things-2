package com.planthings.api.settings;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.plans.PlanInviteEmailSender;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

@Service
public class GmailPlanInviteEmailSender implements PlanInviteEmailSender {

  private static final String INVITE_TEMPLATE = loadInviteTemplate();

  private final GmailMessageSender gmailMessageSender;

  public GmailPlanInviteEmailSender(GmailMessageSender gmailMessageSender) {
    this.gmailMessageSender = gmailMessageSender;
  }

  @Override
  public Delivery sendInvite(
      UserEntity inviter,
      String invitedEmail,
      String planName,
      String inviteUrl,
      ApiDateTimeDto expiresAt
  ) {
    GmailMessageSender.Delivery delivery = gmailMessageSender.send(
        inviter,
        senderEmail -> GmailMimeSupport.encodeMimeMessage(buildInviteMime(senderEmail, invitedEmail, inviter.getFullName(), planName, inviteUrl, expiresAt))
    );
    return new Delivery(delivery.emailSent(), invitedEmail, delivery.sentFrom());
  }

  private String buildInviteMime(
      String senderEmail,
      String invitedEmail,
      String inviterName,
      String planName,
      String inviteUrl,
      ApiDateTimeDto expiresAt
  ) {
    String boundary = "planthings-" + UUID.randomUUID();
    String subject = "Convite para o plano " + planName + " - Plan Things";
    String safePlanName = GmailMimeSupport.htmlEscape(planName);
    String safeInviterName = GmailMimeSupport.htmlEscape(inviterName);
    String safeInviteUrl = GmailMimeSupport.htmlEscape(inviteUrl);
    String safeInviteUrlDisplay = safeInviteUrl.replace("/plans/invites/", "/plans/<br>invites/");
    String expiresText = expiresAt == null ? "" : expiresAt.text();
    String safeExpiresText = GmailMimeSupport.htmlEscape(expiresText);
    String inviterInitial = GmailMimeSupport.htmlEscape(inviterName == null || inviterName.isBlank()
        ? "P"
        : inviterName.substring(0, 1).toUpperCase());

    String textBody = """
        Olá,

        %s convidou você para participar do plano %s no Plan Things.

        Acesse o convite:
        %s

        Este convite expira em %s.
        """.formatted(inviterName, planName, inviteUrl, expiresText);

    String htmlBody = renderInviteTemplate(
        safePlanName,
        safeInviterName,
        inviterInitial,
        safeInviteUrl,
        safeInviteUrlDisplay,
        safeExpiresText
    );

    return String.join("\r\n",
        "From: " + GmailMimeSupport.headerValue(senderEmail),
        "To: " + GmailMimeSupport.headerValue(invitedEmail),
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

  private static String renderInviteTemplate(
      String safePlanName,
      String safeInviterName,
      String safeInviterInitial,
      String safeInviteUrl,
      String safeInviteUrlDisplay,
      String safeExpiresText
  ) {
    return INVITE_TEMPLATE
        .replace("{{PLAN_NAME}}", safePlanName)
        .replace("{{INVITER_NAME}}", safeInviterName)
        .replace("{{INVITER_INITIAL}}", safeInviterInitial)
        .replace("{{INVITE_URL}}", safeInviteUrl)
        .replace("{{INVITE_URL_DISPLAY}}", safeInviteUrlDisplay)
        .replace("{{EXPIRES_AT}}", safeExpiresText);
  }

  private static String loadInviteTemplate() {
    try {
      return new ClassPathResource("templates/email/plan-invite.html")
          .getContentAsString(StandardCharsets.UTF_8);
    } catch (IOException exception) {
      throw new UncheckedIOException("Could not load plan invite email template.", exception);
    }
  }

}
