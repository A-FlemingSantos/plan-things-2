package com.planthings.api.common.url;

import java.net.URI;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ExpoGoReturnUrlResolverTest {

  @Test
  void shouldAppendOAuthCallbackBeforeQueryStringForTunneledExpoGoUrl() {
    URI resolved = ExpoGoReturnUrlResolver.forOAuthCallback(
        URI.create("exp://u.expo.dev/12345678-abcd?channel-name=development&runtime-version=exposdk%3A52.0.0")
    );

    assertEquals(
        "exp://u.expo.dev/12345678-abcd/--/oauth/callback?channel-name=development&runtime-version=exposdk%3A52.0.0",
        resolved.toString()
    );
  }

  @Test
  void shouldAppendSettingsReturnBeforeQueryStringForTunneledExpoGoUrl() {
    URI resolved = ExpoGoReturnUrlResolver.forSettingsReturn(
        URI.create("exp://u.expo.dev/12345678-abcd?channel-name=development&runtime-version=exposdk%3A52.0.0")
    );

    assertEquals(
        "exp://u.expo.dev/12345678-abcd/--/settings?channel-name=development&runtime-version=exposdk%3A52.0.0",
        resolved.toString()
    );
  }

  @Test
  void shouldKeepAlreadyNormalizedExpoGoUrls() {
    URI resolved = ExpoGoReturnUrlResolver.forOAuthCallback(
        URI.create("exp://192.168.0.15:8082/--/oauth/callback")
    );

    assertEquals("exp://192.168.0.15:8082/--/oauth/callback", resolved.toString());
  }

  @Test
  void shouldLeaveNonExpoUrlsUntouched() {
    URI resolved = ExpoGoReturnUrlResolver.forOAuthCallback(
        URI.create("planthings://oauth/callback")
    );

    assertEquals("planthings://oauth/callback", resolved.toString());
  }
}
