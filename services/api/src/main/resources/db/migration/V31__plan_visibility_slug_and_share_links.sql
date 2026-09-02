IF COL_LENGTH('dbo.plans', 'visibility') IS NULL
    EXEC('ALTER TABLE plans ADD visibility NVARCHAR(20) NOT NULL CONSTRAINT df_plans_visibility DEFAULT ''PRIVATE''');

IF COL_LENGTH('dbo.plans', 'slug') IS NULL
    EXEC('ALTER TABLE plans ADD slug NVARCHAR(140) NULL');

EXEC('UPDATE plans SET slug = LOWER(REPLACE(CONVERT(NVARCHAR(36), id), ''-'', '''')) WHERE slug IS NULL');
EXEC('ALTER TABLE plans ALTER COLUMN slug NVARCHAR(140) NOT NULL');
EXEC('
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = ''uq_plans_slug'' AND object_id = OBJECT_ID(''dbo.plans'')
)
    CREATE UNIQUE INDEX uq_plans_slug ON plans (slug)
');

UPDATE plan_members SET role = 'ADMIN' WHERE role = 'OWNER';

IF COL_LENGTH('dbo.plan_invites', 'role') IS NULL
    EXEC('ALTER TABLE plan_invites ADD role NVARCHAR(20) NOT NULL CONSTRAINT df_plan_invites_role DEFAULT ''MEMBER''');

EXEC('ALTER TABLE plan_invites ALTER COLUMN invited_email NVARCHAR(160) NULL');

IF OBJECT_ID('dbo.plan_share_links', 'U') IS NULL
    EXEC('
        CREATE TABLE plan_share_links (
            id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
            created_at DATETIMEOFFSET NOT NULL,
            updated_at DATETIMEOFFSET NOT NULL,
            plan_id UNIQUEIDENTIFIER NOT NULL,
            created_by_user_id UNIQUEIDENTIFIER NOT NULL,
            token NVARCHAR(120) NOT NULL UNIQUE,
            role NVARCHAR(20) NOT NULL,
            expires_at DATETIMEOFFSET NULL,
            revoked_at DATETIMEOFFSET NULL,
            CONSTRAINT fk_plan_share_links_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE,
            CONSTRAINT fk_plan_share_links_creator FOREIGN KEY (created_by_user_id) REFERENCES users (id)
        )
    ');

EXEC('
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = ''uq_plan_share_links_active_plan'' AND object_id = OBJECT_ID(''dbo.plan_share_links'')
)
    CREATE UNIQUE INDEX uq_plan_share_links_active_plan ON plan_share_links (plan_id) WHERE revoked_at IS NULL
');
