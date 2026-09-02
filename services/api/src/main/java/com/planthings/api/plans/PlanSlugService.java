package com.planthings.api.plans;

import java.text.Normalizer;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class PlanSlugService {

  private static final int MAX_BASE_LENGTH = 80;

  private final PlanRepository planRepository;

  public PlanSlugService(PlanRepository planRepository) {
    this.planRepository = planRepository;
  }

  public String allocateSlug(String name) {
    String base = slugify(name);
    if (base.isBlank()) {
      base = "plano";
    }

    if (!planRepository.existsBySlugIgnoreCase(base)) {
      return base;
    }

    int suffix = 2;
    while (planRepository.existsBySlugIgnoreCase(base + "-" + suffix)) {
      suffix += 1;
    }
    return base + "-" + suffix;
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
}
