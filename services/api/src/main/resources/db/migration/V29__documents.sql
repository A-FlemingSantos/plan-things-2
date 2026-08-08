CREATE TABLE documents (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    owner_user_id UNIQUEIDENTIFIER NOT NULL,
    updated_by_user_id UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(160) NOT NULL,
    description NVARCHAR(400) NULL,
    content_markdown NVARCHAR(MAX) NOT NULL,
    version_number BIGINT NOT NULL,
    CONSTRAINT fk_documents_owner FOREIGN KEY (owner_user_id) REFERENCES users (id),
    CONSTRAINT fk_documents_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users (id)
);

CREATE TABLE document_members (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    document_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL,
    role NVARCHAR(20) NOT NULL,
    CONSTRAINT uq_document_member UNIQUE (document_id, user_id),
    CONSTRAINT fk_document_members_document FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
    CONSTRAINT fk_document_members_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE document_invites (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    document_id UNIQUEIDENTIFIER NOT NULL,
    inviter_user_id UNIQUEIDENTIFIER NOT NULL,
    invited_email NVARCHAR(160) NOT NULL,
    role NVARCHAR(20) NOT NULL,
    token NVARCHAR(120) NOT NULL UNIQUE,
    status NVARCHAR(20) NOT NULL,
    expires_at DATETIMEOFFSET NOT NULL,
    responded_at DATETIMEOFFSET NULL,
    CONSTRAINT fk_document_invites_document FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
    CONSTRAINT fk_document_invites_inviter FOREIGN KEY (inviter_user_id) REFERENCES users (id)
);

CREATE TABLE document_comments (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    document_id UNIQUEIDENTIFIER NOT NULL,
    author_user_id UNIQUEIDENTIFIER NOT NULL,
    body NVARCHAR(4000) NOT NULL,
    quoted_text NVARCHAR(1000) NOT NULL,
    selection_start INT NOT NULL,
    selection_end INT NOT NULL,
    CONSTRAINT fk_document_comments_document FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
    CONSTRAINT fk_document_comments_author FOREIGN KEY (author_user_id) REFERENCES users (id),
    CONSTRAINT ck_document_comments_range CHECK (selection_start >= 0 AND selection_end > selection_start)
);

CREATE INDEX idx_documents_owner_updated_at ON documents (owner_user_id, updated_at DESC);
CREATE INDEX idx_document_members_user_id ON document_members (user_id);
CREATE INDEX idx_document_comments_document_created_at ON document_comments (document_id, created_at ASC);
