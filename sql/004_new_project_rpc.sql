-- ============================================================
-- 004_new_project_rpc.sql (2026-10-21 切换新 Supabase 项目 tdiknrktmgbetvcyhdav)
-- 目标：在**新项目**部署全套交互 RPC（自 003 改编，适配新库 schema）
-- 差异适配：
--   * 新库 stats 表主键列 = stats_id（老库是 status_id）
--   * 新库已有 user_activities 表（老库没有，本次不用）
-- 幂等：可重复执行
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- 1. stats 触发器（防客户端直改，给 RPC 豁免） ----------

create or replace function public.guard_stats_direct_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (current_setting('app.bypass_counter_guard', true) is distinct from 'on') then
    raise exception 'stats are maintained by RPC only';
  end if;
  return new;
end;
$$;

comment on function public.guard_stats_direct_update() is '客户端不得直改 stats，仅 increment_site_views RPC 可改';

drop trigger if exists trg_guard_stats on public.stats;
drop trigger if exists guard_stats_direct_update on public.stats;
create trigger trg_guard_stats
  before update on public.stats
  for each row execute function public.guard_stats_direct_update();


-- ---------- 2. increment_site_views（带豁免，主键 stats_id） ----------

create or replace function public.increment_site_views()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_views integer;
begin
  perform set_config('app.bypass_counter_guard', 'on', true);
  update public.stats
  set total_views = total_views + 1
  where stats_id = 'views'
  returning total_views into v_new_views;

  if v_new_views is null then
    insert into public.stats (stats_id, total_views)
    values ('views', 1)
    on conflict (stats_id) do update set total_views = public.stats.total_views + 1
    returning total_views into v_new_views;
  end if;

  return v_new_views;
end;
$$;

comment on function public.increment_site_views() is '站点访问量原子 +1';

grant execute on function public.increment_site_views() to anon, authenticated;


-- ---------- 3. increment_post_views ----------

create or replace function public.increment_post_views(p_post_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_views integer;
begin
  perform set_config('app.bypass_counter_guard', 'on', true);
  update public.posts
  set views = coalesce(views, 0) + 1
  where post_id = p_post_id
  returning views into v_new_views;

  return coalesce(v_new_views, 0);
end;
$$;

comment on function public.increment_post_views(uuid) is '文章浏览量原子 +1';

grant execute on function public.increment_post_views(uuid) to anon, authenticated;


-- ---------- 4. toggle_post_reaction ----------

create or replace function public.toggle_post_reaction(
  p_post_id uuid,
  p_user_id uuid,
  p_type text
)
returns table (reaction text, likes bigint, dislikes bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing record;
  v_new_reaction text;
begin
  if p_type not in ('like', 'dislike') then
    raise exception 'invalid reaction type';
  end if;

  -- 校验文章存在
  if not exists (select 1 from public.posts where post_id = p_post_id) then
    raise exception 'post not found';
  end if;

  perform set_config('app.bypass_counter_guard', 'on', true);

  select reaction_id, type into v_existing
  from public.post_reactions
  where post_id = p_post_id and user_id = p_user_id
  for update;

  if found and v_existing.type = p_type then
    -- 重复点击同类型 → 取消
    delete from public.post_reactions where reaction_id = v_existing.reaction_id;
    v_new_reaction := null;
  elsif found then
    -- 切换类型
    update public.post_reactions set type = p_type
    where reaction_id = v_existing.reaction_id;
    v_new_reaction := p_type;
  else
    -- 新增
    insert into public.post_reactions (post_id, user_id, type)
    values (p_post_id, p_user_id, p_type);
    v_new_reaction := p_type;
  end if;

  -- 权威计数回填 posts
  update public.posts p
  set likes_count = (select count(*) from public.post_reactions r where r.post_id = p_post_id and r.type = 'like'),
      dislikes_count = (select count(*) from public.post_reactions r where r.post_id = p_post_id and r.type = 'dislike')
  where p.post_id = p_post_id;

  return query
  select v_new_reaction,
         (select count(*) from public.post_reactions r where r.post_id = p_post_id and r.type = 'like'),
         (select count(*) from public.post_reactions r where r.post_id = p_post_id and r.type = 'dislike');
end;
$$;

comment on function public.toggle_post_reaction(uuid, uuid, text) is '文章点赞/点踩幂等切换，返回权威计数';

grant execute on function public.toggle_post_reaction(uuid, uuid, text) to anon, authenticated;


-- ---------- 5. toggle_comment_reaction ----------

create or replace function public.toggle_comment_reaction(
  p_comment_id uuid,
  p_user_id uuid,
  p_type text
)
returns table (reaction text, likes bigint, dislikes bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing record;
  v_new_reaction text;
begin
  if p_type not in ('like', 'dislike') then
    raise exception 'invalid reaction type';
  end if;

  if not exists (select 1 from public.comments where comment_id = p_comment_id) then
    raise exception 'comment not found';
  end if;

  perform set_config('app.bypass_counter_guard', 'on', true);

  select reaction_id, type into v_existing
  from public.comment_reactions
  where comment_id = p_comment_id and user_id = p_user_id
  for update;

  if found and v_existing.type = p_type then
    delete from public.comment_reactions where reaction_id = v_existing.reaction_id;
    v_new_reaction := null;
  elsif found then
    update public.comment_reactions set type = p_type
    where reaction_id = v_existing.reaction_id;
    v_new_reaction := p_type;
  else
    insert into public.comment_reactions (comment_id, user_id, type)
    values (p_comment_id, p_user_id, p_type);
    v_new_reaction := p_type;
  end if;

  update public.comments c
  set likes_count = (select count(*) from public.comment_reactions r where r.comment_id = p_comment_id and r.type = 'like'),
      dislikes_count = (select count(*) from public.comment_reactions r where r.comment_id = p_comment_id and r.type = 'dislike')
  where c.comment_id = p_comment_id;

  return query
  select v_new_reaction,
         (select count(*) from public.comment_reactions r where r.comment_id = p_comment_id and r.type = 'like'),
         (select count(*) from public.comment_reactions r where r.comment_id = p_comment_id and r.type = 'dislike');
end;
$$;

comment on function public.toggle_comment_reaction(uuid, uuid, text) is '评论点赞/点踩幂等切换，返回权威计数';

grant execute on function public.toggle_comment_reaction(uuid, uuid, text) to anon, authenticated;


-- ---------- 6. calculate_level + claim_task_reward ----------

create or replace function public.calculate_level(p_experience integer)
returns integer
language sql
immutable
as $$
  select lvl
  from (
    select
      g as lvl,
      coalesce((
        select sum(floor(100 * power(1.5, i - 1)))
        from generate_series(1, g - 1) as i
      ), 0) as total_needed
    from generate_series(1, 60) as g
  ) t
  where p_experience >= total_needed
  order by lvl desc
  limit 1;
$$;

create or replace function public.claim_task_reward(p_usertask_id integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_task public.user_tasks;
  v_required_count integer;
  v_coins_reward integer;
  v_exp_reward integer;
  v_new_coins integer;
  v_new_exp integer;
  v_new_level integer;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select * into v_task
  from public.user_tasks
  where usertask_id = p_usertask_id and user_id = v_uid
  for update;

  if not found then
    raise exception 'TASK_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_task.is_claimed then
    raise exception 'ALREADY_CLAIMED' using errcode = '23505';
  end if;

  select t.required_count, t.coins_reward, t.exp_reward
  into v_required_count, v_coins_reward, v_exp_reward
  from public.tasks t
  where t.task_id = v_task.task_id;

  if not found then
    raise exception 'TASK_CONFIG_MISSING' using errcode = 'P0002';
  end if;

  if v_task.current_count < v_required_count then
    raise exception 'TASK_NOT_COMPLETED' using errcode = '23514';
  end if;

  perform set_config('app.bypass_counter_guard', 'on', true);

  update public.user_tasks
  set is_claimed = true, claimed_at = now(), updated_at = now()
  where usertask_id = v_task.usertask_id;

  insert into public.task_reward_history (user_id, task_id, coins_gained, experience_gained, claimed_at)
  values (v_uid, v_task.task_id, v_coins_reward, v_exp_reward, now());

  update public.profiles
  set coins = coins + v_coins_reward,
      experience = experience + v_exp_reward,
      level = public.calculate_level(experience + v_exp_reward),
      updated_at = now()
  where user_id = v_uid
  returning coins, experience, level into v_new_coins, v_new_exp, v_new_level;

  return jsonb_build_object(
    'ok', true,
    'coins_gained', v_coins_reward,
    'exp_gained', v_exp_reward,
    'coins', v_new_coins,
    'experience', v_new_exp,
    'level', v_new_level
  );
end;
$$;

comment on function public.claim_task_reward(integer) is '原子领奖：行锁防双领+服务端校验，返回资产快照';

drop function if exists public.claim_task_reward(uuid);
grant execute on function public.claim_task_reward(integer) to authenticated;


-- ---------- 7. guard_user_tasks_claim 触发器 ----------

create or replace function public.guard_user_tasks_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (current_setting('app.bypass_counter_guard', true) is distinct from 'on') then
    -- 只拦「领奖方向」：未领取 -> 已领取，必须走 claim_task_reward RPC
    -- true -> false 是每日任务重置（resetUserTask 直写），必须放行，否则重置失效
    if new.is_claimed is true and old.is_claimed is not true then
      raise exception 'claiming rewards must go through claim_task_reward RPC';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_user_tasks_claim on public.user_tasks;
create trigger trg_guard_user_tasks_claim
  before update on public.user_tasks
  for each row execute function public.guard_user_tasks_claim();


-- ---------- 8. advance_task_progress ----------

create or replace function public.advance_task_progress(
  p_user_id uuid,
  p_action_type text,
  p_increment integer default 1,
  p_absolute boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_count integer := 0;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'AUTH_REQUIRED: can only advance own tasks' using errcode = '42501';
  end if;

  perform set_config('app.bypass_counter_guard', 'on', true);

  with matched as (
    select ut.usertask_id
    from public.user_tasks ut
    join public.tasks t on t.task_id = ut.task_id
    where ut.user_id = p_user_id
      and t.action_type = p_action_type
      and ut.is_claimed = false
    for update
  )
  update public.user_tasks ut
  set current_count = case
        when p_absolute then least(p_increment, t.required_count)
        else least(ut.current_count + p_increment, t.required_count)
      end,
      updated_at = now()
  from matched m, public.tasks t
  where ut.usertask_id = m.usertask_id
    and t.task_id = ut.task_id;

  get diagnostics v_updated_count = row_count;

  return jsonb_build_object('ok', true, 'updated', v_updated_count);
end;
$$;

comment on function public.advance_task_progress(uuid, text, integer, boolean) is '原子推进任务进度：行锁+min 钳制';

grant execute on function public.advance_task_progress(uuid, text, integer, boolean) to anon, authenticated;


-- ---------- 9. 索引补强 ----------

create index if not exists idx_post_reactions_post_type
  on public.post_reactions (post_id, type);
create index if not exists idx_comment_reactions_comment_type
  on public.comment_reactions (comment_id, type);
create index if not exists idx_user_tasks_user_action
  on public.user_tasks (user_id, task_id);
create index if not exists idx_tasks_action_type
  on public.tasks (action_type) where is_active;
create index if not exists idx_posts_created_desc
  on public.posts (created_at desc);
