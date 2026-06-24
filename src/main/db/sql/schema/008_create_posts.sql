
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
    id TEXT PRIMARY KEY,
	name TEXT NOT NULL DEFAULT '',

	photo text,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME

);

CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id TEXT NOT NULL,

    content TEXT NOT NULL DEFAULT '',
	type TEXT CHECK( type IN ('post', 'track', 'album', 'playlist', 'playset', 'link') ) DEFAULT 'post',
	item TEXT,

	comments_count INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,

    deleted_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    parent_comment_id INTEGER,

    content TEXT NOT NULL,
	reply_count INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,

    deleted_at DATETIME,

    FOREIGN KEY(parent_comment_id)
        REFERENCES comments(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post_parent ON comments(post_id, parent_comment_id);

CREATE VIEW IF NOT EXISTS user_comments AS
SELECT 
	c.*,
	u.name AS username,
	u.photo 
FROM comments c
LEFT JOIN users u ON c.user_id=u.id;

CREATE TRIGGER IF NOT EXISTS comments_insert_trigger
AFTER INSERT ON comments
WHEN NEW.parent_comment_id IS NULL
BEGIN
    UPDATE posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
END;

CREATE TRIGGER IF NOT EXISTS comments_delete_trigger
AFTER DELETE ON comments
WHEN OLD.parent_comment_id IS NULL
BEGIN
    UPDATE posts
    SET comments_count = comments_count - 1
    WHERE id = OLD.post_id;
END;


CREATE TRIGGER IF NOT EXISTS replies_insert_trigger
AFTER INSERT ON comments
WHEN NEW.parent_comment_id IS NOT NULL
BEGIN
    UPDATE comments
    SET reply_count = reply_count + 1
    WHERE id = NEW.parent_comment_id;
END;

CREATE TRIGGER IF NOT EXISTS replies_delete_trigger
AFTER DELETE ON comments
WHEN OLD.parent_comment_id IS NOT NULL
BEGIN
    UPDATE comments
    SET reply_count = reply_count - 1
    WHERE id = OLD.parent_comment_id;
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

CREATE TABLE IF NOT EXISTS reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    post_id INTEGER,
    comment_id INTEGER,

    reaction TEXT CHECK (reaction IN ('like', 'love', 'laugh', 'sad')),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL)
        OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),

    UNIQUE(user_id, post_id),
    UNIQUE(user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_comment ON reactions(comment_id);

-- WITH RECURSIVE thread AS (
--     SELECT
--         id,
--         parent_comment_id,
--         content,
-- 		username,
--         0 AS depth
--     FROM user_comments
--     WHERE post_id = 1
--       AND parent_comment_id IS NULL

--     UNION ALL

--     SELECT
--         c.id,
--         c.parent_comment_id,
--         c.content,
-- 		c.username,
--         t.depth + 1
--     FROM user_comments c
--     JOIN thread t
--         ON c.parent_comment_id = t.id
-- )
-- SELECT *
-- FROM thread
-- ORDER BY depth, id;

-- SELECT
--     reaction,
--     COUNT(*) AS total
-- FROM reactions
-- WHERE post_id = ?
-- GROUP BY reaction;

-- SELECT
--     reaction,
--     COUNT(*) AS total
-- FROM reactions
-- WHERE comment_id = ?
-- GROUP BY reaction;

-- ALTER TABLE posts
-- ADD COLUMN comment_count INTEGER NOT NULL DEFAULT 0;

-- ALTER TABLE posts
-- ADD COLUMN reaction_count INTEGER NOT NULL DEFAULT 0;

