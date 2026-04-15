package com.planthings.api.calendar;

import com.planthings.api.common.api.ApiEnvelope;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/calendar/events")
public class CalendarController {

  private final CalendarService calendarService;

  public CalendarController(CalendarService calendarService) {
    this.calendarService = calendarService;
  }

  @GetMapping
  public ApiEnvelope<List<CalendarService.EventSummary>> listEvents(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
  ) {
    return ApiEnvelope.ok(calendarService.listEvents(from, to));
  }

  @PostMapping
  public ApiEnvelope<CalendarService.EventSummary> createEvent(@Valid @RequestBody UpsertEventRequest request) {
    return ApiEnvelope.ok(calendarService.createStandaloneEvent(
        request.title(),
        request.description(),
        request.location(),
        request.startsAt(),
        request.endsAt()
    ));
  }

  @PatchMapping("/{eventId}")
  public ApiEnvelope<CalendarService.EventSummary> updateEvent(@PathVariable UUID eventId, @Valid @RequestBody UpsertEventRequest request) {
    return ApiEnvelope.ok(calendarService.updateStandaloneEvent(
        eventId,
        request.title(),
        request.description(),
        request.location(),
        request.startsAt(),
        request.endsAt()
    ));
  }

  @DeleteMapping("/{eventId}")
  public ApiEnvelope<CalendarService.MessageResponse> deleteEvent(@PathVariable UUID eventId) {
    return ApiEnvelope.ok(calendarService.deleteStandaloneEvent(eventId));
  }

  public record UpsertEventRequest(
      @NotBlank(message = "O titulo do evento e obrigatorio.") String title,
      String description,
      String location,
      OffsetDateTime startsAt,
      OffsetDateTime endsAt
  ) {
  }
}
