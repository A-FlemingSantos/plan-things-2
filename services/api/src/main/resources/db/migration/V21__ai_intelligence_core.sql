CREATE TABLE ai_conversations (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    workspace_id UNIQUEIDENTIFIER NOT NULL,
    plan_id UNIQUEIDENTIFIER NULL,
    card_id UNIQUEIDENTIFIER NULL,
    created_by_user_id UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(200) NULL,
    scope_type NVARCHAR(40) NOT NULL,
    status NVARCHAR(20) NOT NULL,
    openai_conversation_id NVARCHAR(120) NULL,
    last_openai_response_id NVARCHAR(120) NULL,
    CONSTRAINT fk_ai_conversations_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id),
    CONSTRAINT fk_ai_conversations_plan FOREIGN KEY (plan_id) REFERENCES plans (id),
    CONSTRAINT fk_ai_conversations_card FOREIGN KEY (card_id) REFERENCES board_cards (id),
    CONSTRAINT fk_ai_conversations_created_by FOREIGN KEY (created_by_user_id) REFERENCES users (id)
);

CREATE TABLE ai_messages (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    conversation_id UNIQUEIDENTIFIER NOT NULL,
    role NVARCHAR(20) NOT NULL,
    status NVARCHAR(20) NOT NULL,
    content_text NVARCHAR(MAX) NULL,
    openai_response_id NVARCHAR(120) NULL,
    token_usage_json NVARCHAR(MAX) NULL,
    error_code NVARCHAR(80) NULL,
    CONSTRAINT fk_ai_messages_conversation FOREIGN KEY (conversation_id) REFERENCES ai_conversations (id) ON DELETE CASCADE
);

CREATE TABLE ai_message_blocks (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    message_id UNIQUEIDENTIFIER NOT NULL,
    block_type NVARCHAR(60) NOT NULL,
    position INT NOT NULL,
    entity_type NVARCHAR(40) NULL,
    entity_id UNIQUEIDENTIFIER NULL,
    external_provider NVARCHAR(40) NULL,
    external_type NVARCHAR(40) NULL,
    external_id NVARCHAR(200) NULL,
    action_proposal_id UNIQUEIDENTIFIER NULL,
    href NVARCHAR(500) NULL,
    title NVARCHAR(300) NULL,
    payload_json NVARCHAR(MAX) NOT NULL,
    snapshot_json NVARCHAR(MAX) NULL,
    CONSTRAINT fk_ai_message_blocks_message FOREIGN KEY (message_id) REFERENCES ai_messages (id) ON DELETE CASCADE
);

CREATE INDEX ix_ai_conversations_workspace_user ON ai_conversations (workspace_id, created_by_user_id);
CREATE INDEX ix_ai_messages_conversation ON ai_messages (conversation_id, created_at);
CREATE INDEX ix_ai_message_blocks_message ON ai_message_blocks (message_id, position);
