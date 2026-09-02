package com.planthings.api.plans;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.function.Predicate;
import org.springframework.stereotype.Component;

@Component
public class PlanSlugService {

  private static final int MAX_BASE_LENGTH = 80;

  private final PlanRepository planRepository;

  public PlanSlugService(PlanRepository planRepository) {
    this.planRepository = planRepository;
  }

  public String allocateSlug(String name) {
    return allocateSlug(name, planRepository::existsBySlugIgnoreCase);
  }

  static String allocateSlug(String name, Predicate<String> slugTaken) {
    String base = slugify(name);
    if (base.isBlank()) {
      base = "plano";
    }

    if (!slugTaken.test(base)) {
      return base;
    }

    int suffix = 2;
    while (slugTaken.test(base + "-" + suffix)) {
      suffix += 1;
    }
    return base + "-" + suffix;
  }

  public static boolean isLegacyCompactUuidSlug(UUID id, String slug) {
    if (id == null || slug == null || slug.isBlank()) {
      return false;
    }
    return id.toString().replace("-", "").equalsIgnoreCase(slug.trim());
  }

  public static List<LegacySlugRewrite> planLegacySlugRewrites(List<PlanSlugSnapshot> plans) {
    Set<String> taken = new HashSet<>();
    for (PlanSlugSnapshot plan : plans) {
      if (plan.slug() != null && !plan.slug().isBlank()) {
        taken.add(plan.slug().toLowerCase(Locale.ROOT));
      }
    }

    List<LegacySlugRewrite> rewrites = new ArrayList<>();
    for (PlanSlugSnapshot plan : plans) {
      if (!isLegacyCompactUuidSlug(plan.id(), plan.slug())) {
        continue;
      }

      taken.remove(plan.slug().trim().toLowerCase(Locale.ROOT));
      String next = allocateSlug(plan.name(), candidate -> taken.contains(candidate.toLowerCase(Locale.ROOT)));
      taken.add(next.toLowerCase(Locale.ROOT));
      rewrites.add(new LegacySlugRewrite(plan.id(), next));
    }
    return rewrites;
  }

  public static int rewriteLegacyCompactSlugs(Connection connection) throws SQLException {
    List<PlanSlugSnapshot> snapshots = new ArrayList<>();
    try (PreparedStatement select = connection.prepareStatement(
        "SELECT id, name, slug FROM plans ORDER BY created_at ASC");
         ResultSet resultSet = select.executeQuery()) {
      while (resultSet.next()) {
        snapshots.add(new PlanSlugSnapshot(
            readUuid(resultSet, "id"),
            resultSet.getString("name"),
            resultSet.getString("slug")
        ));
      }
    }

    List<LegacySlugRewrite> rewrites = planLegacySlugRewrites(snapshots);
    if (rewrites.isEmpty()) {
      return 0;
    }

    try (PreparedStatement update = connection.prepareStatement(
        "UPDATE plans SET slug = ?, updated_at = SYSDATETIMEOFFSET() WHERE id = ?")) {
      for (LegacySlugRewrite rewrite : rewrites) {
        update.setString(1, rewrite.slug());
        update.setObject(2, rewrite.id());
        update.addBatch();
      }
      update.executeBatch();
    }
    return rewrites.size();
  }

  static String slugify(String value) {
    if (value == null || value.isBlank()) {
      return "";
    }

    String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
        .replaceAll("\\p{M}+", "")
        .toLowerCase(Locale.ROOT)
        .replaceAll("[^a-z0-9]+", "-")
        .replaceAll("^-+|-+$", "");

    if (normalized.length() > MAX_BASE_LENGTH) {
      normalized = normalized.substring(0, MAX_BASE_LENGTH).replaceAll("-+$", "");
    }
    return normalized;
  }

  private static UUID readUuid(ResultSet resultSet, String column) throws SQLException {
    Object value = resultSet.getObject(column);
    if (value instanceof UUID uuid) {
      return uuid;
    }
    if (value instanceof String text) {
      return UUID.fromString(text);
    }
    throw new SQLException("Nao foi possivel ler o id do plano como UUID.");
  }

  public record PlanSlugSnapshot(UUID id, String name, String slug) {
  }

  public record LegacySlugRewrite(UUID id, String slug) {
  }
}
