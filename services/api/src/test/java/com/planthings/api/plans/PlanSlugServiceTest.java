package com.planthings.api.plans;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PlanSlugServiceTest {

  @Test
  void slugifyStripsAccentsAndPunctuation() {
    assertEquals("meu-plano-publico", PlanSlugService.slugify("Meu Plano Público"));
    assertEquals("", PlanSlugService.slugify("   "));
  }

  @Test
  void allocateSlugFallsBackToPlanoAndSuffixesCollisions() {
    Set<String> taken = new HashSet<>();
    assertEquals("plano", PlanSlugService.allocateSlug("!!!", taken::contains));

    taken.add("plano");
    assertEquals("plano-2", PlanSlugService.allocateSlug("!!!", taken::contains));
  }

  @Test
  void detectsOnlyCompactUuidMatchingTheSamePlanId() {
    UUID id = UUID.fromString("8eec7f69-6bdb-4222-8b74-5f2e2f3f8264");
    assertTrue(PlanSlugService.isLegacyCompactUuidSlug(id, "8eec7f696bdb42228b745f2e2f3f8264"));
    assertFalse(PlanSlugService.isLegacyCompactUuidSlug(id, "meu-plano"));
    assertFalse(PlanSlugService.isLegacyCompactUuidSlug(id, id.toString()));
  }

  @Test
  void rewritesLegacySlugsFromNameWithStableCollisionSuffix() {
    UUID first = UUID.fromString("11111111-1111-1111-1111-111111111111");
    UUID second = UUID.fromString("22222222-2222-2222-2222-222222222222");
    UUID pretty = UUID.fromString("33333333-3333-3333-3333-333333333333");

    List<PlanSlugService.LegacySlugRewrite> rewrites = PlanSlugService.planLegacySlugRewrites(List.of(
        new PlanSlugService.PlanSlugSnapshot(first, "Meu Plano", compact(first)),
        new PlanSlugService.PlanSlugSnapshot(pretty, "Outro", "quadro-novo"),
        new PlanSlugService.PlanSlugSnapshot(second, "Meu Plano", compact(second))
    ));

    assertEquals(2, rewrites.size());
    assertEquals(first, rewrites.get(0).id());
    assertEquals("meu-plano", rewrites.get(0).slug());
    assertEquals(second, rewrites.get(1).id());
    assertEquals("meu-plano-2", rewrites.get(1).slug());
  }

  @Test
  void suffixesWhenNameSlugAlreadyTakenByANewerPlan() {
    UUID legacy = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    UUID existing = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    List<PlanSlugService.LegacySlugRewrite> rewrites = PlanSlugService.planLegacySlugRewrites(List.of(
        new PlanSlugService.PlanSlugSnapshot(existing, "Meu Plano", "meu-plano"),
        new PlanSlugService.PlanSlugSnapshot(legacy, "Meu Plano", compact(legacy))
    ));

    assertEquals(1, rewrites.size());
    assertEquals("meu-plano-2", rewrites.get(0).slug());
  }

  private static String compact(UUID id) {
    return id.toString().replace("-", "");
  }
}
