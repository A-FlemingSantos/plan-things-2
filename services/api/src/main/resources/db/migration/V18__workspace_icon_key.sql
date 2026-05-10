ALTER TABLE workspaces ADD icon_key NVARCHAR(40) NULL;
EXEC('UPDATE workspaces SET icon_key = ''BUILDING'' WHERE icon_key IS NULL');
EXEC('ALTER TABLE workspaces ALTER COLUMN icon_key NVARCHAR(40) NOT NULL');
EXEC('ALTER TABLE workspaces ADD CONSTRAINT df_workspaces_icon_key DEFAULT ''BUILDING'' FOR icon_key');
