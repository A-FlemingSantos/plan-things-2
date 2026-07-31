package com.planthings.api.github;

import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.NotFoundException;
import com.planthings.api.settings.GitHubConnectionEntity;
import com.planthings.api.settings.GitHubConnectionRepository;
import com.planthings.api.settings.IntegrationTokenCipher;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GitHubAccessTokenService {

  private final GitHubConnectionRepository connectionRepository;
  private final IntegrationTokenCipher tokenCipher;

  public GitHubAccessTokenService(GitHubConnectionRepository connectionRepository, IntegrationTokenCipher tokenCipher) {
    this.connectionRepository = connectionRepository;
    this.tokenCipher = tokenCipher;
  }

  @Transactional(readOnly = true)
  public String requireActiveAccessToken(UUID userId) {
    GitHubConnectionEntity connection = connectionRepository.findByUserId(userId)
        .filter(this::isConnected)
        .orElseThrow(() -> new BadRequestException("GITHUB_NAO_CONECTADO", "Conecte sua conta GitHub em Configuracoes antes de continuar."));
    return tokenCipher.decrypt(connection.getEncryptedAccessToken());
  }

  @Transactional(readOnly = true)
  public GitHubConnectionEntity requireActiveConnection(UUID userId) {
    return connectionRepository.findByUserId(userId)
        .filter(this::isConnected)
        .orElseThrow(() -> new BadRequestException("GITHUB_NAO_CONECTADO", "Conecte sua conta GitHub em Configuracoes antes de continuar."));
  }

  @Transactional(readOnly = true)
  public GitHubConnectionEntity findConnection(UUID userId) {
    return connectionRepository.findByUserId(userId).orElse(null);
  }

  @Transactional(readOnly = true)
  public boolean isConnected(UUID userId) {
    GitHubConnectionEntity connection = connectionRepository.findByUserId(userId).orElse(null);
    return isConnected(connection);
  }

  private boolean isConnected(GitHubConnectionEntity connection) {
    return connection != null && connection.getRevokedAt() == null;
  }

  @Transactional
  public void rememberFailure(UUID userId, String errorCode) {
    GitHubConnectionEntity connection = connectionRepository.findByUserId(userId).orElse(null);
    if (connection == null) {
      return;
    }
    connection.setLastError(errorCode);
    connectionRepository.save(connection);
  }

  @Transactional
  public GitHubConnectionEntity requireConnectionEntity(UUID userId) {
    return connectionRepository.findByUserId(userId)
        .orElseThrow(() -> new NotFoundException("GITHUB_NAO_CONECTADO", "Nao encontramos uma conexao GitHub para este usuario."));
  }
}
