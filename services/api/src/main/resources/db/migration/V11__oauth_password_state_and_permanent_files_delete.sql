ALTER TABLE users ADD local_password_enabled BIT NOT NULL CONSTRAINT df_users_local_password_enabled DEFAULT 1;
ALTER TABLE users ALTER COLUMN password_hash NVARCHAR(255) NULL;
