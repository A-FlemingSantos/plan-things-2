CREATE TABLE users (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    full_name NVARCHAR(120) NOT NULL,
    email NVARCHAR(160) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    locale_tag NVARCHAR(20) NOT NULL,
    time_zone NVARCHAR(60) NOT NULL
);

CREATE TABLE password_reset_tokens (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    token NVARCHAR(120) NOT NULL UNIQUE,
    expires_at DATETIMEOFFSET NOT NULL,
    used_at DATETIMEOFFSET NULL,
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE workspaces (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    owner_user_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
    name NVARCHAR(120) NOT NULL,
    CONSTRAINT fk_workspaces_owner FOREIGN KEY (owner_user_id) REFERENCES users (id)
);

CREATE TABLE plans (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    workspace_id UNIQUEIDENTIFIER NOT NULL,
    owner_user_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(120) NOT NULL,
    description NVARCHAR(400) NULL,
    CONSTRAINT fk_plans_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id),
    CONSTRAINT fk_plans_owner FOREIGN KEY (owner_user_id) REFERENCES users (id)
);

CREATE TABLE plan_members (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    plan_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    role NVARCHAR(20) NOT NULL,
    CONSTRAINT uq_plan_member UNIQUE (plan_id, user_id),
    CONSTRAINT fk_plan_members_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE,
    CONSTRAINT fk_plan_members_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE plan_invites (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    plan_id UNIQUEIDENTIFIER NOT NULL,
    inviter_user_id UNIQUEIDENTIFIER NOT NULL,
    invited_email NVARCHAR(160) NOT NULL,
    token NVARCHAR(120) NOT NULL UNIQUE,
    status NVARCHAR(20) NOT NULL,
    expires_at DATETIMEOFFSET NOT NULL,
    responded_at DATETIMEOFFSET NULL,
    CONSTRAINT fk_plan_invites_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE,
    CONSTRAINT fk_plan_invites_inviter FOREIGN KEY (inviter_user_id) REFERENCES users (id)
);

CREATE TABLE plan_labels (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    plan_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(80) NOT NULL,
    color NVARCHAR(20) NOT NULL,
    CONSTRAINT fk_plan_labels_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE
);

CREATE TABLE board_columns (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    plan_id UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(120) NOT NULL,
    color NVARCHAR(20) NOT NULL,
    position_index INT NOT NULL,
    CONSTRAINT fk_board_columns_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE
);

CREATE TABLE board_cards (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    plan_id UNIQUEIDENTIFIER NOT NULL,
    column_id UNIQUEIDENTIFIER NOT NULL,
    author_user_id UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(160) NOT NULL,
    description NVARCHAR(4000) NULL,
    label_id UNIQUEIDENTIFIER NULL,
    position_index INT NOT NULL,
    start_at DATETIMEOFFSET NULL,
    due_at DATETIMEOFFSET NULL,
    CONSTRAINT fk_board_cards_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE,
    CONSTRAINT fk_board_cards_column FOREIGN KEY (column_id) REFERENCES board_columns (id),
    CONSTRAINT fk_board_cards_author FOREIGN KEY (author_user_id) REFERENCES users (id),
    CONSTRAINT fk_board_cards_label FOREIGN KEY (label_id) REFERENCES plan_labels (id)
);

CREATE TABLE board_card_assignees (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    card_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT uq_board_card_assignee UNIQUE (card_id, user_id),
    CONSTRAINT fk_board_card_assignees_card FOREIGN KEY (card_id) REFERENCES board_cards (id) ON DELETE CASCADE,
    CONSTRAINT fk_board_card_assignees_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE board_card_comments (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    card_id UNIQUEIDENTIFIER NOT NULL,
    author_user_id UNIQUEIDENTIFIER NOT NULL,
    message NVARCHAR(4000) NOT NULL,
    CONSTRAINT fk_board_card_comments_card FOREIGN KEY (card_id) REFERENCES board_cards (id) ON DELETE CASCADE,
    CONSTRAINT fk_board_card_comments_author FOREIGN KEY (author_user_id) REFERENCES users (id)
);

CREATE TABLE board_checklists (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    card_id UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(160) NOT NULL,
    position_index INT NOT NULL,
    CONSTRAINT fk_board_checklists_card FOREIGN KEY (card_id) REFERENCES board_cards (id) ON DELETE CASCADE
);

CREATE TABLE board_checklist_items (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    checklist_id UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(240) NOT NULL,
    completed BIT NOT NULL,
    assignee_user_id UNIQUEIDENTIFIER NULL,
    start_at DATETIMEOFFSET NULL,
    due_at DATETIMEOFFSET NULL,
    position_index INT NOT NULL,
    CONSTRAINT fk_board_checklist_items_checklist FOREIGN KEY (checklist_id) REFERENCES board_checklists (id) ON DELETE CASCADE,
    CONSTRAINT fk_board_checklist_items_assignee FOREIGN KEY (assignee_user_id) REFERENCES users (id)
);

CREATE TABLE calendar_events (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    workspace_id UNIQUEIDENTIFIER NOT NULL,
    creator_user_id UNIQUEIDENTIFIER NOT NULL,
    plan_id UNIQUEIDENTIFIER NULL,
    linked_card_id UNIQUEIDENTIFIER NULL UNIQUE,
    title NVARCHAR(160) NOT NULL,
    description NVARCHAR(2000) NULL,
    location NVARCHAR(255) NULL,
    starts_at DATETIMEOFFSET NOT NULL,
    ends_at DATETIMEOFFSET NOT NULL,
    generated_from_card BIT NOT NULL,
    CONSTRAINT fk_calendar_events_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id),
    CONSTRAINT fk_calendar_events_creator FOREIGN KEY (creator_user_id) REFERENCES users (id),
    CONSTRAINT fk_calendar_events_plan FOREIGN KEY (plan_id) REFERENCES plans (id),
    CONSTRAINT fk_calendar_events_card FOREIGN KEY (linked_card_id) REFERENCES board_cards (id)
);

CREATE TABLE canvas_documents (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    plan_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
    updated_by_user_id UNIQUEIDENTIFIER NOT NULL,
    version_number BIGINT NOT NULL,
    document_json NVARCHAR(MAX) NOT NULL,
    CONSTRAINT fk_canvas_documents_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE,
    CONSTRAINT fk_canvas_documents_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users (id)
);

CREATE TABLE file_entries (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    workspace_id UNIQUEIDENTIFIER NOT NULL,
    owner_user_id UNIQUEIDENTIFIER NOT NULL,
    parent_id UNIQUEIDENTIFIER NULL,
    type NVARCHAR(10) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    mime_type NVARCHAR(120) NULL,
    size_bytes BIGINT NULL,
    deleted_at DATETIMEOFFSET NULL,
    CONSTRAINT fk_file_entries_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id),
    CONSTRAINT fk_file_entries_owner FOREIGN KEY (owner_user_id) REFERENCES users (id),
    CONSTRAINT fk_file_entries_parent FOREIGN KEY (parent_id) REFERENCES file_entries (id)
);

CREATE TABLE file_blobs (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    file_entry_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
    content VARBINARY(MAX) NOT NULL,
    CONSTRAINT fk_file_blobs_entry FOREIGN KEY (file_entry_id) REFERENCES file_entries (id) ON DELETE CASCADE
);

CREATE TABLE file_plan_shares (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    file_entry_id UNIQUEIDENTIFIER NOT NULL,
    plan_id UNIQUEIDENTIFIER NOT NULL,
    shared_by_user_id UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT uq_file_plan_share UNIQUE (file_entry_id, plan_id),
    CONSTRAINT fk_file_plan_shares_entry FOREIGN KEY (file_entry_id) REFERENCES file_entries (id) ON DELETE CASCADE,
    CONSTRAINT fk_file_plan_shares_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE,
    CONSTRAINT fk_file_plan_shares_user FOREIGN KEY (shared_by_user_id) REFERENCES users (id)
);

CREATE TABLE card_attachments (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    card_id UNIQUEIDENTIFIER NOT NULL,
    file_entry_id UNIQUEIDENTIFIER NOT NULL,
    attached_by_user_id UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT uq_card_attachment UNIQUE (card_id, file_entry_id),
    CONSTRAINT fk_card_attachments_card FOREIGN KEY (card_id) REFERENCES board_cards (id) ON DELETE CASCADE,
    CONSTRAINT fk_card_attachments_entry FOREIGN KEY (file_entry_id) REFERENCES file_entries (id) ON DELETE CASCADE,
    CONSTRAINT fk_card_attachments_user FOREIGN KEY (attached_by_user_id) REFERENCES users (id)
);

CREATE INDEX idx_plan_members_user_id ON plan_members (user_id);
CREATE INDEX idx_board_columns_plan_id ON board_columns (plan_id);
CREATE INDEX idx_board_cards_plan_id ON board_cards (plan_id);
CREATE INDEX idx_board_cards_column_id ON board_cards (column_id);
CREATE INDEX idx_calendar_events_workspace_id ON calendar_events (workspace_id);
CREATE INDEX idx_file_entries_workspace_id ON file_entries (workspace_id);
CREATE INDEX idx_file_entries_parent_id ON file_entries (parent_id);
