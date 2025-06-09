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
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id),
    username TEXT PRIMARY KEY NOT NULL,
    email VARCHAR(100) DEFAULT null,
    password TEXT,
    level INTEGER DEFAULT 0,
    amount INTEGER DEFAULT 0,
    adress TEXT DEFAULT null,
    last_login TIMESTAMP,
    experience INT DEFAULT 0,
    coins INT DEFAULT 0,
    consecutive_logins INT DEFAULT 0,
    last_daily_reward TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建触发器，在用户注册时自动创建资料
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.userinfo (id, username, email)
  VALUES (
    NEW.id, 
    SPLIT_PART(NEW.email, '@', 1), -- 使用邮箱前缀作为默认用户名
    NEW.email -- 使用邮箱   
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 创建评论表
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author TEXT DEFAULT 'Admin',
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
-- 用户等级表 (user_levels)
CREATE TABLE user_levels (
    level INT PRIMARY KEY,
    level_name VARCHAR(50) NOT NULL,
    required_exp INT NOT NULL,
    daily_login_coins INT NOT NULL,
    daily_login_exp INT NOT NULL,
    article_coin_multiplier DECIMAL(3,1) NOT NULL,
    article_exp_multiplier DECIMAL(3,1) NOT NULL,
    level_up_reward_coins INT NOT NULL
);
-- 用户行为记录表 (user_activities)
CREATE TABLE user_activities (
    activity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INT NOT NULL,
    activity_type TEXT NOT NULL,
    target_id INT,  -- 关联的文章ID或评论ID等
    coins_earned INT NOT NULL DEFAULT 0,
    exp_earned INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 任务表 (tasks)
CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_name VARCHAR(100) NOT NULL,
    task_description TEXT,
    task_type TEXT NOT NULL,
    coins_reward INT NOT NULL,
    exp_reward INT NOT NULL,
    required_actions INT NOT NULL,
    action_type VARCHAR(50) NOT NULL
);
-- 用户任务进度表 (user_tasks)
CREATE TABLE user_tasks (
    user_id INT NOT NULL,
    task_id INT NOT NULL,
    progress INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, task_id)
);
-- 创建统计表
CREATE TABLE IF NOT EXISTS stats (
    id TEXT PRIMARY KEY,
    total_views INTEGER DEFAULT 0
);