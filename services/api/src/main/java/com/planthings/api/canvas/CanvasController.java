package com.planthings.api.canvas;

import com.planthings.api.common.api.ApiEnvelope;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/plans/{planId}/canvas")
public class CanvasController {

  private final CanvasService canvasService;

  public CanvasController(CanvasService canvasService) {
    this.canvasService = canvasService;
  }

  @GetMapping
  public ApiEnvelope<CanvasService.CanvasDocumentView> getCanvas(@PathVariable UUID planId) {
    return ApiEnvelope.ok(canvasService.getCanvas(planId));
  }

  @PutMapping
  public ApiEnvelope<CanvasService.CanvasDocumentView> saveCanvas(@PathVariable UUID planId, @RequestBody SaveCanvasRequest request) {
    return ApiEnvelope.ok(canvasService.saveCanvas(planId, request.expectedVersion(), request.documentJson()));
  }

  public record SaveCanvasRequest(Long expectedVersion, String documentJson) {
  }
}
