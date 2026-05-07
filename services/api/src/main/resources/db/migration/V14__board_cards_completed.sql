ALTER TABLE board_cards
ADD completed BIT NOT NULL CONSTRAINT df_board_cards_completed DEFAULT 0;
