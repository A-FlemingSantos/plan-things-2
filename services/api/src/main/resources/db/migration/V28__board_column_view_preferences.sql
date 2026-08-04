CREATE TABLE board_column_view_preferences (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    plan_id UNIQUEIDENTIFIER NOT NULL,
    column_id UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT uq_board_column_view_preferences_user_plan_column UNIQUE (user_id, plan_id, column_id),
    CONSTRAINT fk_board_column_view_preferences_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_board_column_view_preferences_plan FOREIGN KEY (plan_id) REFERENCES plans (id),
    CONSTRAINT fk_board_column_view_preferences_column FOREIGN KEY (column_id) REFERENCES board_columns (id) ON DELETE CASCADE
);

CREATE INDEX idx_board_column_view_preferences_user_plan
    ON board_column_view_preferences (user_id, plan_id);
