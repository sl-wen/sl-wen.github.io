-- ============================================================
-- 001_rls_hardening.sql  (2026-10-07 博客安全+性能加固)
-- 背景实测：anon key 可直接 update posts.views (204)、insert post_reactions (201)
-- 目标：锁死直写，全走 RPC；评论只能本人操作；任务进度只进不出
-- 幂等：可重复执行
-- ============================================================

-- ---------- 1. posts：禁止客户端直改计数 ----------
-- views/likes_count/dislikes_count/comments_count 只能由 RPC（security definer）维护
drop trigger if exists trg_protect_post_counters on public.posts;

create or replace function public.protect_post_counters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 计数字段被改动且非 RPC 触发（RPC 里用 set_config 标记会话豁免）
  if (current_setting('app.bypass_counter_guard', true) is distinct from 'on') then
    if new.views      is distinct from old.views
    or new.likes_count    is distinct from old.likes_count
    or new.dislikes_count is distinct from old.dislikes_count
    or new.comments_count is distinct from old.comments_count
    then
      raise exception 'post counters are maintained by RPC only';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_protect_post_counters
  before update on public.posts
  for each row execute function public.protect_post_counters();

-- ---------- 2. post_reactions / comment_reactions：锁直写 ----------
-- 客户端不允许直接 insert/update/delete reaction，一律走 toggle RPC
drop trigger if exists trg_block_reaction_direct on public.post_reactions;
drop trigger if exists trg_block_reaction_direct_c on public.comment_reactions;

create or replace function public.block_reaction_direct()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (current_setting('app.bypass_counter_guard', true) is distinct from 'on') then
    raise exception 'reactions must go through toggle RPC';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_block_reaction_direct
  before insert or update or delete on public.post_reactions
  for each row execute function public.block_reaction_direct();

create trigger trg_block_reaction_direct_c
  before insert or update or delete on public.comment_reactions
  for each row execute function public.block_reaction_direct();

-- ---------- 3. comments：本人才能增删改 ----------
drop policy if exists comments_insert_own on public.comments;
drop policy if exists comments_update_own on public.comments;
drop policy if exists comments_delete_own on public.comments;

create policy comments_insert_own on public.comments
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy comments_update_own on public.comments
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy comments_delete_own on public.comments
  for delete to authenticated
  using (auth.uid() = user_id);

-- ---------- 4. user_tasks：只允许插入与更新进度，禁止改奖励状态 ----------
-- 领奖逻辑（is_claimed/coins/experience）后续应收敛到 RPC；本步先挡 anon
drop policy if exists user_tasks_no_anon_insert on public.user_tasks;
drop policy if exists user_tasks_no_anon_update on public.user_tasks;

create policy user_tasks_no_anon_insert on public.user_tasks
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy user_tasks_no_anon_update on public.user_tasks
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- 5. stats：禁止 anon 直改 ----------
-- total_views 改为只读（RPC 维护）；若表上已有宽松策略先不删，靠触发器兜底
drop trigger if exists trg_protect_stats on public.stats;

create or replace function public.protect_stats()
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

create trigger trg_protect_stats
  before update on public.stats
  for each row execute function public.protect_stats();

-- ---------- 6. RPC 补齐 ----------
-- 6a. 站点总浏览量原子自增
create or replace function public.increment_site_views()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.stats (stats_id, total_views) values ('views', 1)
  on conflict (stats_id) do update set total_views = public.stats.total_views + 1;
$$;

-- 6b. 评论点赞切换（对齐 toggle_post_reaction 的返回结构）
create or replace function public.toggle_comment_reaction(
  p_comment_id uuid,
  p_user_id uuid,
  p_type text
)
returns table (likes int, dislikes int, reaction text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing record;
  v_new text;
  v_like int;
  v_dislike int;
begin
  if p_type not in ('like','dislike') then
    raise exception 'invalid reaction type';
  end if;

  perform 1 from public.comments c where c.comment_id = p_comment_id;
  if not found then
    raise exception 'comment not found';
  end if;

  select * into v_existing from public.comment_reactions
    where comment_id = p_comment_id and user_id = p_user_id;

  if found then
    if v_existing.type = p_type then
      delete from public.comment_reactions where reaction_id = v_existing.reaction_id;
      v_new := null;
    else
      update public.comment_reactions set type = p_type where reaction_id = v_existing.reaction_id;
      v_new := p_type;
    end if
  else
    insert into public.comment_reactions (comment_id, user_id, type) values (p_comment_id, p_user_id, p_type);
    v_new := p_type;
  end if;

  select count(*) into v_like from public.comment_reactions
    where comment_id = p_comment_id and type = 'like';
  select count(*) into v_dislike from public.comment_reactions
    where comment_id = p_comment_id and type = 'dislike';

  update public.comments
    set likes_count = v_like, dislikes_count = v_dislike
    where comment_id = p_comment_id;

  return query select v_like, v_dislike, v_new;
end;
$$;

grant execute on function public.increment_post_views(uuid) to anon, authenticated;
grant execute on function public.increment_site_views() to anon, authenticated;
grant execute on function public.toggle_post_reaction(uuid, uuid, text) to anon, authenticated;
grant execute on function public.toggle_comment_reaction(uuid, uuid, text) to anon, authenticated;
