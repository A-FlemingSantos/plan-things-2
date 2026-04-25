package com.planthings.api.plans;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.common.api.ApiDateTimeDto;

public interface PlanInviteEmailSender {

  Delivery sendInvite(
      UserEntity inviter,
      String invitedEmail,
      String planName,
      String inviteUrl,
      ApiDateTimeDto expiresAt
  );

  record Delivery(boolean emailSent, String sentTo, String sentFrom) {
  }
}
