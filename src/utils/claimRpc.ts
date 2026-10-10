// 领奖：走服务端 RPC claim_task_reward（原子事务 + 行锁防双领）
// 迁移未执行时 RPC 不存在 → 自动回退到旧的三步直写路径并提示
import { supabase } from './supabase-config';

export interface ClaimRewardResult {
  ok: boolean;
  coins_gained?: number;
  exp_gained?: number;
  coins?: number;
  experience?: number;
  level?: number;
  message?: string;
  fallback?: boolean;
}

export const claimTaskRewardRpc = async (userTaskId: string): Promise<ClaimRewardResult> => {
  try {
    const { data, error } = await supabase.rpc('claim_task_reward', {
      p_usertask_id: userTaskId
    });

    if (error) {
      // RPC 不存在（迁移未跑）→ 回退旧路径
      if (error.code === '42883' || /function.*does not exist/i.test(error.message)) {
        return claimTaskRewardLegacy(userTaskId, true);
      }
      // 业务错误：已领取/未完成 → 原样透出
      return { ok: false, message: rpcErrorToZh(error.message) };
    }

    return { ...(data as ClaimRewardResult), ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : '领取失败，请稍后再试'
    };
  }
};

const rpcErrorToZh = (msg: string): string => {
  if (/ALREADY_CLAIMED/i.test(msg)) return '该任务奖励已领取';
  if (/TASK_NOT_COMPLETED/i.test(msg)) return '任务尚未完成';
  if (/TASK_NOT_FOUND/i.test(msg)) return '任务不存在';
  if (/AUTH_REQUIRED/i.test(msg)) return '登录状态已失效，请重新登录';
  if (/TASK_CONFIG_MISSING/i.test(msg)) return '任务配置缺失';
  return msg;
};

// 旧版前端三连写（迁移未执行时的兜底；多开标签页仍可能双领，迁移上线后可删）
const claimTaskRewardLegacy = async (userTaskId: string, _flag: boolean): Promise<ClaimRewardResult> => {
  const { claimTaskReward } = await import('./task');
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: '登录状态已失效，请重新登录' };

    await claimTaskReward(userTaskId, user.id);
    return { ok: true, fallback: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : '领取失败，请稍后再试'
    };
  }
};
