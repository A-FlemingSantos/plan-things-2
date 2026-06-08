ALTER TABLE board_card_comments ADD kind NVARCHAR(30) NULL;

EXEC sp_executesql
  N'UPDATE board_card_comments
    SET kind = @kind
    WHERE kind IS NULL;',
  N'@kind NVARCHAR(30)',
  @kind = N'USER_COMMENT';

EXEC('ALTER TABLE board_card_comments ALTER COLUMN kind NVARCHAR(30) NOT NULL');
