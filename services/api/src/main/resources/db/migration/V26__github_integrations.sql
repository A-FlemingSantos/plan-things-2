CREATE TABLE github_connections (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    github_user_id BIGINT NOT NULL,
    github_login NVARCHAR(120) NOT NULL,
    github_avatar_url NVARCHAR(500) NULL,
    scopes NVARCHAR(500) NOT NULL,
    encrypted_access_token NVARCHAR(2000) NOT NULL,
    connected_at DATETIMEOFFSET NOT NULL,
    revoked_at DATETIMEOFFSET NULL,
    last_error NVARCHAR(120) NULL,
    last_checked_at DATETIMEOFFSET NULL,
    CONSTRAINT fk_github_connections_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_github_connections_user UNIQUE (user_id)
);

CREATE TABLE github_oauth_states (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    state_token NVARCHAR(120) NOT NULL UNIQUE,
    client NVARCHAR(20) NOT NULL DEFAULT 'web',
    redirect_path NVARCHAR(500) NULL,
    expires_at DATETIMEOFFSET NOT NULL,
    used_at DATETIMEOFFSET NULL,
    CONSTRAINT fk_github_oauth_states_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE plan_github_repos (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    plan_id UNIQUEIDENTIFIER NOT NULL,
    connection_user_id UNIQUEIDENTIFIER NOT NULL,
    github_repo_id BIGINT NOT NULL,
    repo_full_name NVARCHAR(260) NOT NULL,
    owner_avatar_url NVARCHAR(500) NULL,
    is_private BIT NOT NULL DEFAULT 0,
    default_branch NVARCHAR(120) NULL,
    connected_at DATETIMEOFFSET NOT NULL,
    connected_by_user_id UNIQUEIDENTIFIER NOT NULL,
    removed_at DATETIMEOFFSET NULL,
    last_error NVARCHAR(120) NULL,
    last_synced_at DATETIMEOFFSET NULL,
    CONSTRAINT fk_plan_github_repos_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE,
    CONSTRAINT fk_plan_github_repos_connection_user FOREIGN KEY (connection_user_id) REFERENCES users (id),
    CONSTRAINT fk_plan_github_repos_connected_by FOREIGN KEY (connected_by_user_id) REFERENCES users (id),
    CONSTRAINT uq_plan_github_repos_plan_repo UNIQUE (plan_id, github_repo_id)
);

CREATE TABLE board_card_github_links (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    plan_id UNIQUEIDENTIFIER NOT NULL,
    card_id UNIQUEIDENTIFIER NOT NULL,
    plan_github_repo_id UNIQUEIDENTIFIER NOT NULL,
    link_type NVARCHAR(20) NOT NULL,
    github_number INT NULL,
    github_ref NVARCHAR(260) NULL,
    github_sha NVARCHAR(64) NULL,
    repo_full_name NVARCHAR(260) NOT NULL,
    title NVARCHAR(500) NOT NULL,
    url NVARCHAR(500) NOT NULL,
    status NVARCHAR(20) NULL,
    snapshot_json NVARCHAR(MAX) NULL,
    is_completion_anchor BIT NOT NULL DEFAULT 0,
    unavailable BIT NOT NULL DEFAULT 0,
    linked_by_user_id UNIQUEIDENTIFIER NOT NULL,
    last_synced_at DATETIMEOFFSET NULL,
    CONSTRAINT fk_board_card_github_links_plan FOREIGN KEY (plan_id) REFERENCES plans (id),
    CONSTRAINT fk_board_card_github_links_card FOREIGN KEY (card_id) REFERENCES board_cards (id) ON DELETE CASCADE,
    CONSTRAINT fk_board_card_github_links_repo FOREIGN KEY (plan_github_repo_id) REFERENCES plan_github_repos (id),
    CONSTRAINT fk_board_card_github_links_user FOREIGN KEY (linked_by_user_id) REFERENCES users (id)
);

CREATE INDEX idx_github_connections_user_id ON github_connections (user_id);
CREATE INDEX idx_github_oauth_states_user_id ON github_oauth_states (user_id);
CREATE INDEX idx_plan_github_repos_plan_id ON plan_github_repos (plan_id);
CREATE INDEX idx_plan_github_repos_connection_user ON plan_github_repos (connection_user_id);
CREATE INDEX idx_board_card_github_links_card_id ON board_card_github_links (card_id);
CREATE INDEX idx_board_card_github_links_anchor ON board_card_github_links (card_id, is_completion_anchor);
CREATE INDEX idx_board_card_github_links_sync ON board_card_github_links (last_synced_at);
