package com.planthings.api.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.settings.GitHubIntegrationProperties;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
public class GitHubRestExecutor {

  private static final Logger logger = LoggerFactory.getLogger(GitHubRestExecutor.class);
  private static final Pattern LINK_NEXT = Pattern.compile("<([^>]+)>;\\s*rel=\"next\"");

  private final RestClient restClient;
  private final GitHubIntegrationProperties properties;
  private final ObjectMapper objectMapper;

  public GitHubRestExecutor(
      RestClient.Builder restClientBuilder,
      GitHubIntegrationProperties properties,
      ObjectMapper objectMapper
  ) {
    this.restClient = restClientBuilder.build();
    this.properties = properties;
    this.objectMapper = objectMapper;
  }

  public GitHubHttpResponse get(String accessToken, String path) {
    return get(accessToken, path, null);
  }

  public GitHubHttpResponse get(String accessToken, String path, String ifNoneMatch) {
    return exchange(accessToken, path, ifNoneMatch);
  }

  public GitHubHttpResponse postForm(String uri, HttpHeaders extraHeaders, Object body) {
    try {
      ResponseEntity<String> response = restClient.post()
          .uri(uri)
          .headers(headers -> {
            applyDefaultHeaders(headers, null, null);
            if (extraHeaders != null) {
              extraHeaders.forEach((key, values) -> values.forEach(value -> headers.add(key, value)));
            }
          })
          .contentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED)
          .body(body)
          .retrieve()
          .toEntity(String.class);
      return toHttpResponse(response);
    } catch (RestClientResponseException exception) {
      throw mapFailure(exception);
    } catch (RuntimeException exception) {
      logger.warn("GitHub POST request failed uri={}", uri, exception);
      throw new BadRequestException("GITHUB_API_FALHOU", "Nao foi possivel consultar o GitHub.");
    }
  }

  public JsonNode getJson(String accessToken, String path) {
    return get(accessToken, path).requireBody();
  }

  public JsonNode getJson(String accessToken, String path, String ifNoneMatch) {
    GitHubHttpResponse response = get(accessToken, path, ifNoneMatch);
    if (response.notModified()) {
      return null;
    }
    return response.requireBody();
  }

  public List<JsonNode> getAllPages(String accessToken, String path) {
    List<JsonNode> items = new ArrayList<>();
    String nextPath = path;
    while (StringUtils.hasText(nextPath)) {
      GitHubHttpResponse response = get(accessToken, nextPath);
      JsonNode body = response.requireBody();
      if (body.isArray()) {
        body.forEach(items::add);
      } else if (body.has("items") && body.path("items").isArray()) {
        body.path("items").forEach(items::add);
      } else {
        items.add(body);
      }
      nextPath = nextLinkPath(response.headers().getFirst(HttpHeaders.LINK));
    }
    return items;
  }

  public static List<String> parseGrantedScopes(String scopeHeader, String scopeBody) {
    List<String> scopes = new ArrayList<>();
    appendScopes(scopes, scopeHeader);
    appendScopes(scopes, scopeBody);
    return scopes.stream().map(value -> value.trim().toLowerCase(Locale.ROOT)).filter(StringUtils::hasText).distinct().toList();
  }

  public static void requireRepoScope(List<String> grantedScopes) {
    boolean hasRepo = grantedScopes.stream().anyMatch(scope -> "repo".equals(scope));
    if (!hasRepo) {
      throw new BadRequestException(
          "GITHUB_SCOPE_AUSENTE",
          "A conexao GitHub nao recebeu o escopo repo necessario para acessar repositorios privados."
      );
    }
  }

  private GitHubHttpResponse exchange(String accessToken, String path, String ifNoneMatch) {
    try {
      ResponseEntity<String> response = restClient.get()
          .uri(properties.getApiBaseUrl().resolve(path.startsWith("/") ? path : "/" + path))
          .headers(headers -> applyDefaultHeaders(headers, accessToken, ifNoneMatch))
          .retrieve()
          .toEntity(String.class);
      return toHttpResponse(response);
    } catch (RestClientResponseException exception) {
      throw mapFailure(exception);
    } catch (RuntimeException exception) {
      logger.warn("GitHub GET request failed path={}", path, exception);
      throw new BadRequestException("GITHUB_API_FALHOU", "Nao foi possivel consultar o GitHub.");
    }
  }

  private GitHubHttpResponse toHttpResponse(ResponseEntity<String> response) {
    int status = response.getStatusCode().value();
    HttpHeaders headers = response.getHeaders() == null ? new HttpHeaders() : response.getHeaders();
    if (status == 304) {
      return GitHubHttpResponse.notModified(headers);
    }
    if (status == 429) {
      throw rateLimitException(headers, status);
    }
    try {
      JsonNode body = objectMapper.readTree(response.getBody() == null ? "{}" : response.getBody());
      return new GitHubHttpResponse(status, body, headers, false);
    } catch (com.fasterxml.jackson.core.JsonProcessingException exception) {
      throw new BadRequestException("GITHUB_API_FALHOU", "Nao foi possivel consultar o GitHub.");
    }
  }

  private void applyDefaultHeaders(HttpHeaders headers, String accessToken, String ifNoneMatch) {
    if (StringUtils.hasText(accessToken)) {
      headers.setBearerAuth(accessToken);
    }
    headers.set(HttpHeaders.ACCEPT, "application/vnd.github+json");
    headers.set("X-GitHub-Api-Version", properties.getApiVersion());
    headers.set(HttpHeaders.USER_AGENT, properties.getUserAgent());
    if (StringUtils.hasText(ifNoneMatch)) {
      headers.set(HttpHeaders.IF_NONE_MATCH, ifNoneMatch);
    }
  }

  private BadRequestException mapFailure(RestClientResponseException exception) {
    HttpHeaders headers = exception.getResponseHeaders() == null ? new HttpHeaders() : exception.getResponseHeaders();
    int status = exception.getStatusCode().value();
    String body = exception.getResponseBodyAsString();
    String normalized = (body + " " + status).toLowerCase(Locale.ROOT);
    logger.warn("GitHub API failed status={} body={}", status, body);

    if (status == 403 && (normalized.contains("sso") || normalized.contains("saml"))) {
      return new BadRequestException("GITHUB_SSO_OBRIGATORIO", "Autorize o acesso SSO da organizacao no GitHub antes de continuar.");
    }
    String remaining = headers.getFirst("X-RateLimit-Remaining");
    boolean rateLimited = status == 429
        || (status == 403 && ("0".equals(remaining)
            || normalized.contains("rate limit")
            || normalized.contains("secondary rate")));
    if (rateLimited) {
      return rateLimitException(headers, status);
    }
    if (status == 401) {
      return new BadRequestException("GITHUB_TOKEN_REVOGADO", "A conexao GitHub foi revogada ou expirou.");
    }
    if (status == 403) {
      return new BadRequestException("GITHUB_ACESSO_NEGADO", "A conta conectada nao tem permissao para acessar este recurso no GitHub.");
    }
    if (status == 404) {
      return new BadRequestException("GITHUB_OBJETO_NAO_ENCONTRADO", "Nao encontramos o objeto informado no GitHub.");
    }
    return new BadRequestException("GITHUB_API_FALHOU", "Nao foi possivel consultar o GitHub.");
  }

  private static BadRequestException rateLimitException(HttpHeaders headers, int status) {
    long retryAfterSeconds = retryAfterSeconds(headers);
    String message = retryAfterSeconds > 0
        ? "O GitHub limitou temporariamente as consultas. Tente novamente em " + retryAfterSeconds + " segundos."
        : "O GitHub limitou temporariamente as consultas. Tente novamente em instantes.";
    BadRequestException exception = new BadRequestException(
        status == 429 ? "GITHUB_RATE_LIMIT" : "GITHUB_ACESSO_NEGADO",
        message
    );
    return exception;
  }

  private static long retryAfterSeconds(HttpHeaders headers) {
    String retryAfter = headers.getFirst(HttpHeaders.RETRY_AFTER);
    if (StringUtils.hasText(retryAfter)) {
      try {
        return Long.parseLong(retryAfter.trim());
      } catch (NumberFormatException ignored) {
        return 0L;
      }
    }

    String reset = headers.getFirst("X-RateLimit-Reset");
    if (StringUtils.hasText(reset)) {
      try {
        long resetEpoch = Long.parseLong(reset.trim());
        return Math.max(0L, resetEpoch - Instant.now().getEpochSecond());
      } catch (NumberFormatException ignored) {
        return 0L;
      }
    }
    return 0L;
  }

  private static void appendScopes(List<String> target, String rawScopes) {
    if (!StringUtils.hasText(rawScopes)) {
      return;
    }
    for (String scope : rawScopes.split("[,\\s]+")) {
      if (StringUtils.hasText(scope)) {
        target.add(scope.trim());
      }
    }
  }

  private static String nextLinkPath(String linkHeader) {
    if (!StringUtils.hasText(linkHeader)) {
      return null;
    }
    for (String part : linkHeader.split(",")) {
      Matcher matcher = LINK_NEXT.matcher(part.trim());
      if (matcher.find()) {
        URI uri = URI.create(matcher.group(1));
        return uri.getRawPath() + (uri.getRawQuery() == null ? "" : "?" + uri.getRawQuery());
      }
    }
    return null;
  }

  public record GitHubHttpResponse(int status, JsonNode body, HttpHeaders headers, boolean notModified) {

    public static GitHubHttpResponse notModified(HttpHeaders headers) {
      return new GitHubHttpResponse(304, null, headers, true);
    }

    public JsonNode requireBody() {
      if (notModified || body == null) {
        throw new BadRequestException("GITHUB_API_FALHOU", "Nao foi possivel consultar o GitHub.");
      }
      return body;
    }

    public String etag() {
      return headers == null ? null : headers.getFirst(HttpHeaders.ETAG);
    }
  }
}
