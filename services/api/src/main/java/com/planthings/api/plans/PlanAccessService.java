package com.planthings.api.plans;

import com.planthings.api.common.error.ForbiddenException;
import com.planthings.api.common.error.NotFoundException;
import com.planthings.api.common.error.UnauthorizedException;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class PlanAccessService {

  private final PlanRepository planRepository;
  private final PlanMemberRepository planMemberRepository;

  public PlanAccessService(PlanRepository planRepository, PlanMemberRepository planMemberRepository) {
    this.planRepository = planRepository;
    this.planMemberRepository = planMemberRepository;
  }

  public PlanEntity requirePlan(UUID planId) {
    return planRepository.findById(planId)
        .orElseThrow(() -> new NotFoundException("PLANO_NAO_ENCONTRADO", "Nao encontramos o plano informado."));
  }

  public PlanEntity resolvePlan(String idOrSlug) {
    if (idOrSlug == null || idOrSlug.isBlank()) {
      throw new NotFoundException("PLANO_NAO_ENCONTRADO", "Nao encontramos o plano informado.");
    }

    String trimmed = idOrSlug.trim();
    try {
      return requirePlan(UUID.fromString(trimmed));
    } catch (IllegalArgumentException ignored) {
      return planRepository.findBySlugIgnoreCase(trimmed)
          .orElseThrow(() -> new NotFoundException("PLANO_NAO_ENCONTRADO", "Nao encontramos o plano informado."));
    }
  }

  public PlanEntity requirePlanViewer(UUID planId, UUID userId) {
    PlanEntity plan = requirePlan(planId);
    assertCanView(plan, userId);
    return plan;
  }

  public PlanEntity requirePlanMember(UUID planId, UUID userId) {
    PlanEntity plan = requirePlan(planId);
    requireMember(planId, userId);
    return plan;
  }

  public PlanEntity requirePlanEditor(UUID planId, UUID userId) {
    PlanEntity plan = requirePlanMember(planId, userId);
    PlanMemberRole role = requireMemberRole(planId, userId);
    if (!isEditor(role)) {
      throw new ForbiddenException("EDICAO_DO_PLANO_NEGADA", "Voce nao pode editar este plano.");
    }
    return plan;
  }

  public PlanEntity requirePlanManager(UUID planId, UUID userId) {
    PlanEntity plan = requirePlanMember(planId, userId);
    PlanMemberRole role = requireMemberRole(planId, userId);
    if (role != PlanMemberRole.ADMIN) {
      throw new ForbiddenException("GESTAO_DO_PLANO_NEGADA", "Apenas admins podem executar esta acao.");
    }
    return plan;
  }

  public PlanMemberEntity requireMember(UUID planId, UUID userId) {
    return planMemberRepository.findByPlanIdAndUserId(planId, userId)
        .orElseThrow(() -> new ForbiddenException("ACESSO_AO_PLANO_NEGADO", "Voce nao faz parte deste plano."));
  }

  public PlanMemberRole requireMemberRole(UUID planId, UUID userId) {
    return requireMember(planId, userId).getRole();
  }

  public Optional<PlanMemberRole> findMemberRole(UUID planId, UUID userId) {
    if (userId == null) {
      return Optional.empty();
    }
    return planMemberRepository.findByPlanIdAndUserId(planId, userId).map(PlanMemberEntity::getRole);
  }

  public boolean isCreator(PlanEntity plan, UUID userId) {
    return plan != null && userId != null && userId.equals(plan.getOwnerUserId());
  }

  public static boolean isEditor(PlanMemberRole role) {
    return role == PlanMemberRole.ADMIN || role == PlanMemberRole.MEMBER;
  }

  public static boolean isManager(PlanMemberRole role) {
    return role == PlanMemberRole.ADMIN;
  }

  private void assertCanView(PlanEntity plan, UUID userId) {
    if (plan.getVisibility() == PlanVisibility.PUBLIC) {
      return;
    }

    if (userId == null) {
      throw new UnauthorizedException("AUTENTICACAO_OBRIGATORIA", "Voce precisa estar autenticado para continuar.");
    }

    if (!planMemberRepository.existsByPlanIdAndUserId(plan.getId(), userId)) {
      throw new ForbiddenException("ACESSO_AO_PLANO_NEGADO", "Voce nao faz parte deste plano.");
    }
  }
}
