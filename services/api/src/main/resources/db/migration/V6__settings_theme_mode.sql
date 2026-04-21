ALTER TABLE user_settings
ADD theme_mode NVARCHAR(10) NOT NULL
    CONSTRAINT df_user_settings_theme_mode DEFAULT 'system';
