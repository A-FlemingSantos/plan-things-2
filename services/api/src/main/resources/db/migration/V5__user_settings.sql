CREATE TABLE user_settings (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
    date_format NVARCHAR(20) NOT NULL CONSTRAINT df_user_settings_date_format DEFAULT 'dd/MM/yyyy',
    time_format NVARCHAR(10) NOT NULL CONSTRAINT df_user_settings_time_format DEFAULT '24h',
    email_notifs BIT NOT NULL CONSTRAINT df_user_settings_email_notifs DEFAULT 1,
    event_reminders BIT NOT NULL CONSTRAINT df_user_settings_event_reminders DEFAULT 1,
    deadline_alerts BIT NOT NULL CONSTRAINT df_user_settings_deadline_alerts DEFAULT 1,
    CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_user_settings_user_id ON user_settings (user_id);
