ALTER TABLE file_entries
ADD is_starred BIT NOT NULL CONSTRAINT df_file_entries_is_starred DEFAULT 0;
