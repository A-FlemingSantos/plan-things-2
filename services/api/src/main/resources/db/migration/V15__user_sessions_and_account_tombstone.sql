ALTER TABLE oauth_login_codes
ADD client NVARCHAR(20) NOT NULL CONSTRAINT df_oauth_login_codes_client DEFAULT 'web';

CREATE TABLE user_sessions (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    client NVARCHAR(20) NOT NULL,
    device_label NVARCHAR(160) NOT NULL,
    user_agent NVARCHAR(1000) NULL,
    last_seen_at DATETIMEOFFSET NOT NULL,
    revoked_at DATETIMEOFFSET NULL,
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_user_sessions_user_revoked_last_seen
ON user_sessions (user_id, revoked_at, last_seen_at DESC, created_at DESC);

IF NOT EXISTS (
    SELECT 1
    FROM users
    WHERE id = '00000000-0000-0000-0000-000000000001'
)
BEGIN
    INSERT INTO users (
        id,
        created_at,
        updated_at,
        full_name,
        email,
        password_hash,
        local_password_enabled,
        locale_tag,
        time_zone
    ) VALUES (
        '00000000-0000-0000-0000-000000000001',
        SYSDATETIMEOFFSET(),
        SYSDATETIMEOFFSET(),
        'Conta removida',
        'deleted-user@planthings.local',
        NULL,
        0,
        'pt-BR',
        'America/Sao_Paulo'
    );
END;
