ALTER TABLE calendar_events DROP CONSTRAINT fk_calendar_events_plan;
ALTER TABLE calendar_events
  ADD CONSTRAINT fk_calendar_events_plan
  FOREIGN KEY (plan_id) REFERENCES plans (id);

ALTER TABLE calendar_events DROP CONSTRAINT fk_calendar_events_card;
ALTER TABLE calendar_events
  ADD CONSTRAINT fk_calendar_events_card
  FOREIGN KEY (linked_card_id) REFERENCES board_cards (id);
