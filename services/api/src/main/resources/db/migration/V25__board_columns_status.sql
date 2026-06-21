ALTER TABLE board_columns
ADD status NVARCHAR(32) NOT NULL CONSTRAINT df_board_columns_status DEFAULT '';
