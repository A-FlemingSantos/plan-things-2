CREATE TABLE ai_tool_calls (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    conversation_id UNIQUEIDENTIFIER NOT NULL,
    message_id UNIQUEIDENTIFIER NOT NULL,
    openai_response_id NVARCHAR(120) NULL,
    tool_name NVARCHAR(80) NOT NULL,
    capability_id NVARCHAR(120) NULL,
    status NVARCHAR(20) NOT NULL,
    arguments_json NVARCHAR(MAX) NOT NULL,
    result_json NVARCHAR(MAX) NULL,
    error_code NVARCHAR(80) NULL,
    started_at DATETIMEOFFSET NOT NULL,
    completed_at DATETIMEOFFSET NULL,
    duration_ms INT NULL,
    CONSTRAINT fk_ai_tool_calls_conversation FOREIGN KEY (conversation_id) REFERENCES ai_conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_tool_calls_message FOREIGN KEY (message_id) REFERENCES ai_messages (id) ON DELETE NO ACTION
);

CREATE INDEX ix_ai_tool_calls_message ON ai_tool_calls (message_id, created_at);
CREATE INDEX ix_ai_tool_calls_conversation ON ai_tool_calls (conversation_id, created_at);
