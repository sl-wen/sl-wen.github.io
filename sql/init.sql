-- 创建用户表
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID REFERENCES auth.users(id),
    username TEXT PRIMARY KEY NOT NULL,
    email VARCHAR(100) DEFAULT null,
    level INTEGER DEFAULT 0,
    avatar_url TEXT,
    adress TEXT DEFAULT null,
    last_login TIMESTAMP,  -- 上次登录时间
    experience INT DEFAULT 0,
    coins INT DEFAULT 0,
    consecutive_logins INT DEFAULT 0, -- 连续登录天数
    farmdata JSONB DEFAULT null,  -- 存农场地图，比如瓦块，植物状态等
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 确保一个 auth 用户只对应一条资料
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_indexes
    WHERE  schemaname = 'public'
    AND    indexname = 'uniq_profiles_user_id'
  ) THEN
    CREATE UNIQUE INDEX uniq_profiles_user_id ON profiles(user_id);
  END IF;
END $$;

-- 启用 RLS 并添加最小策略（若尚未启用）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    -- 表尚未存在则跳过（由上方 CREATE TABLE 保障）
    NULL;
  END IF;

  -- 启用 RLS（幂等）
  EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';

  -- 仅允许本人读取、更新、插入自己的资料
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_own'
  ) THEN
    CREATE POLICY profiles_select_own ON public.profiles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_own'
  ) THEN
    CREATE POLICY profiles_update_own ON public.profiles
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_insert_self'
  ) THEN
    CREATE POLICY profiles_insert_self ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 创建文章表
CREATE TABLE IF NOT EXISTS posts (
    post_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT,
    author TEXT DEFAULT 'Admin',
    user_id UUID REFERENCES auth.users(id),
    tags TEXT[] DEFAULT '{}',
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 索引优化：常用排序与过滤字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_posts_created_at'
  ) THEN
    CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_posts_user_id'
  ) THEN
    CREATE INDEX idx_posts_user_id ON posts(user_id);
  END IF;

  -- 如果会基于 tags 过滤/搜索，使用 GIN 索引
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_posts_tags_gin'
  ) THEN
    CREATE INDEX idx_posts_tags_gin ON posts USING GIN (tags);
  END IF;
END $$;


-- 创建评论表
CREATE TABLE IF NOT EXISTS comments (
    comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(user_id),
    parent_id UUID REFERENCES comments(comment_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 评论常用查询加索引
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_comments_post_approved'
  ) THEN
    CREATE INDEX idx_comments_post_approved ON comments(post_id, is_approved);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_comments_parent_id'
  ) THEN
    CREATE INDEX idx_comments_parent_id ON comments(parent_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_comments_created_at'
  ) THEN
    CREATE INDEX idx_comments_created_at ON comments(created_at);
  END IF;
END $$;

-- 创建点赞表
CREATE TABLE IF NOT EXISTS post_reactions (
    reaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID  REFERENCES posts(post_id) ON DELETE CASCADE,
    user_id UUID  REFERENCES profiles(user_id),
    type  TEXT -- like, dislike
);

CREATE TABLE IF NOT EXISTS comment_reactions (
    reaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID   REFERENCES comments(comment_id) ON DELETE CASCADE,
    user_id UUID   REFERENCES profiles(user_id),
    type  TEXT -- like, dislike
);

-- 保证一个用户对一个目标只有一条反应记录 & 加速查询
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_post_reactions_post_user'
  ) THEN
    CREATE UNIQUE INDEX uniq_post_reactions_post_user ON post_reactions(post_id, user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_comment_reactions_comment_user'
  ) THEN
    CREATE UNIQUE INDEX uniq_comment_reactions_comment_user ON comment_reactions(comment_id, user_id);
  END IF;
END $$;

-- 用户等级表 (user_levels)
CREATE TABLE user_levels (
    level INT PRIMARY KEY,
    required_exp INT NOT NULL,
    daily_login_coins INT NOT NULL,
    daily_login_exp INT NOT NULL,
    level_up_reward_coins INT NOT NULL,
    level_name VARCHAR(50) NOT NULL,
    description VARCHAR(50) NOT NULL
);
INSERT INTO user_levels (level, required_exp, daily_login_exp, daily_login_coins, level_up_reward_coins,level_name, description) VALUES
(1, 50, 10, 5, 100, '新手', '刚刚开始的旅程'),
(2, 100, 15, 8, 100, '初学者', '迈出了第一步'),
(3, 300, 20, 10, 100, '学徒', '开始掌握基础知识'),
(4, 600, 25, 15, 200, '实习生', '逐渐熟悉系统'),
(5, 1000, 30, 20, 200, '熟练者', '已经相当熟练'),
(6, 1500, 40, 25, 300, '专家', '拥有丰富的经验'),
(7, 2100, 50, 30, 300, '大师', '精通各种技巧'),
(8, 2800, 60, 40, 400, '宗师', '登峰造极的水平'),
(9, 3600, 70, 50, 400, '传奇', '令人敬畏的存在'),
(10, 4500, 80, 60, 400, '神话', '已成为传说'),
(11, 5500, 100, 80, 500, '至尊', '达到了巅峰');

CREATE TABLE task_types (
    tasktype_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- 任务表 (tasks)
CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_name VARCHAR(100) NOT NULL,
    task_description TEXT,
    tasktype_id UUID REFERENCES task_types(tasktype_id) NOT NULL,
    action_type TEXT NOT NULL, -- login, like, comment, post, etc.
    required_count INT NOT NULL, --任务次数
    coins_reward INT NOT NULL,
    exp_reward INT NOT NULL,
    min_level INTEGER DEFAULT 0, -- 最低等级要求
    max_level INTEGER DEFAULT 999, -- 最高等级限制 (999表示无上限)
    is_active BOOLEAN DEFAULT true,
    reset_frequency TEXT -- daily, weekly, none
);
-- 日常任务
 INSERT INTO tasks (task_name, task_description, tasktype_id, action_type, required_count, coins_reward, exp_reward, reset_frequency) VALUES 
 ('每日登录', '今天登录游戏', (SELECT tasktype_id FROM task_types WHERE name = 'daily'), 'login', 1, 20, 10, 'daily'), 
 ('点赞达人', '今天给5个帖子点赞', (SELECT tasktype_id FROM task_types WHERE name = 'daily'), 'like', 5, 30, 15, 'daily'), 
 ('评论先锋', '今天发表3条评论', (SELECT tasktype_id FROM task_types WHERE name = 'daily'), 'comment', 3, 40, 20, 'daily'), 
 ('分享精神', '今天发布1个帖子', (SELECT tasktype_id FROM task_types WHERE name = 'daily'), 'post', 1, 50, 25, 'daily');

 -- 周常任务 
 INSERT INTO tasks (task_name, task_description, tasktype_id, action_type, required_count, coins_reward, exp_reward, reset_frequency) VALUES 
 ('周活跃', '本周登录5天', (SELECT id FROM task_types WHERE name = 'weekly'), 'login', 5, 100, 50, 'weekly'), 
 ('周点赞', '本周给20个帖子点赞', (SELECT id FROM task_types WHERE name = 'weekly'), 'like', 20, 120, 60, 'weekly'), 
 ('周评论', '本周发表10条评论', (SELECT id FROM task_types WHERE name = 'weekly'), 'comment', 10, 150, 75, 'weekly'), 
 ('周分享', '本周发布3个帖子', (SELECT id FROM task_types WHERE name = 'weekly'), 'post', 3, 200, 100, 'weekly');
-- 成就任务 
 INSERT INTO tasks (task_name, task_description, tasktype_id, action_type, required_count, coins_reward, exp_reward, reset_frequency) VALUES 
('初来乍到', '首次登录', (SELECT id FROM task_types WHERE name = 'achievement'), 'login', 1, 50, 25, 'none'), 
('点赞新手', '累计点赞10次', (SELECT id FROM task_types WHERE name = 'achievement'), 'like', 10, 100, 50, 'none'), 
('点赞专家', '累计点赞100次', (SELECT id FROM task_types WHERE name = 'achievement'), 'like', 100, 200, 100, 'none'), 
('点赞大师', '累计点赞1000次', (SELECT id FROM task_types WHERE name = 'achievement'), 'like', 1000, 500, 250, 'none'), 
('评论新手', '累计评论10次', (SELECT id FROM task_types WHERE name = 'achievement'), 'comment', 10, 100, 50, 'none'), 
('评论专家', '累计评论100次', (SELECT id FROM task_types WHERE name = 'achievement'), 'comment', 100, 200, 100, 'none'), 
('评论大师', '累计评论1000次', (SELECT id FROM task_types WHERE name = 'achievement'), 'comment', 1000, 500, 250, 'none'), 
('内容创作者', '累计发布10个帖子', (SELECT id FROM task_types WHERE name = 'achievement'), 'post', 10, 200, 100, 'none'), 
('资深创作者', '累计发布100个帖子', (SELECT id FROM task_types WHERE name = 'achievement'), 'post', 100, 500, 250, 'none'), 
('受欢迎的创作者', '累计获得100个点赞', (SELECT id FROM task_types WHERE name = 'achievement'), 'be_liked', 100, 300, 150, 'none'), 
('人气创作者', '累计获得1000个点赞', (SELECT id FROM task_types WHERE name = 'achievement'), 'be_liked', 1000, 800, 400, 'none');
-- 行为任务（连续登录） 
 INSERT INTO tasks (task_name, task_description, tasktype_id, action_type, required_count, coins_reward, exp_reward, reset_frequency) VALUES
('连续登录3天', '连续登录3天', (SELECT id FROM task_types WHERE name = 'behavior'), 'consecutive_login', 3, 60, 30, 'none'), 
('连续登录7天', '连续登录7天', (SELECT id FROM task_types WHERE name = 'behavior'), 'consecutive_login', 7, 120, 60, 'none'), 
('连续登录15天', '连续登录15天', (SELECT id FROM task_types WHERE name = 'behavior'), 'consecutive_login', 15, 250, 125, 'none'), 
('连续登录30天', '连续登录30天', (SELECT id FROM task_types WHERE name = 'behavior'), 'consecutive_login', 30, 500, 250, 'none'), 
('连续登录60天', '连续登录60天', (SELECT id FROM task_types WHERE name = 'behavior'), 'consecutive_login', 60, 1000, 500, 'none'), 
('连续登录100天', '连续登录100天', (SELECT id FROM task_types WHERE name = 'behavior'), 'consecutive_login', 100, 2000, 1000, 'none');

-- 用户任务进度表 (user_tasks)
CREATE TABLE user_tasks (
    usertask_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    task_id UUID REFERENCES tasks(task_id),
    current_count INTEGER DEFAULT 0,
    is_claimed BOOLEAN DEFAULT false, -- 是否已领取奖励
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 用户任务进度视图 (user_tasks，tasks，task_types)
CREATE VIEW user_tasks_view AS
SELECT
  u.*,
  t.task_name,
  t.task_description,
  t.tasktype_id,
  t.action_type,
  t.required_count,
  t.coins_reward,
  t.exp_reward,
  t.reset_frequency,
  p.name,
  p.description
  
FROM
  user_tasks u
LEFT JOIN
  tasks t
ON
  u.task_id = t.task_id
LEFT JOIN
  task_types p
ON
  t.tasktype_id = p.tasktype_id;

-- 用户行为记录表 (user_activities)
CREATE TABLE user_activities (
    activity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL, -- login, like, comment, post, etc.
    target_id TEXT, -- 可以是帖子ID、评论ID等
    target_type TEXT, -- post, comment, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
--任务奖励历史表 (task_reward_history)
CREATE TABLE task_reward_history (
  task_reward_history_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  task_id UUID REFERENCES tasks(task_id) NOT NULL,
  experience_gained INTEGER NOT NULL DEFAULT 0,
  coins_gained INTEGER NOT NULL DEFAULT 0,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
-- 创建统计表
CREATE TABLE IF NOT EXISTS stats (
    stats_id TEXT PRIMARY KEY,
    total_views INTEGER DEFAULT 0
);

-- 站点级默认统计记录
INSERT INTO stats (stats_id, total_views)
VALUES ('site', 0)
ON CONFLICT (stats_id) DO NOTHING;

-- 文章列表轻量视图：避免在列表页传输整篇 content
CREATE OR REPLACE VIEW posts_list_view AS
SELECT
  post_id,
  title,
  author,
  user_id,
  tags,
  views,
  likes_count,
  dislikes_count,
  comments_count,
  created_at,
  updated_at,
  LEFT(COALESCE(content, ''), 200) AS excerpt,
  LENGTH(COALESCE(content, '')) AS content_length
FROM posts;

-- 原子自增 RPC：文章浏览量 +1，返回最新值
CREATE OR REPLACE FUNCTION increment_post_views(p_post_id uuid)
RETURNS INTEGER
LANGUAGE sql
AS $$
  UPDATE posts
  SET views = views + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE post_id = p_post_id
  RETURNING views;
$$;

-- 原子自增 RPC：站点总浏览量 +1，返回最新值
CREATE OR REPLACE FUNCTION increment_site_views()
RETURNS INTEGER
LANGUAGE sql
AS $$
  INSERT INTO stats (stats_id, total_views)
  VALUES ('site', 0)
  ON CONFLICT (stats_id) DO NOTHING;

  UPDATE stats
  SET total_views = total_views + 1
  WHERE stats_id = 'site'
  RETURNING total_views;
$$;


-- 创建一个函数来检查任务是否需要重置
CREATE OR REPLACE FUNCTION check_task_reset() RETURNS TRIGGER AS $$
DECLARE
  task_reset_frequency TEXT;
  last_update_date DATE;
  current_date DATE := CURRENT_DATE;
  days_since_update INTEGER;
  last_day_of_week INTEGER;
BEGIN
  -- 获取任务的重置频率
  SELECT reset_frequency INTO task_reset_frequency
  FROM tasks
  WHERE task_id = NEW.task_id;
  
  -- 如果是首次创建记录，不需要重置
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- 获取上次更新日期
  last_update_date := DATE(OLD.updated_at);
  
  -- 根据重置频率检查是否需要重置
  IF task_reset_frequency = 'daily' THEN
    -- 如果是新的一天，重置任务
    IF last_update_date < current_date THEN
      NEW.current_count := 0;
      NEW.is_completed := false;
      NEW.is_claimed := false;
      NEW.completed_at := NULL;
      NEW.claimed_at := NULL;
    END IF;
  ELSIF task_reset_frequency = 'weekly' THEN
    -- 计算自上次更新以来的天数
    days_since_update := current_date - last_update_date;
    -- 获取上次更新是星期几 (1=周一, 7=周日)
    last_day_of_week := EXTRACT(DOW FROM last_update_date);
    IF last_day_of_week = 0 THEN last_day_of_week := 7; END IF;
    
    -- 如果已经过了一周，重置任务
    -- 例如，如果上次更新是周三(3)，那么需要经过(8-3)=5天才算新的一周
    IF days_since_update >= (8 - last_day_of_week) THEN
      NEW.current_count := 0;
      NEW.is_completed := false;
      NEW.is_claimed := false;
      NEW.completed_at := NULL;
      NEW.claimed_at := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_check_task_reset
BEFORE UPDATE ON user_tasks
FOR EACH ROW
EXECUTE FUNCTION check_task_reset();