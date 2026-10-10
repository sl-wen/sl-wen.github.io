-- ============================================================
-- 002_claim_rpc.sql  (2026-10-11 任务领奖收敛为服务端 RPC)
-- 解决：前端三连写（user_tasks → task_reward_history → profiles）无事务，
--       多开标签页双领 / 客户端伪造奖励
-- 设计：对齐 001_rls_hardening 的 app.bypass_counter_guard 豁免模式
-- 幂等：可重复执行
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- 1. 等级计算（与前端 calculateLevel 同规则：base=100，每级×1.5） ----------
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

comment on function public.calculate_level(integer) is '累计经验→等级（前端 calculateLevel 同规则 base=100 ×1.5^n）';

-- ---------- 2. 原子领奖 RPC ----------
create or replace function public.claim_task_reward(p_usertask_id uuid)
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

  -- 行锁：并发双领时第二个请求排队，拿锁后见 is_claimed=true 直接报已领
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

  -- 服务端取奖励配置与达标线（信任 DB 不信任客户端）
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

  -- 标记领取
  update public.user_tasks
  set is_claimed = true, claimed_at = now(), updated_at = now()
  where usertask_id = v_task.usertask_id;

  -- 奖励历史
  insert into public.task_reward_history (user_id, task_id, coins_gained, experience_gained, claimed_at)
  values (v_uid, v_task.task_id, v_coins_reward, v_exp_reward, now());

  -- 原子累加资产 + 重算等级
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

comment on function public.claim_task_reward(uuid) is '原子领奖：行锁防双领+服务端校验，返回资产快照';

grant execute on function public.claim_task_reward(uuid) to authenticated;
revoke execute on function public.claim_task_reward(uuid) from anon;

-- ---------- 3. 锁直改领取状态（对齐 001 的豁免模式） ----------
-- 前端 updateTaskProgress 只允许改 current_count/updated_at；
-- is_claimed/claimed_at 只能经 claim_task_reward RPC（security definer 内 set_config 豁免）
create or replace function public.guard_user_tasks_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- RPC 豁免：claim_task_reward 内 set_config('app.bypass_counter_guard','on')
  if (current_setting('app.bypass_counter_guard', true) is distinct from 'on') then
    if new.is_claimed is distinct from old.is_claimed
    or new.claimed_at is distinct from old.claimed_at then
      raise exception 'claim state changes must go through claim_task_reward RPC';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_user_tasks_claim on public.user_tasks;
create trigger trg_guard_user_tasks_claim
  before update on public.user_tasks
  for each row execute function public.guard_user_tasks_claim();

comment on function public.guard_user_tasks_claim() is '客户端不得直改 is_claimed/claimed_at，仅 claim_task_reward RPC 可改';
