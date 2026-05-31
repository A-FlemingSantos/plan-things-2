CREATE TABLE ai_context_snapshots (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    conversation_id UNIQUEIDENTIFIER NOT NULL,
    message_id UNIQUEIDENTIFIER NOT NULL,
    workspace_id UNIQUEIDENTIFIER NOT NULL,
    plan_id UNIQUEIDENTIFIER NULL,
    context_json NVARCHAR(MAX) NOT NULL,
    token_estimate INT NULL,
    CONSTRAINT fk_ai_context_snapshots_conversation FOREIGN KEY (conversation_id) REFERENCES ai_conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_context_snapshots_message FOREIGN KEY (message_id) REFERENCES ai_messages (id) ON DELETE NO ACTION,
    CONSTRAINT fk_ai_context_snapshots_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id)
);

CREATE UNIQUE INDEX ux_ai_context_snapshots_message ON ai_context_snapshots (message_id);

CREATE TABLE ai_compaction_items (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    conversation_id UNIQUEIDENTIFIER NOT NULL,
    message_id UNIQUEIDENTIFIER NULL,
    openai_response_id NVARCHAR(120) NULL,
    compaction_mode NVARCHAR(40) NOT NULL,
    compact_threshold INT NULL,
    input_token_estimate INT NULL,
    output_item_ref NVARCHAR(200) NULL,
    opaque_payload_json NVARCHAR(MAX) NULL,
    CONSTRAINT fk_ai_compaction_items_conversation FOREIGN KEY (conversation_id) REFERENCES ai_conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_compaction_items_message FOREIGN KEY (message_id) REFERENCES ai_messages (id) ON DELETE NO ACTION
);

CREATE INDEX ix_ai_compaction_items_conversation ON ai_compaction_items (conversation_id, created_at);
