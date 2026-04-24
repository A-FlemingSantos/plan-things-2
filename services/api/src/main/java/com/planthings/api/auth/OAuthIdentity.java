package com.planthings.api.auth;

public record OAuthIdentity(
    String provider,
    String providerSubject,
    String email,
    boolean emailVerified,
    boolean emailAutoLinkTrusted,
    String displayName,
    String avatarUrl
) {
}
