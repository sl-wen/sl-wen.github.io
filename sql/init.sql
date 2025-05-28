-- 创建文章表
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT,
    author TEXT DEFAULT 'Admin',
    tags TEXT[] DEFAULT '{}',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 创建用户表
CREATE TABLE IF NOT EXISTS Userinfo (
    username TEXT NOT NULL,
    password TEXT,
    level INTEGER DEFAULT 0,
    amount INTEGER DEFAULT 0,
    adress TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 创建统计表
CREATE TABLE IF NOT EXISTS stats (
    id TEXT PRIMARY KEY,
    total_views INTEGER DEFAULT 0
);

-- 创建增加访问量的存储过程
CREATE OR REPLACE FUNCTION increment_views(row_id TEXT)
RETURNS TABLE (id TEXT, total_views INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    UPDATE stats
    SET total_views = total_views + 1
    WHERE id = row_id
    RETURNING id, total_views;
END;
$$;

-- 创建更新文章时间的触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();