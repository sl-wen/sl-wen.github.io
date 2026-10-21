-- ===========================================================================
-- Next.js 项目 Supabase 完整建表 SQL
-- 生成日期：2026-07-01
-- 说明：包含所有表、视图、索引、RLS 策略、触发器、RPC 函数
-- ===========================================================================

-- ===========================================================================
-- 扩展插件
-- ===========================================================================
create extension if not exists "uuid-ossp";       -- UUID 生成
create extension if not exists "pgcrypto";         -- 加密/UUID 辅助

-- ===========================================================================
-- 1. profiles — 用户资料表
-- ===========================================================================
create table if not exists public.profiles (
    user_id            uuid         primary key default auth.uid(),
    username           text         not null default '',
    email              text,
    avatar_url         text,
    level              integer      not null default 1,
    coins              integer      not null default 0,
    experience         integer      not null default 0,
    consecutive_logins integer      not null default 0,
    last_login         timestamptz,
    farmdata           jsonb,                                   -- 游戏存档（数组/对象均可）
    created_at         timestamptz  not null default now(),
    updated_at         timestamptz  not null default now(),

    constraint profiles_user_id_fkey
        foreign key (user_id) references auth.users (id) on delete cascade
);

comment on table  public.profiles is '用户资料表';
comment on column public.profiles.farmdata is 'Topdown 游戏存档快照（JSON）';

-- ===========================================================================
-- 2. user_levels — 用户等级配置表
-- ===========================================================================
create table if not exists public.user_levels (
    level                 integer      primary key,
    required_exp          integer      not null default 0,
    daily_login_exp       integer      not null default 0,
    daily_login_coins     integer      not null default 0,
    level_up_reward_coins integer      not null default 0
);

comment on table public.user_levels is '用户等级配置表';

-- ===========================================================================
-- 3. task_types — 任务类型表
-- ===========================================================================
create table if not exists public.task_types (
    tasktype_id  uuid         primary key default uuid_generate_v4(),
    name         text         not null,
    description  text
);

comment on table public.task_types is '任务类型表';

-- ===========================================================================
-- 4. tasks — 任务表
-- ===========================================================================
create table if not exists public.tasks (
    task_id          uuid         primary key default uuid_generate_v4(),
    task_name        text         not null,
    task_description text,
    tasktype_id      uuid         references public.task_types (tasktype_id) on delete set null,
    action_type      text         not null,                         -- daily_login / post_article / consecutive_login ...
    required_count   integer      not null default 1,
    coins_reward     integer      not null default 0,
    exp_reward       integer      not null default 0,
    min_level        integer      not null default 1,
    max_level        integer,
    is_active        boolean      not null default true,
    reset_frequency  text         not null default 'never',          -- daily / weekly / never
    created_at       timestamptz  not null default now()
);

comment on table public.tasks is '任务定义表';

-- ===========================================================================
-- 5. user_tasks — 用户任务进度表
-- ===========================================================================
create table if not exists public.user_tasks (
    usertask_id   uuid         primary key default uuid_generate_v4(),
    user_id       uuid         not null references public.profiles (user_id) on delete cascade,
    task_id       uuid         not null references public.tasks (task_id) on delete cascade,
    current_count integer      not null default 0,
    is_claimed    boolean      not null default false,
    claimed_at    timestamptz,
    created_at    timestamptz  not null default now(),
    updated_at    timestamptz  not null default now(),

    constraint user_tasks_user_id_task_id_key unique (user_id, task_id)
);

comment on table public.user_tasks is '用户任务进度表';

-- ===========================================================================
-- 6. task_progress — 任务进度（独立于 user_tasks，用于 start/complete 流程）
-- ===========================================================================
create table if not exists public.task_progress (
    id            uuid         primary key default uuid_generate_v4(),
    user_id       uuid         not null references public.profiles (user_id) on delete cascade,
    task_id       uuid         not null references public.tasks (task_id) on delete cascade,
    status        text         not null default 'in_progress',       -- in_progress / completed
    started_at    timestamptz  not null default now(),
    completed_at  timestamptz
);

comment on table public.task_progress is '任务进度跟踪表（start/complete 流程）';

-- ===========================================================================
-- 7. task_reward_history — 任务奖励历史表
-- ===========================================================================
create table if not exists public.task_reward_history (
    task_reward_history_id uuid         primary key default uuid_generate_v4(),
    user_id                uuid         not null references public.profiles (user_id) on delete cascade,
    task_id                uuid         not null references public.tasks (task_id) on delete cascade,
    coins_gained           integer      not null default 0,
    experience_gained      integer      not null default 0,
    claimed_at             timestamptz  not null default now()
);

comment on table public.task_reward_history is '任务奖励领取历史';

-- ===========================================================================
-- 8. posts — 文章表
-- ===========================================================================
create table if not exists public.posts (
    post_id        uuid         primary key default uuid_generate_v4(),
    title          text         not null,
    content        text         not null default '',
    author         text,
    user_id        uuid         references public.profiles (user_id) on delete set null,
    tags           text[]       default '{}',                        -- 标签数组
    views          integer      not null default 0,
    likes_count    integer      not null default 0,
    dislikes_count integer      not null default 0,
    comments_count integer      not null default 0,
    created_at     timestamptz  not null default now(),
    updated_at     timestamptz  not null default now()
);

comment on table public.posts is '文章/帖子表';

-- ===========================================================================
-- 9. comments — 评论表
-- ===========================================================================
create table if not exists public.comments (
    comment_id     uuid         primary key default uuid_generate_v4(),
    post_id        uuid         not null references public.posts (post_id) on delete cascade,
    user_id        uuid         references public.profiles (user_id) on delete set null,
    parent_id      uuid         references public.comments (comment_id) on delete cascade,
    content        text         not null default '',
    is_approved    boolean      default true,
    likes_count    integer      not null default 0,
    dislikes_count integer      not null default 0,
    created_at     timestamptz  not null default now(),
    updated_at     timestamptz  not null default now()
);

comment on table public.comments is '评论表（支持嵌套）';

-- ===========================================================================
-- 10. post_reactions — 文章反应表
-- ===========================================================================
create table if not exists public.post_reactions (
    reaction_id  uuid         primary key default uuid_generate_v4(),
    post_id      uuid         not null references public.posts (post_id) on delete cascade,
    user_id      uuid         not null references public.profiles (user_id) on delete cascade,
    type         text         not null,                             -- like / dislike
    created_at   timestamptz  not null default now(),

    constraint post_reactions_post_user_key unique (post_id, user_id),
    constraint post_reactions_type_check check (type in ('like', 'dislike'))
);

comment on table public.post_reactions is '文章点赞/踩记录';

-- ===========================================================================
-- 11. comment_reactions — 评论反应表
-- ===========================================================================
create table if not exists public.comment_reactions (
    reaction_id  uuid         primary key default uuid_generate_v4(),
    comment_id   uuid         not null references public.comments (comment_id) on delete cascade,
    user_id      uuid         not null references public.profiles (user_id) on delete cascade,
    type         text         not null,                             -- like / dislike
    created_at   timestamptz  not null default now(),

    constraint comment_reactions_comment_user_key unique (comment_id, user_id),
    constraint comment_reactions_type_check check (type in ('like', 'dislike'))
);

comment on table public.comment_reactions is '评论点赞/踩记录';

-- ===========================================================================
-- 12. stats — 统计表
-- ===========================================================================
create table if not exists public.stats (
    status_id    text         primary key,                          -- 'views' 等
    total_views  integer      not null default 0
);

comment on table public.stats is '站点统计表';

-- ===========================================================================
-- 13. polls — 投票表
-- ===========================================================================
create table if not exists public.polls (
    poll_id           uuid         primary key default uuid_generate_v4(),
    creator_user_id   uuid         references public.profiles (user_id) on delete set null,
    creator_device_id text,                                              -- 游客设备指纹
    title             text         not null,
    description       text,
    max_choices       integer      not null default 1,
    expires_at        timestamptz,
    total_votes       integer      not null default 0,
    created_at        timestamptz  not null default now()
);

comment on table public.polls is '投票主题表';

-- ===========================================================================
-- 14. poll_options — 投票选项表
-- ===========================================================================
create table if not exists public.poll_options (
    option_id   uuid         primary key default uuid_generate_v4(),
    poll_id     uuid         not null references public.polls (poll_id) on delete cascade,
    text        text         not null,
    votes_count integer      not null default 0
);

comment on table public.poll_options is '投票选项表';

-- ===========================================================================
-- 15. poll_votes — 投票记录表
-- ===========================================================================
create table if not exists public.poll_votes (
    vote_id          uuid         primary key default uuid_generate_v4(),
    poll_id          uuid         not null references public.polls (poll_id) on delete cascade,
    option_id        uuid         not null references public.poll_options (option_id) on delete cascade,
    voter_user_id    uuid         references public.profiles (user_id) on delete set null,
    voter_device_id  text,                                             -- 游客设备指纹
    created_at       timestamptz  not null default now()
);

comment on table public.poll_votes is '投票记录表';

-- ===========================================================================
-- ============================ 视 图 =========================================
-- ===========================================================================

-- -------------------------------------------------------------------------
-- user_tasks_view — 用户任务完整视图（join user_tasks + tasks + task_types）
-- -------------------------------------------------------------------------
create or replace view public.user_tasks_view as
select
    ut.usertask_id,
    ut.user_id,
    ut.task_id,
    ut.current_count,
    ut.is_claimed,
    ut.claimed_at,
    ut.created_at,
    ut.updated_at,
    t.task_name,
    t.task_description,
    t.tasktype_id,
    t.action_type,
    t.required_count,
    t.coins_reward,
    t.exp_reward,
    t.min_level,
    t.max_level,
    t.is_active,
    t.reset_frequency,
    tt.name           as name,            -- 任务类型名称
    tt.description    as description      -- 任务类型描述
from public.user_tasks ut
    inner join public.tasks      t  on t.task_id     = ut.task_id
    left  join public.task_types tt on tt.tasktype_id = t.tasktype_id;

comment on view public.user_tasks_view is '用户任务完整信息视图';

-- -------------------------------------------------------------------------
-- polls_view — 投票 + 选项聚合视图（options 为 JSON 数组）
-- -------------------------------------------------------------------------
create or replace view public.polls_view as
select
    p.poll_id,
    p.creator_user_id,
    p.creator_device_id,
    p.title,
    p.description,
    p.max_choices,
    p.expires_at,
    p.created_at,
    p.total_votes,
    coalesce(
        json_agg(
            json_build_object(
                'option_id',   o.option_id,
                'poll_id',     o.poll_id,
                'text',        o.text,
                'votes_count', o.votes_count
            ) order by o.option_id
        ) filter (where o.option_id is not null),
        '[]'::json
    ) as options
from public.polls p
    left join public.poll_options o on o.poll_id = p.poll_id
group by p.poll_id;

comment on view public.polls_view is '投票主表 + 选项聚合视图';

-- ===========================================================================
-- ============================ 索 引 =========================================
-- ===========================================================================

create index if not exists idx_tasks_tasktype_id        on public.tasks (tasktype_id);
create index if not exists idx_tasks_action_type        on public.tasks (action_type);
create index if not exists idx_tasks_is_active_minlevel on public.tasks (is_active, min_level);

create index if not exists idx_user_tasks_user_id       on public.user_tasks (user_id);
create index if not exists idx_user_tasks_task_id       on public.user_tasks (task_id);

create index if not exists idx_task_progress_user_task  on public.task_progress (user_id, task_id);

create index if not exists idx_reward_history_user      on public.task_reward_history (user_id);
create index if not exists idx_reward_history_task      on public.task_reward_history (task_id);
create index if not exists idx_reward_history_claimed   on public.task_reward_history (claimed_at desc);

create index if not exists idx_posts_user_id            on public.posts (user_id);
create index if not exists idx_posts_created_at         on public.posts (created_at desc);

create index if not exists idx_comments_post_id         on public.comments (post_id);
create index if not exists idx_comments_user_id         on public.comments (user_id);
create index if not exists idx_comments_parent_id       on public.comments (parent_id);

create index if not exists idx_post_reactions_post      on public.post_reactions (post_id);
create index if not exists idx_post_reactions_user      on public.post_reactions (user_id);

create index if not exists idx_comment_reactions_cmt    on public.comment_reactions (comment_id);
create index if not exists idx_comment_reactions_user   on public.comment_reactions (user_id);

create index if not exists idx_polls_creator_user       on public.polls (creator_user_id);
create index if not exists idx_polls_creator_device     on public.polls (creator_device_id);

create index if not exists idx_poll_options_poll        on public.poll_options (poll_id);

create index if not exists idx_poll_votes_poll          on public.poll_votes (poll_id);
create index if not exists idx_poll_votes_option        on public.poll_votes (option_id);
create index if not exists idx_poll_votes_voter_user    on public.poll_votes (voter_user_id);
create index if not exists idx_poll_votes_voter_device  on public.poll_votes (voter_device_id);

-- ===========================================================================
-- ============================ 触 发 器 ======================================
-- ===========================================================================

-- profiles 自动更新 updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger trg_profiles_updated_at
    before update on public.profiles
    for each row execute function public.handle_updated_at();

create trigger trg_user_tasks_updated_at
    before update on public.user_tasks
    for each row execute function public.handle_updated_at();

create trigger trg_posts_updated_at
    before update on public.posts
    for each row execute function public.handle_updated_at();

create trigger trg_comments_updated_at
    before update on public.comments
    for each row execute function public.handle_updated_at();

-- 新用户注册时自动创建 profiles 行（可选，当前代码在 login 页手动 insert）
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (user_id, username, email, level, coins, experience)
    values (
        new.id,
        split_part(new.email, '@', 1),
        new.email,
        1, 0, 0
    )
    on conflict (user_id) do nothing;
    return new;
end;
$$;

create trigger trg_on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ===========================================================================
-- ============================ RLS 行级安全 =================================
-- ===========================================================================

-- 启用 RLS
alter table public.profiles            enable row level security;
alter table public.user_tasks          enable row level security;
alter table public.task_progress       enable row level security;
alter table public.task_reward_history enable row level security;
alter table public.posts               enable row level security;
alter table public.comments            enable row level security;
alter table public.post_reactions      enable row level security;
alter table public.comment_reactions   enable row level security;

-- public 读 / 用户只能写自己的（投票、统计、任务配置等公开表不启用 RLS）
alter table public.user_levels        enable row level security;
alter table public.tasks              enable row level security;
alter table public.task_types         enable row level security;

-- ---- profiles ----
create policy "profiles_select_own" on public.profiles
    for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles
    for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles
    for update using (auth.uid() = user_id);
create policy "profiles_delete_own" on public.profiles
    for delete using (auth.uid() = user_id);

-- ---- user_levels / tasks / task_types（所有登录用户可读）----
create policy "user_levels_select_all" on public.user_levels
    for select using (true);
create policy "tasks_select_all" on public.tasks
    for select using (true);
create policy "task_types_select_all" on public.task_types
    for select using (true);

-- ---- user_tasks ----
create policy "user_tasks_select_own" on public.user_tasks
    for select using (auth.uid() = user_id);
create policy "user_tasks_insert_own" on public.user_tasks
    for insert with check (auth.uid() = user_id);
create policy "user_tasks_update_own" on public.user_tasks
    for update using (auth.uid() = user_id);

-- ---- task_progress ----
create policy "task_progress_select_own" on public.task_progress
    for select using (auth.uid() = user_id);
create policy "task_progress_insert_own" on public.task_progress
    for insert with check (auth.uid() = user_id);
create policy "task_progress_update_own" on public.task_progress
    for update using (auth.uid() = user_id);

-- ---- task_reward_history ----
create policy "reward_history_select_own" on public.task_reward_history
    for select using (auth.uid() = user_id);
create policy "reward_history_insert_own" on public.task_reward_history
    for insert with check (auth.uid() = user_id);

-- ---- posts（公开读，作者可写）----
create policy "posts_select_all" on public.posts
    for select using (true);
create policy "posts_insert_own" on public.posts
    for insert with check (auth.uid() = user_id);
create policy "posts_update_own" on public.posts
    for update using (auth.uid() = user_id);
create policy "posts_delete_own" on public.posts
    for delete using (auth.uid() = user_id);

-- ---- comments（公开读已审核评论，作者可写）----
create policy "comments_select_all" on public.comments
    for select using (true);
create policy "comments_insert_own" on public.comments
    for insert with check (auth.uid() = user_id);
create policy "comments_update_own" on public.comments
    for update using (auth.uid() = user_id);
create policy "comments_delete_own" on public.comments
    for delete using (auth.uid() = user_id);

-- ---- post_reactions ----
create policy "post_reactions_select_all" on public.post_reactions
    for select using (true);
create policy "post_reactions_insert_own" on public.post_reactions
    for insert with check (auth.uid() = user_id);
create policy "post_reactions_update_own" on public.post_reactions
    for update using (auth.uid() = user_id);
create policy "post_reactions_delete_own" on public.post_reactions
    for delete using (auth.uid() = user_id);

-- ---- comment_reactions ----
create policy "comment_reactions_select_all" on public.comment_reactions
    for select using (true);
create policy "comment_reactions_insert_own" on public.comment_reactions
    for insert with check (auth.uid() = user_id);
create policy "comment_reactions_update_own" on public.comment_reactions
    for update using (auth.uid() = user_id);
create policy "comment_reactions_delete_own" on public.comment_reactions
    for delete using (auth.uid() = user_id);

-- ===========================================================================
-- ====================== RPC 存 储 过 程 =====================================
-- ===========================================================================

-- -------------------------------------------------------------------------
-- update_user_rewards — 更新用户金币和经验值
-- -------------------------------------------------------------------------
create or replace function public.update_user_rewards(
    p_user_id uuid,
    p_coins   integer,
    p_exp     integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.profiles
       set coins      = coins      + p_coins,
           experience = experience + p_exp,
           updated_at = now()
     where user_id = p_user_id;
end;
$$;

-- -------------------------------------------------------------------------
-- create_poll_with_options — 创建投票（含选项），原子操作
-- 返回：polls_view 中对应的一行（含 options JSON 数组）
-- -------------------------------------------------------------------------
create or replace function public.create_poll_with_options(
    p_title             text,
    p_description       text,
    p_options           text[],
    p_max_choices       integer,
    p_expires_at        timestamptz,
    p_creator_user_id   uuid,
    p_creator_device_id text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_poll_id   uuid := uuid_generate_v4();
    v_option    text;
begin
    -- 频次限制：同一 user_id 或 device_id 每天只能创建 1 次
    if exists (
        select 1 from public.polls
         where created_at::date = current_date
           and (
               (p_creator_user_id is not null and creator_user_id = p_creator_user_id)
               or
               (p_creator_device_id is not null and creator_device_id = p_creator_device_id)
           )
    ) then
        raise exception '今天已创建过投票，请明天再试';
    end if;

    -- 插入投票主体
    insert into public.polls (poll_id, creator_user_id, creator_device_id,
                              title, description, max_choices, expires_at)
    values (v_poll_id, p_creator_user_id, p_creator_device_id,
            p_title, p_description, p_max_choices, p_expires_at);

    -- 插入所有选项
    foreach v_option in array p_options loop
        insert into public.poll_options (poll_id, text)
        values (v_poll_id, v_option);
    end loop;

    -- 返回完整视图数据
    return (
        select row_to_json(t) from (
            select * from public.polls_view where poll_id = v_poll_id
        ) t
    );
end;
$$;

-- -------------------------------------------------------------------------
-- vote_on_poll — 提交投票（校验 max_choices、幂等、更新计数）
-- -------------------------------------------------------------------------
create or replace function public.vote_on_poll(
    p_poll_id         uuid,
    p_option_ids      uuid[],
    p_voter_user_id   uuid,
    p_voter_device_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_max_choices integer;
    v_already     boolean;
begin
    -- 校验：必须提供 user_id 或 device_id
    if p_voter_user_id is null and p_voter_device_id is null then
        raise exception '无法识别投票者身份';
    end if;

    -- 获取 max_choices
    select max_choices into v_max_choices
      from public.polls where poll_id = p_poll_id;

    if not found then
        raise exception '投票不存在';
    end if;

    -- 校验选择数量
    if array_length(p_option_ids, 1) > v_max_choices then
        raise exception '选择的选项数量超过最大可选数';
    end if;

    -- 幂等检查：一人一票
    select exists (
        select 1 from public.poll_votes
         where poll_id = p_poll_id
           and (
               (p_voter_user_id is not null and voter_user_id = p_voter_user_id)
               or
               (p_voter_device_id is not null and voter_device_id = p_voter_device_id)
           )
    ) into v_already;

    if v_already then
        raise exception '已参与过该投票';
    end if;

    -- 插入投票记录 + 更新计数
    insert into public.poll_votes (poll_id, option_id, voter_user_id, voter_device_id)
    select p_poll_id, unnest(p_option_ids), p_voter_user_id, p_voter_device_id;

    -- 更新选项票数
    update public.poll_options
       set votes_count = votes_count + 1
     where poll_id = p_poll_id
       and option_id = any(p_option_ids);

    -- 更新投票总票数
    update public.polls
       set total_votes = total_votes + array_length(p_option_ids, 1)
     where poll_id = p_poll_id;
end;
$$;

-- -------------------------------------------------------------------------
-- has_created_poll_today — 检查今天是否已创建过投票
-- -------------------------------------------------------------------------
create or replace function public.has_created_poll_today(
    p_creator_user_id   uuid,
    p_creator_device_id text
)
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.polls
         where created_at::date = current_date
           and (
               (p_creator_user_id is not null and creator_user_id = p_creator_user_id)
               or
               (p_creator_device_id is not null and creator_device_id = p_creator_device_id)
           )
    );
$$;

-- -------------------------------------------------------------------------
-- has_voted_on_poll — 检查是否已对某投票投过票
-- -------------------------------------------------------------------------
create or replace function public.has_voted_on_poll(
    p_poll_id         uuid,
    p_voter_user_id   uuid,
    p_voter_device_id text
)
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.poll_votes
         where poll_id = p_poll_id
           and (
               (p_voter_user_id is not null and voter_user_id = p_voter_user_id)
               or
               (p_voter_device_id is not null and voter_device_id = p_voter_device_id)
           )
    );
$$;

-- ===========================================================================
-- ============================ 初始数据 ======================================
-- ===========================================================================

-- stats 默认行
insert into public.stats (status_id, total_views)
values ('views', 0)
on conflict (status_id) do nothing;

-- user_levels 示例数据（前 10 级）
insert into public.user_levels (level, required_exp, daily_login_exp, daily_login_coins, level_up_reward_coins)
values
    (1,  0,    10, 5,   0),
    (2,  100,  10, 5,   10),
    (3,  250,  12, 6,   20),
    (4,  450,  12, 6,   30),
    (5,  750,  15, 8,   50),
    (6,  1100, 15, 8,   70),
    (7,  1550, 18, 10,  100),
    (8,  2100, 18, 10,  130),
    (9,  2750, 20, 12,  160),
    (10, 3500, 20, 12,  200)
on conflict (level) do nothing;

-- task_types 示例
insert into public.task_types (name, description)
values
    ('日常任务', '每天可完成的常规任务'),
    ('周常任务', '每周可完成的任务'),
    ('成就任务', '一次性长期目标')
on conflict do nothing;

-- ===========================================================================
-- 结束
-- ===========================================================================
