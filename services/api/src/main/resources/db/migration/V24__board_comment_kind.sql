ALTER TABLE board_card_comments ADD kind NVARCHAR(30) NULL;

UPDATE board_card_comments
SET kind = 'USER_COMMENT'
WHERE kind IS NULL;

EXEC('ALTER TABLE board_card_comments ALTER COLUMN kind NVARCHAR(30) NOT NULL');
