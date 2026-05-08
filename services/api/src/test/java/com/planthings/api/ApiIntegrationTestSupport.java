package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Sql(scripts = "/sql/cleanup.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
public abstract class ApiIntegrationTestSupport {

  private static final String DEFAULT_SQL_SERVER_HOST = "localhost:1433";
  private static final String DEFAULT_SQL_SERVER_USER = "sa";
  private static final String TEST_DATABASE_NAME = "plan_things_test_" + System.currentTimeMillis();

  @Autowired
  protected MockMvc mockMvc;

  @Autowired
  protected ObjectMapper objectMapper;

  @DynamicPropertySource
  static void registerTestDatabaseProperties(DynamicPropertyRegistry registry) {
    String sqlServerHost = sqlServerHost();
    String sqlServerUser = envOrDefault("TEST_SQL_SERVER_USERNAME", envOrDefault("SPRING_DATASOURCE_USERNAME", DEFAULT_SQL_SERVER_USER));
    String sqlServerPassword = requiredEnv("TEST_SQL_SERVER_PASSWORD", "SPRING_DATASOURCE_PASSWORD");

    ensureTestDatabaseExists(sqlServerHost, sqlServerUser, sqlServerPassword);

    String jdbcUrl = "jdbc:sqlserver://" + sqlServerHost
        + ";databaseName=" + TEST_DATABASE_NAME
        + ";encrypt=false;trustServerCertificate=true";

    registry.add("spring.datasource.url", () -> jdbcUrl);
    registry.add("spring.datasource.username", () -> sqlServerUser);
    registry.add("spring.datasource.password", () -> sqlServerPassword);
  }

  private static void ensureTestDatabaseExists(String sqlServerHost, String sqlServerUser, String sqlServerPassword) {
    String masterJdbcUrl = "jdbc:sqlserver://" + sqlServerHost
        + ";databaseName=master;encrypt=false;trustServerCertificate=true";

    try (Connection connection = DriverManager.getConnection(masterJdbcUrl, sqlServerUser, sqlServerPassword);
         Statement statement = connection.createStatement()) {
      statement.execute("""
          IF DB_ID('%s') IS NULL
          BEGIN
            CREATE DATABASE [%s]
          END
          """.formatted(TEST_DATABASE_NAME, TEST_DATABASE_NAME));
    } catch (Exception exception) {
      throw new IllegalStateException("Nao foi possivel preparar a base isolada de testes.", exception);
    }
  }

  private static String sqlServerHost() {
    String explicitHost = System.getenv("TEST_SQL_SERVER_HOST");
    if (hasText(explicitHost)) {
      return explicitHost;
    }

    String datasourceUrl = System.getenv("SPRING_DATASOURCE_URL");
    String parsedHost = sqlServerHostFromJdbcUrl(datasourceUrl);
    return hasText(parsedHost) ? parsedHost : DEFAULT_SQL_SERVER_HOST;
  }

  private static String sqlServerHostFromJdbcUrl(String datasourceUrl) {
    if (!hasText(datasourceUrl) || !datasourceUrl.startsWith("jdbc:sqlserver://")) {
      return null;
    }

    String withoutPrefix = datasourceUrl.substring("jdbc:sqlserver://".length());
    int paramsStart = withoutPrefix.indexOf(';');
    String host = paramsStart >= 0 ? withoutPrefix.substring(0, paramsStart) : withoutPrefix;
    return hasText(host) ? host : null;
  }

  private static String envOrDefault(String name, String defaultValue) {
    String value = System.getenv(name);
    return hasText(value) ? value : defaultValue;
  }

  private static String requiredEnv(String preferredName, String fallbackName) {
    String preferredValue = System.getenv(preferredName);
    if (hasText(preferredValue)) {
      return preferredValue;
    }

    String fallbackValue = System.getenv(fallbackName);
    if (hasText(fallbackValue)) {
      return fallbackValue;
    }

    throw new IllegalStateException(
        "Defina " + preferredName + " ou " + fallbackName + " para executar os testes de integracao com SQL Server."
    );
  }

  private static boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  protected String registerAndGetToken(String name, String email, String password) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "%s",
                  "email": "%s",
                  "password": "%s"
                }
                """.formatted(name, email, password)))
        .andExpect(status().isOk())
        .andReturn();

    return readJson(result).path("data").path("accessToken").asText();
  }

  protected JsonNode createPlan(String token, String name) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/plans")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "name": "%s",
                  "description": "Plano de teste"
                }
                """.formatted(name)))
        .andExpect(status().isOk())
        .andReturn();

    return readJson(result).path("data");
  }

  protected String createBoardColumn(String token, String planId, String title) throws Exception {
    JsonNode board = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/columns")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "%s",
                  "color": "#a0a0a0"
                }
                """.formatted(title)))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    for (JsonNode column : board.path("columns")) {
      if (title.equals(column.path("title").asText())) {
        return column.path("id").asText();
      }
    }

    throw new AssertionError("Coluna nao encontrada apos criacao: " + title);
  }

  protected JsonNode readJson(MvcResult result) throws Exception {
    return objectMapper.readTree(result.getResponse().getContentAsString());
  }
}
