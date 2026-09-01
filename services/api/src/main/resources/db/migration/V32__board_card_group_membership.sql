IF EXISTS (
    SELECT 1
    FROM board_column_groups AS group_row
    LEFT JOIN board_cards AS start_card ON start_card.id = group_row.start_card_id
    LEFT JOIN board_cards AS end_card ON end_card.id = COALESCE(group_row.end_card_id, group_row.start_card_id)
    WHERE start_card.id IS NULL
       OR end_card.id IS NULL
       OR start_card.column_id <> group_row.column_id
       OR end_card.column_id <> group_row.column_id
       OR end_card.position_index < start_card.position_index
)
BEGIN
    THROW 51000, 'Nao foi possivel migrar um agrupamento com limites invalidos.', 1;
END;

IF EXISTS (
    SELECT card.id
    FROM board_cards AS card
    JOIN board_column_groups AS group_row ON group_row.column_id = card.column_id
    JOIN board_cards AS start_card ON start_card.id = group_row.start_card_id
    JOIN board_cards AS end_card ON end_card.id = COALESCE(group_row.end_card_id, group_row.start_card_id)
    WHERE card.position_index BETWEEN start_card.position_index AND end_card.position_index
    GROUP BY card.id
    HAVING COUNT(*) > 1
)
BEGIN
    THROW 51001, 'Nao foi possivel migrar agrupamentos sobrepostos.', 1;
END;

ALTER TABLE board_cards ADD group_id UNIQUEIDENTIFIER NULL;

GO

ALTER TABLE board_cards
    ADD CONSTRAINT fk_board_cards_group
    FOREIGN KEY (group_id) REFERENCES board_column_groups (id);

CREATE INDEX idx_board_cards_group_id ON board_cards (group_id);

GO

;WITH group_bounds AS (
    SELECT
        group_row.id AS group_id,
        group_row.column_id,
        start_card.position_index AS start_position,
        end_card.position_index AS end_position
    FROM board_column_groups AS group_row
    JOIN board_cards AS start_card ON start_card.id = group_row.start_card_id
    JOIN board_cards AS end_card ON end_card.id = COALESCE(group_row.end_card_id, group_row.start_card_id)
)
UPDATE card
SET group_id = group_bounds.group_id
FROM board_cards AS card
JOIN group_bounds
    ON group_bounds.column_id = card.column_id
   AND card.position_index BETWEEN group_bounds.start_position AND group_bounds.end_position;
