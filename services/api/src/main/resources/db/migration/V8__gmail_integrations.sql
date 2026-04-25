CREATE TABLE gmail_connections (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    email NVARCHAR(160) NOT NULL,
    scopes NVARCHAR(1000) NOT NULL,
    encrypted_refresh_token NVARCHAR(2000) NOT NULL,
    connected_at DATETIMEOFFSET NOT NULL,
    revoked_at DATETIMEOFFSET NULL,
    last_error NVARCHAR(120) NULL,
    last_checked_at DATETIMEOFFSET NULL,
    CONSTRAINT fk_gmail_connections_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_gmail_connections_user UNIQUE (user_id)
);

CREATE TABLE gmail_oauth_states (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    state_token NVARCHAR(120) NOT NULL UNIQUE,
    nonce NVARCHAR(120) NOT NULL,
    expires_at DATETIMEOFFSET NOT NULL,
    used_at DATETIMEOFFSET NULL,
    CONSTRAINT fk_gmail_oauth_states_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_gmail_connections_user_id ON gmail_connections (user_id);
CREATE INDEX idx_gmail_oauth_states_user_id ON gmail_oauth_states (user_id);
