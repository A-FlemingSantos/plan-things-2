package com.planthings.api.settings;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

public final class GmailMimeSupport {

  private GmailMimeSupport() {
  }

  public static String encodeMimeMessage(String mimeMessage) {
    return Base64.getUrlEncoder().withoutPadding().encodeToString(mimeMessage.getBytes(StandardCharsets.UTF_8));
  }

  public static String encodedHeader(String value) {
    return "=?UTF-8?B?" + Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8)) + "?=";
  }

  public static String encodedBody(String value) {
    byte[] lineSeparator = "\r\n".getBytes(StandardCharsets.US_ASCII);
    return Base64.getMimeEncoder(76, lineSeparator).encodeToString(value.getBytes(StandardCharsets.UTF_8));
  }

  public static String headerValue(String value) {
    return (value == null ? "" : value).replace("\r", "").replace("\n", "");
  }

  public static String htmlEscape(String value) {
    return (value == null ? "" : value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;");
  }
}
