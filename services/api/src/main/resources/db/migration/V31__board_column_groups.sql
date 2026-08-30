CREATE TABLE board_column_groups (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    plan_id UNIQUEIDENTIFIER NOT NULL,
    column_id UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(120) NOT NULL,
    start_card_id UNIQUEIDENTIFIER NULL,
    collapsed BIT NOT NULL,
    CONSTRAINT fk_board_column_groups_plan FOREIGN KEY (plan_id) REFERENCES plans (id),
    CONSTRAINT fk_board_column_groups_column FOREIGN KEY (column_id) REFERENCES board_columns (id) ON DELETE CASCADE,
    CONSTRAINT fk_board_column_groups_start_card FOREIGN KEY (start_card_id) REFERENCES board_cards (id)
);

CREATE INDEX idx_board_column_groups_column
    ON board_column_groups (column_id);

CREATE INDEX idx_board_column_groups_plan
    ON board_column_groups (plan_id);
