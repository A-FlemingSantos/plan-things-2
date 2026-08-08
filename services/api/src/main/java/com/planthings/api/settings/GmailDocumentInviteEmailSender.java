package com.planthings.api.settings;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.docs.DocumentInviteEmailSender;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class GmailDocumentInviteEmailSender implements DocumentInviteEmailSender {

  private final GmailMessageSender gmailMessageSender;

  public GmailDocumentInviteEmailSender(GmailMessageSender gmailMessageSender) {
    this.gmailMessageSender = gmailMessageSender;
  }

  @Override
  public Delivery sendInvite(UserEntity inviter, String invitedEmail, String documentTitle, String inviteUrl) {
    GmailMessageSender.Delivery delivery = gmailMessageSender.send(
        inviter,
        senderEmail -> GmailMimeSupport.encodeMimeMessage(
            inviteMime(senderEmail, invitedEmail, inviter.getFullName(), documentTitle, inviteUrl)
        )
    );
    return new Delivery(true, invitedEmail, delivery.sentFrom());
  }

  private String inviteMime(
      String senderEmail,
      String invitedEmail,
      String inviterName,
      String documentTitle,
      String inviteUrl
  ) {
    String boundary = "planthings-doc-" + UUID.randomUUID();
    String text = """
        Olá,

        %s convidou você para colaborar no documento “%s” no Plan Things.

        Aceite o convite:
        %s
        """.formatted(inviterName, documentTitle, inviteUrl);

    return String.join("\r\n",
        "From: " + GmailMimeSupport.headerValue(senderEmail),
        "To: " + GmailMimeSupport.headerValue(invitedEmail),
        "Subject: " + GmailMimeSupport.encodedHeader("Convite para o documento " + documentTitle + " - Plan Things"),
        "MIME-Version: 1.0",
        "Content-Type: multipart/alternative; boundary=\"" + boundary + "\"",
        "",
        "--" + boundary,
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        GmailMimeSupport.encodedBody(text),
        "--" + boundary + "--",
        ""
    );
  }
}
