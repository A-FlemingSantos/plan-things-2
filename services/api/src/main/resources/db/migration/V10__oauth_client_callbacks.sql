ALTER TABLE oauth_login_states ADD client varchar(20) NULL;
EXEC('UPDATE oauth_login_states SET client = ''web'' WHERE client IS NULL');
EXEC('ALTER TABLE oauth_login_states ALTER COLUMN client varchar(20) NOT NULL');

ALTER TABLE gmail_oauth_states ADD client varchar(20) NULL;
EXEC('UPDATE gmail_oauth_states SET client = ''web'' WHERE client IS NULL');
EXEC('ALTER TABLE gmail_oauth_states ALTER COLUMN client varchar(20) NOT NULL');
