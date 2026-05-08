-- Recriar a base de dados plan_things_db:
USE master;
IF DB_ID(N'plan_things_db') IS NOT NULL
BEGIN
  ALTER DATABASE plan_things_db SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
  DROP DATABASE plan_things_db;
END
GO

CREATE DATABASE plan_things_db;
GO

-- Excluir a database e encerrar conexões
USE master;
ALTER DATABASE plan_things_db SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE plan_things_db;

-- Verificar se a base de dados foi excluída
SELECT name
FROM sys.databases
WHERE name = 'plan_things_db';