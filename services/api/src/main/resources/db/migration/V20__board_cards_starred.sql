ALTER TABLE board_cards
ADD is_starred BIT NOT NULL CONSTRAINT df_board_cards_is_starred DEFAULT 0;
