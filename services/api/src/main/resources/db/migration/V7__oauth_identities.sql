CREATE TABLE user_external_identities (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    provider NVARCHAR(40) NOT NULL,
    provider_subject NVARCHAR(255) NOT NULL,
    email NVARCHAR(160) NOT NULL,
    email_verified BIT NOT NULL,
    display_name NVARCHAR(160) NULL,
    avatar_url NVARCHAR(500) NULL,
    CONSTRAINT fk_user_external_identities_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_user_external_identity_provider_subject UNIQUE (provider, provider_subject),
    CONSTRAINT uq_user_external_identity_user_provider UNIQUE (user_id, provider)
);

CREATE TABLE oauth_login_states (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    state_token NVARCHAR(120) NOT NULL UNIQUE,
    provider NVARCHAR(40) NOT NULL,
    nonce NVARCHAR(120) NOT NULL,
    redirect_path NVARCHAR(500) NULL,
    expires_at DATETIMEOFFSET NOT NULL,
    used_at DATETIMEOFFSET NULL
);

CREATE TABLE oauth_login_codes (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    completion_code NVARCHAR(120) NOT NULL UNIQUE,
    user_id UNIQUEIDENTIFIER NOT NULL,
    redirect_path NVARCHAR(500) NULL,
    expires_at DATETIMEOFFSET NOT NULL,
    used_at DATETIMEOFFSET NULL,
    CONSTRAINT fk_oauth_login_codes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_user_external_identities_user_id ON user_external_identities (user_id);
CREATE INDEX idx_oauth_login_states_provider ON oauth_login_states (provider);
CREATE INDEX idx_oauth_login_codes_user_id ON oauth_login_codes (user_id);
