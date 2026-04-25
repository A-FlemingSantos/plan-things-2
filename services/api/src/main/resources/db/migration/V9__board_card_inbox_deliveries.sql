CREATE TABLE board_card_inbox_deliveries (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    plan_id UNIQUEIDENTIFIER NOT NULL,
    card_id UNIQUEIDENTIFIER NOT NULL,
    sent_by_user_id UNIQUEIDENTIFIER NOT NULL,
    sent_from NVARCHAR(160) NOT NULL,
    message_id NVARCHAR(255) NULL,
    thread_id NVARCHAR(255) NULL,
    CONSTRAINT fk_board_card_inbox_deliveries_plan FOREIGN KEY (plan_id) REFERENCES plans (id),
    CONSTRAINT fk_board_card_inbox_deliveries_card FOREIGN KEY (card_id) REFERENCES board_cards (id) ON DELETE CASCADE,
    CONSTRAINT fk_board_card_inbox_deliveries_sender FOREIGN KEY (sent_by_user_id) REFERENCES users (id)
);

CREATE TABLE board_card_inbox_delivery_recipients (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    delivery_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    email NVARCHAR(160) NOT NULL,
    CONSTRAINT uq_board_card_inbox_delivery_recipient UNIQUE (delivery_id, user_id),
    CONSTRAINT fk_board_card_inbox_delivery_recipients_delivery FOREIGN KEY (delivery_id) REFERENCES board_card_inbox_deliveries (id) ON DELETE CASCADE,
    CONSTRAINT fk_board_card_inbox_delivery_recipients_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_board_card_inbox_deliveries_plan_id_created_at ON board_card_inbox_deliveries (plan_id, created_at);
CREATE INDEX idx_board_card_inbox_delivery_recipients_delivery_id ON board_card_inbox_delivery_recipients (delivery_id);
