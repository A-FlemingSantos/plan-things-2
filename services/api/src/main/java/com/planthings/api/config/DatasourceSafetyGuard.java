package com.planthings.api.config;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.core.env.Environment;

public final class DatasourceSafetyGuard {

  private static final Pattern DATABASE_NAME_PATTERN = Pattern.compile("(?i)(?:^|;)databaseName=([^;]+)");
  private static final Set<String> FORBIDDEN_DATABASES = Set.of("master", "plan_things_test");

  private DatasourceSafetyGuard() {
  }

  public static void validate(Environment environment) {
    if (isTestProfile(environment)) {
      return;
    }

    String datasourceUrl = environment.getProperty("spring.datasource.url", "");
    String databaseName = extractDatabaseName(datasourceUrl);

    if (databaseName == null || databaseName.isBlank()) {
      return;
    }

    String normalizedDatabaseName = databaseName.trim().toLowerCase(Locale.ROOT);
    if (!FORBIDDEN_DATABASES.contains(normalizedDatabaseName)) {
      return;
    }

    throw new IllegalStateException(
        "Inicializacao bloqueada: o backend fora do profile de teste nao pode usar a base '"
            + databaseName
            + "'. Configure 'spring.datasource.url' para a base oficial da aplicacao."
    );
  }

  public static String extractDatabaseName(String datasourceUrl) {
    if (datasourceUrl == null || datasourceUrl.isBlank()) {
      return null;
    }

    Matcher matcher = DATABASE_NAME_PATTERN.matcher(datasourceUrl);
    if (!matcher.find()) {
      return null;
    }

    return matcher.group(1);
  }

  private static boolean isTestProfile(Environment environment) {
    return Arrays.stream(environment.getActiveProfiles())
        .map(profile -> profile.toLowerCase(Locale.ROOT))
        .anyMatch("test"::equals);
  }
}
