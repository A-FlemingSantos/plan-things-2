package com.planthings.api.settings;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.plans.PlanInviteEmailSender;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class GmailPlanInviteEmailSender implements PlanInviteEmailSender {

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
    String expiresText = expiresAt == null ? "" : expiresAt.text();
    String safeExpiresText = GmailMimeSupport.htmlEscape(expiresText);

    String textBody = """
        Olá,

        %s convidou você para participar do plano %s no Plan Things.

        Acesse o convite:
        %s

        Este convite expira em %s.
        """.formatted(inviterName, planName, inviteUrl, expiresText);

    String htmlBody = """
        <!doctype html>
        <html>
          <body style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
            <p>Olá,</p>
            <p><strong>%s</strong> convidou você para participar do plano <strong>%s</strong> no Plan Things.</p>
            <p>
              <a href="%s" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:6px">
                Aceitar convite
              </a>
            </p>
            <p>Ou acesse este link: <a href="%s">%s</a></p>
            <p style="color:#6b7280;font-size:13px">Este convite expira em %s.</p>
          </body>
        </html>
        """.formatted(safeInviterName, safePlanName, safeInviteUrl, safeInviteUrl, safeInviteUrl, safeExpiresText);

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

}
