-- ============================================================
-- 006_comment_count_trigger.sql (2026-10-21)
-- 目标：把 posts.comments_count 的维护从「前端两次往返」下移到数据库触发器
--
-- 背景（性能）：
--   原 addComment / deleteComment 在写完评论后，前端还要再发两次请求：
--     1) select count(*) from comments where post_id = ...
--     2) update posts set comments_count = ...
--   服务器→Supabase 实测单次往返 250~530ms，这两次就是「发评论慢」的主因。
--   改为 AFTER INSERT/DELETE 触发器同事务内维护，前端只发一次写请求。
--
-- 幂等：可重复执行
-- ============================================================

create or replace function public.sync_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_id uuid;
begin
  v_post_id := coalesce(new.post_id, old.post_id);

  update public.posts p
  set comments_count = (
    select count(*) from public.comments c where c.post_id = v_post_id
  )
  where p.post_id = v_post_id;

  return null;
end;
$$;

comment on function public.sync_post_comment_count() is '评论增删后自动同步 posts.comments_count，免去前端 count+update 两次往返';

drop trigger if exists trg_sync_post_comment_count on public.comments;
create trigger trg_sync_post_comment_count
  after insert or delete on public.comments
  for each row execute function public.sync_post_comment_count();


-- 一次性校准历史数据
update public.posts p
set comments_count = (select count(*) from public.comments c where c.post_id = p.post_id);

notify pgrst, 'reload schema';
