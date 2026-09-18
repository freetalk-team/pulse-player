
-- CREATE TABLE IF NOT EXISTS posts (
-- 	id INTEGER PRIMARY KEY AUTOINCREMENT,
-- 	description TEXT DEFAULT '',
-- 	type TEXT CHECK( type IN ('comment', 'track', 'album', 'playlist', 'playset') ) DEFAULT 'comment',
-- 	item TEXT,
-- 	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- );

-- DROP TABLE IF EXISTS posts;
-- DROP TABLE IF EXISTS comments;
-- DROP TABLE IF EXISTS reactions;

-- DROP INDEX IF EXISTS idx_posts_user_id;
-- DROP INDEX IF EXISTS idx_posts_created_at;
-- DROP INDEX IF EXISTS idx_comments_post_id;
-- DROP INDEX IF EXISTS idx_comments_parent_id;
-- DROP INDEX IF EXISTS idx_comments_created_at;
-- DROP INDEX IF EXISTS idx_comments_post_parent;
-- DROP INDEX IF EXISTS idx_reactions_post;
-- DROP INDEX IF EXISTS idx_reactions_comment;


CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
	name TEXT NOT NULL DEFAULT '',

	photo text,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME

);

CREATE TRIGGER users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE users
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uid INTEGER NOT NULL,

    content TEXT NOT NULL DEFAULT '',
	type TEXT CHECK( type IN ('post', 'track', 'album', 'playlist', 'playset', 'radio', 'link') ) DEFAULT 'post',
	item TEXT,

	comments_count INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,

    deleted_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(uid);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    comment_id INTEGER,

    content TEXT NOT NULL,
	replies_count INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,

    deleted_at DATETIME,

    FOREIGN KEY(comment_id)
        REFERENCES comments(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post_parent ON comments(post_id, comment_id);


CREATE TRIGGER IF NOT EXISTS comments_insert_trigger
AFTER INSERT ON comments
WHEN NEW.comment_id IS NULL
BEGIN
    UPDATE posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
END;

CREATE TRIGGER IF NOT EXISTS comments_delete_trigger
AFTER DELETE ON comments
WHEN OLD.comment_id IS NULL
BEGIN
    UPDATE posts
    SET comments_count = comments_count - 1
    WHERE id = OLD.post_id;
END;


CREATE TRIGGER IF NOT EXISTS replies_insert_trigger
AFTER INSERT ON comments
WHEN NEW.comment_id IS NOT NULL
BEGIN
    UPDATE comments
    SET replies_count = replies_count + 1
    WHERE id = NEW.comment_id;
END;

CREATE TRIGGER IF NOT EXISTS replies_delete_trigger
AFTER DELETE ON comments
WHEN OLD.comment_id IS NOT NULL
BEGIN
    UPDATE comments
    SET replies_count = replies_count - 1
    WHERE id = OLD.comment_id;
END;

-- CREATE TRIGGER comments_soft_delete_trigger
-- AFTER UPDATE OF deleted_at ON comments
-- WHEN OLD.deleted_at IS NULL
--  AND NEW.deleted_at IS NOT NULL
-- BEGIN
--     UPDATE posts
--     SET comments_count = comments_count - 1
--     WHERE id = NEW.post_id;
-- END;

CREATE VIEW IF NOT EXISTS user_comments AS
SELECT 
	c.*,
	u.name AS username,
	u.photo 
FROM comments c
LEFT JOIN users u ON c.uid=u.id;

CREATE TABLE IF NOT EXISTS reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid INTEGER NOT NULL,
    post_id INTEGER,
    comment_id INTEGER,

    reaction TEXT NOT NULL CHECK (reaction IN ('like', 'love', 'laugh', 'sad')),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL)
        OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),

    UNIQUE(uid, post_id),
    UNIQUE(uid, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_comment ON reactions(comment_id);
