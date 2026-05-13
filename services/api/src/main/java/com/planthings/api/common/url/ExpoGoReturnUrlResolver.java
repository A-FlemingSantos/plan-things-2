package com.planthings.api.common.url;

import java.net.URI;

public final class ExpoGoReturnUrlResolver {

  private ExpoGoReturnUrlResolver() {
  }

  public static URI forOAuthCallback(URI uri) {
    return ensureExpoGoPath(uri, "/oauth/callback");
  }

  public static URI forSettingsReturn(URI uri) {
    return ensureExpoGoPath(uri, "/settings");
  }

  private static URI ensureExpoGoPath(URI uri, String route) {
    if (uri == null) {
      return null;
    }

    String scheme = uri.getScheme();
    if (scheme == null || (!"exp".equalsIgnoreCase(scheme) && !"exps".equalsIgnoreCase(scheme))) {
      return uri;
    }

    String raw = uri.toString();
    int fragmentIndex = raw.indexOf('#');
    String fragment = fragmentIndex >= 0 ? raw.substring(fragmentIndex) : "";
    String withoutFragment = fragmentIndex >= 0 ? raw.substring(0, fragmentIndex) : raw;

    int queryIndex = withoutFragment.indexOf('?');
    String query = queryIndex >= 0 ? withoutFragment.substring(queryIndex) : "";
    String base = queryIndex >= 0 ? withoutFragment.substring(0, queryIndex) : withoutFragment;

    String expectedSuffix = "/--" + route;
    if (!base.endsWith(expectedSuffix)) {
      base = trimTrailingSlash(base) + expectedSuffix;
    }

    return URI.create(base + query + fragment);
  }

  private static String trimTrailingSlash(String value) {
    if (value.endsWith("/")) {
      return value.substring(0, value.length() - 1);
    }
    return value;
  }
}
