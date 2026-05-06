CREATE TABLE avatar_images (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NOT NULL,
    owner_type NVARCHAR(30) NOT NULL,
    owner_id UNIQUEIDENTIFIER NOT NULL,
    mime_type NVARCHAR(80) NOT NULL,
    content VARBINARY(MAX) NOT NULL,
    CONSTRAINT uq_avatar_images_owner UNIQUE (owner_type, owner_id)
);

