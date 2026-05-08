ALTER TABLE workspaces ADD subscription_plan NVARCHAR(20) NULL;
EXEC('UPDATE workspaces SET subscription_plan = ''BASIC'' WHERE subscription_plan IS NULL');
EXEC('ALTER TABLE workspaces ALTER COLUMN subscription_plan NVARCHAR(20) NOT NULL');
EXEC('ALTER TABLE workspaces ADD CONSTRAINT df_workspaces_subscription_plan DEFAULT ''BASIC'' FOR subscription_plan');

