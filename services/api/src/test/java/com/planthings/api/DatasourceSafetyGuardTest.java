package com.planthings.api;

import com.planthings.api.config.DatasourceSafetyGuard;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DatasourceSafetyGuardTest {

  @Test
  void shouldAllowOfficialApplicationDatabaseOutsideTestProfile() {
    MockEnvironment environment = new MockEnvironment()
        .withProperty("spring.datasource.url", "jdbc:sqlserver://localhost:1433;databaseName=plan_things_db;encrypt=false");

    assertDoesNotThrow(() -> DatasourceSafetyGuard.validate(environment));
  }

  @Test
  void shouldBlockInvalidDatabaseOutsideTestProfile() {
    MockEnvironment environment = new MockEnvironment()
        .withProperty("spring.datasource.url", "jdbc:sqlserver://localhost:1433;databaseName=master;encrypt=false");

    IllegalStateException exception = assertThrows(IllegalStateException.class,
        () -> DatasourceSafetyGuard.validate(environment));

    assertEquals(
        "Inicializacao bloqueada: fora do profile de teste, o backend deve usar exclusivamente a base 'plan_things_db'. Base recebida: 'master'.",
        exception.getMessage()
    );
  }

  @Test
  void shouldBlockWhenDatabaseNameIsMissingOutsideTestProfile() {
    MockEnvironment environment = new MockEnvironment()
        .withProperty("spring.datasource.url", "jdbc:sqlserver://localhost:1433;encrypt=false");

    IllegalStateException exception = assertThrows(IllegalStateException.class,
        () -> DatasourceSafetyGuard.validate(environment));

    assertEquals(
        "Inicializacao bloqueada: fora do profile de teste, o datasource deve informar o parametro 'databaseName' e usar exclusivamente a base oficial da aplicacao.",
        exception.getMessage()
    );
  }

  @Test
  void shouldAllowAnyDatabaseDuringTestProfile() {
    MockEnvironment environment = new MockEnvironment()
        .withProperty("spring.datasource.url", "jdbc:sqlserver://localhost:1433;databaseName=plan_things_test;encrypt=false");
    environment.setActiveProfiles("test");

    assertDoesNotThrow(() -> DatasourceSafetyGuard.validate(environment));
  }

  @Test
  void shouldExtractDatabaseNameFromSqlServerUrl() {
    assertEquals(
        "plan_things_db",
        DatasourceSafetyGuard.extractDatabaseName("jdbc:sqlserver://localhost:1433;databaseName=plan_things_db;encrypt=false")
    );
  }
}
