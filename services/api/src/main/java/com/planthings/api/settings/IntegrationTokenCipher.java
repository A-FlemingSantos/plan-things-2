package com.planthings.api.settings;

import com.planthings.api.common.error.BadRequestException;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class IntegrationTokenCipher {

  private static final String VERSION = "v1";
  private static final int KEY_BYTES = 32;
  private static final int IV_BYTES = 12;
  private static final int TAG_BITS = 128;

  private final String tokenKeyBase64;
  private final SecureRandom secureRandom = new SecureRandom();

  public IntegrationTokenCipher(@Value("${app.integrations.token-key-base64:}") String tokenKeyBase64) {
    this.tokenKeyBase64 = tokenKeyBase64;
  }

  public String encrypt(String plaintext) {
    byte[] key = requireKey();
    byte[] iv = new byte[IV_BYTES];
    secureRandom.nextBytes(iv);

    try {
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(TAG_BITS, iv));
      byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
      return VERSION + ":"
          + Base64.getUrlEncoder().withoutPadding().encodeToString(iv) + ":"
          + Base64.getUrlEncoder().withoutPadding().encodeToString(ciphertext);
    } catch (Exception exception) {
      throw new BadRequestException("INTEGRACAO_TOKEN_CRIPTO_FALHOU", "Nao foi possivel proteger o token da integracao.");
    }
  }

  public String decrypt(String ciphertext) {
    byte[] key = requireKey();
    String[] parts = ciphertext == null ? new String[0] : ciphertext.split(":", 3);
    if (parts.length != 3 || !VERSION.equals(parts[0])) {
      throw new BadRequestException("INTEGRACAO_TOKEN_CRIPTO_FALHOU", "Nao foi possivel recuperar o token da integracao.");
    }

    try {
      byte[] iv = Base64.getUrlDecoder().decode(parts[1]);
      byte[] encrypted = Base64.getUrlDecoder().decode(parts[2]);
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(TAG_BITS, iv));
      return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
    } catch (Exception exception) {
      throw new BadRequestException("INTEGRACAO_TOKEN_CRIPTO_FALHOU", "Nao foi possivel recuperar o token da integracao.");
    }
  }

  private byte[] requireKey() {
    if (!StringUtils.hasText(tokenKeyBase64)) {
      throw new BadRequestException("INTEGRACAO_TOKEN_KEY_AUSENTE", "A chave de criptografia das integracoes nao foi configurada.");
    }

    try {
      byte[] key = Base64.getDecoder().decode(tokenKeyBase64);
      if (key.length != KEY_BYTES) {
        throw new IllegalArgumentException("invalid key size");
      }
      return key;
    } catch (IllegalArgumentException exception) {
      throw new BadRequestException("INTEGRACAO_TOKEN_KEY_AUSENTE", "A chave de criptografia das integracoes nao foi configurada corretamente.");
    }
  }
}
