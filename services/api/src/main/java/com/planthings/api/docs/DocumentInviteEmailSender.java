package com.planthings.api.docs;

import com.planthings.api.auth.UserEntity;

public interface DocumentInviteEmailSender {
  Delivery sendInvite(UserEntity inviter, String invitedEmail, String documentTitle, String inviteUrl);

  record Delivery(boolean emailSent, String sentTo, String sentFrom) {
  }
}
