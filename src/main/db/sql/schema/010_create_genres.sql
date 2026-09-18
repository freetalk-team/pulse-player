
CREATE TABLE IF NOT EXISTS genre (
    genre TEXT PRIMARY KEY
);

CREATE VIEW IF NOT EXISTS genres AS
SELECT * FROM genre ORDER BY genre;

INSERT OR IGNORE INTO genre VALUES 
    ('Jazz'), 
    ('Electronic'), 
    ('Blues'),
    ('Country'),
    ('Classical'), 
    ('Lo-Fi'), 
    ('Workout'), 
    ('Chill'), 
    ('Deep House'), 
    ('Reggae'), 
    ('Soul'), 
    ('Synthwave'), 
    ('Indie'), 
    ('Alternative'), 
    ('R&B'), 
    ('Techno'), 
    ('Ambient'), 
    ('Punk'), 
    ('Disco'), 
    ('Dubstep'), 
    ('Funk'),
    ('Hardstyle'), 
    ('House'), 
    ('Latin'), 
    ('Opera'), 
    ('Psytrance'), 
    ('Trap'), 
    ('Vaporwave'), 
    ('World'),

	('Pop'), ('Pop Folk'), ('K-Pop'), ('Alternative Pop'), ('Pop Rock'),
	('Folk'), ('YU Folk'), ('BG Folk'), ('Turbo Folk'),
	('Rock'), ('Rock & Roll'), ('Hard Rock'), ('Progressive Rock'), ('Classic Rock'), ('Alternative Rock'),
	('Metal'), ('Thrash Metal'), ('Grunge'),
	('Hip Hop'), ('Rap')
    ;