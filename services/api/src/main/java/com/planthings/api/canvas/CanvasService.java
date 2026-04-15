package com.planthings.api.canvas;

import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.error.ConflictException;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import com.planthings.api.plans.PlanAccessService;
import com.planthings.api.plans.PlanEntity;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CanvasService {

  private static final String EMPTY_DOCUMENT = "{\"cards\":[],\"connections\":[],\"pan\":{\"x\":60,\"y\":40},\"zoom\":1}";

  private final CanvasDocumentRepository canvasDocumentRepository;
  private final PlanAccessService planAccessService;
  private final AuthenticatedUserService authenticatedUserService;
  private final BrazilDateTimeMapper brazilDateTimeMapper;

  public CanvasService(
      CanvasDocumentRepository canvasDocumentRepository,
      PlanAccessService planAccessService,
      AuthenticatedUserService authenticatedUserService,
      BrazilDateTimeMapper brazilDateTimeMapper
  ) {
    this.canvasDocumentRepository = canvasDocumentRepository;
    this.planAccessService = planAccessService;
    this.authenticatedUserService = authenticatedUserService;
    this.brazilDateTimeMapper = brazilDateTimeMapper;
  }

  public CanvasDocumentView getCanvas(UUID planId) {
    UUID userId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, userId);

    CanvasDocumentEntity document = canvasDocumentRepository.findByPlanId(planId).orElseGet(() -> {
      CanvasDocumentEntity empty = new CanvasDocumentEntity();
      empty.setPlanId(planId);
      empty.setUpdatedByUserId(userId);
      empty.setVersionNumber(0L);
      empty.setDocumentJson(EMPTY_DOCUMENT);
      return canvasDocumentRepository.save(empty);
    });

    return toView(document);
  }

  @Transactional
  public CanvasDocumentView saveCanvas(UUID planId, Long expectedVersion, String documentJson) {
    UUID userId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, userId);

    CanvasDocumentEntity document = canvasDocumentRepository.findByPlanId(plan.getId()).orElseGet(() -> {
      CanvasDocumentEntity created = new CanvasDocumentEntity();
      created.setPlanId(plan.getId());
      created.setUpdatedByUserId(userId);
      created.setVersionNumber(0L);
      created.setDocumentJson(EMPTY_DOCUMENT);
      return created;
    });

    if (expectedVersion != null && !expectedVersion.equals(document.getVersionNumber())) {
      throw new ConflictException("VERSAO_DESATUALIZADA", "O canvas foi atualizado em outra sessao. Atualize a tela e tente novamente.");
    }

    document.setUpdatedByUserId(userId);
    document.setVersionNumber(document.getVersionNumber() + 1);
    document.setDocumentJson(documentJson == null || documentJson.isBlank() ? EMPTY_DOCUMENT : documentJson);
    canvasDocumentRepository.save(document);
    return toView(document);
  }

  private CanvasDocumentView toView(CanvasDocumentEntity document) {
    return new CanvasDocumentView(
        document.getPlanId(),
        document.getVersionNumber(),
        document.getDocumentJson(),
        brazilDateTimeMapper.toDateTime(document.getUpdatedAt())
    );
  }

  public record CanvasDocumentView(
      UUID planId,
      long version,
      String documentJson,
      ApiDateTimeDto updatedAt
  ) {
  }
}
