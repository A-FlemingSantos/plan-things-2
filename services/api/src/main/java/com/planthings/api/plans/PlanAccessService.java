package com.planthings.api.plans;

import com.planthings.api.common.error.ForbiddenException;
import com.planthings.api.common.error.NotFoundException;
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

  public PlanEntity requirePlanMember(UUID planId, UUID userId) {
    PlanEntity plan = planRepository.findById(planId)
        .orElseThrow(() -> new NotFoundException("PLANO_NAO_ENCONTRADO", "Nao encontramos o plano informado."));

    if (!planMemberRepository.existsByPlanIdAndUserId(planId, userId)) {
      throw new ForbiddenException("ACESSO_AO_PLANO_NEGADO", "Voce nao faz parte deste plano.");
    }

    return plan;
  }

  public PlanEntity requirePlanManager(UUID planId, UUID userId) {
    PlanEntity plan = requirePlanMember(planId, userId);
    PlanMemberRole role = requireMemberRole(planId, userId);

    if (role != PlanMemberRole.OWNER && role != PlanMemberRole.ADMIN) {
      throw new ForbiddenException("GESTAO_DO_PLANO_NEGADA", "Apenas owner ou admin podem executar esta acao.");
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
}
