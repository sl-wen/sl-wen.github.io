-- ============================================================
-- 005_comments_public_profiles.sql (2026-10-21)
-- 目标：
--   1) 评论自动通过（数据库层兜底，客户端传 false 也强制 true）
--   2) 评论区昵称/头像对匿名访客可见，且不泄露 profiles 隐私列
-- 幂等：可重复执行
-- ============================================================

-- ---------- 1. 评论自动通过守卫 ----------
-- 前端原本显式写 is_approved:false，落库后列表查 is_approved=true 查不到，
-- 表现为「评论发出去、刷新就消失」，且全站没有任何审核入口。
-- 这里在 INSERT 阶段强制置 true，即使绕过前端直接写 REST 也不会变回待审核。

create or replace function public.force_comment_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.is_approved := true;
  return new;
end;
$$;

comment on function public.force_comment_approved() is '评论自动通过守卫：INSERT 时强制 is_approved=true';

drop trigger if exists trg_force_comment_approved on public.comments;
create trigger trg_force_comment_approved
  before insert on public.comments
  for each row execute function public.force_comment_approved();


-- ---------- 2. 放行历史未审核评论 ----------

update public.comments set is_approved = true where is_approved is not true;


-- ---------- 3. 公开资料视图 ----------
-- 不能直接放宽 profiles 的 RLS：该表含 email / adress / farmdata 等隐私列，
-- 整表放开会让匿名访客读到所有用户邮箱。
-- 改用视图只暴露 4 个公开字段；视图以 owner 权限执行，天然绕过 RLS。

create or replace view public.profiles_public as
select user_id, username, avatar_url, level
from public.profiles;

comment on view public.profiles_public is '公开资料视图：仅暴露昵称/头像/等级，供评论区等匿名场景读取';

grant select on public.profiles_public to anon, authenticated;


-- ---------- 4. 刷新 PostgREST schema cache ----------

notify pgrst, 'reload schema';
