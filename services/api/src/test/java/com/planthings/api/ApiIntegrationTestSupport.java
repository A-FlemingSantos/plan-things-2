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

  private static final String SQL_SERVER_HOST = "localhost:1433";
  private static final String SQL_SERVER_USER = "sa";
  private static final String SQL_SERVER_PASSWORD = "sa-9MNP6LI";
  private static final String TEST_DATABASE_NAME = "plan_things_test_" + System.currentTimeMillis();

  @Autowired
  protected MockMvc mockMvc;

  @Autowired
  protected ObjectMapper objectMapper;

  @DynamicPropertySource
  static void registerTestDatabaseProperties(DynamicPropertyRegistry registry) {
    ensureTestDatabaseExists();

    String jdbcUrl = "jdbc:sqlserver://" + SQL_SERVER_HOST
        + ";databaseName=" + TEST_DATABASE_NAME
        + ";encrypt=false;trustServerCertificate=true";

    registry.add("spring.datasource.url", () -> jdbcUrl);
    registry.add("spring.datasource.username", () -> SQL_SERVER_USER);
    registry.add("spring.datasource.password", () -> SQL_SERVER_PASSWORD);
  }

  private static void ensureTestDatabaseExists() {
    String masterJdbcUrl = "jdbc:sqlserver://" + SQL_SERVER_HOST
        + ";databaseName=master;encrypt=false;trustServerCertificate=true";

    try (Connection connection = DriverManager.getConnection(masterJdbcUrl, SQL_SERVER_USER, SQL_SERVER_PASSWORD);
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

  protected JsonNode readJson(MvcResult result) throws Exception {
    return objectMapper.readTree(result.getResponse().getContentAsString());
  }
}
