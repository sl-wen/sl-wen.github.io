'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Alert } from '@/components/ui';
import { getUserTasks, initUserTasks, TaskProgress } from '@/utils/task';
import { claimTaskRewardRpc } from '@/utils/claimRpc';
import { useAuth } from '@/utils/auth-context';

interface TaskProgressProps {
  className?: string;
}

const TYPE_LABEL: Record<string, string> = {
  daily: '每日',
  weekly: '每周',
  achievement: '成就',
  behavior: '行为'
};

const TYPE_BADGE: Record<string, string> = {
  daily: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
  weekly: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  achievement: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900',
  behavior: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900'
};

const DEFAULT_BADGE = 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';

export default function TaskProgressComponent({ className = '' }: TaskProgressProps) {
  const { userProfile, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<TaskProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [showClaimed, setShowClaimed] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  const loadTasks = useCallback(async () => {
    if (!userProfile?.user_id) return;

    try {
      setLoading(true);
      const userTasks = await getUserTasks(userProfile.user_id);

      if (userTasks && userTasks.length > 0) {
        setTasks(userTasks);
      } else {
        // 无任务记录时初始化一次，再重试拉取
        try {
          await initUserTasks(userProfile.user_id);
          const retryTasks = await getUserTasks(userProfile.user_id);
          if (retryTasks && retryTasks.length > 0) {
            setTasks(retryTasks);
          } else {
            setMessage('暂无任务数据');
            setMessageType('info');
          }
        } catch (initError) {
          console.error('初始化任务失败:', initError);
          setMessage('任务初始化失败');
          setMessageType('error');
        }
      }
    } catch (error) {
      console.error('加载任务失败:', error);
      setMessage('加载任务失败');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.user_id]);

  useEffect(() => {
    if (userProfile?.user_id) {
      loadTasks();
    }
  }, [userProfile?.user_id, loadTasks]);

  const handleClaimReward = async (userTaskId: string) => {
    if (!userProfile?.user_id || claimingId) return;

    try {
      setClaimingId(userTaskId);
      const result = await claimTaskRewardRpc(userTaskId);

      if (result.ok) {
        // RPC 返回资产快照，直接刷新服务端数据保持一致
        await refreshProfile();
        await loadTasks();
        setMessage(`奖励领取成功：+${result.coins_gained} 金币 · +${result.exp_gained} 经验`);
        setMessageType('success');
      } else {
        setMessage(result.message || '领取失败');
        setMessageType('error');
      }
    } catch (error) {
      console.error('领取奖励失败:', error);
      setMessage(error instanceof Error ? error.message : '领取奖励失败');
      setMessageType('error');
    } finally {
      setClaimingId(null);
    }
  };

  const getProgressPercentage = (current: number, required: number) => {
    return Math.min((current / required) * 100, 100);
  };

  const visibleTasks = tasks
    .filter(task => showClaimed || !task.is_claimed)
    .sort((a, b) => {
      // 可领取 > 进行中 > 已领取；同级按类型排序
      const status = (t: TaskProgress) =>
        t.is_claimed ? 2 : t.current_count >= t.required_count ? 0 : 1;
      const byStatus = status(a) - status(b);
      if (byStatus !== 0) return byStatus;

      const typeOrder: Record<string, number> = { daily: 1, weekly: 2, achievement: 3, behavior: 4 };
      return (typeOrder[a.name] || 9) - (typeOrder[b.name] || 9);
    });

  const claimedCount = tasks.filter(t => t.is_claimed).length;
  const claimableCount = tasks.filter(t => !t.is_claimed && t.current_count >= t.required_count).length;

  return (
    <Card className={`p-5 ${className}`}>
      {message && (
        <Alert variant={messageType} className="mb-5">
          {message}
        </Alert>
      )}

      {loading ? (
        <div className="py-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500"></div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">加载中…</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          暂无任务数据
        </div>
      ) : (
        <>
          {/* 概要：可领取数 + 已领取开关 */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {claimableCount > 0 ? (
                <>
                  有 <span className="font-semibold text-blue-600 dark:text-blue-400">{claimableCount}</span> 个任务可领取奖励
                </>
              ) : (
                '完成任务后可领取金币与经验奖励'
              )}
            </p>
            {claimedCount > 0 && (
              <button
                type="button"
                onClick={() => setShowClaimed(v => !v)}
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {showClaimed ? '隐藏已领取' : `显示已领取（${claimedCount}）`}
              </button>
            )}
          </div>

          {visibleTasks.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              已领取的任务暂被隐藏
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {visibleTasks.map(task => {
                const isComplete = task.current_count >= task.required_count;
                const pct = getProgressPercentage(task.current_count, task.required_count);
                const isClaiming = claimingId === task.usertask_id;

                return (
                  <div key={task.usertask_id} className="py-4 first:pt-0 last:pb-0">
                    {/* 标题行：类型 + 名称 + 奖励 */}
                    <div className="mb-1.5 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[task.name] || DEFAULT_BADGE}`}>
                          {TYPE_LABEL[task.name] || task.name}
                        </span>
                        <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {task.task_name}
                        </h3>
                      </div>
                      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                        +{task.coins_reward} 金币 · +{task.exp_reward} 经验
                      </span>
                    </div>

                    {/* 描述 */}
                    <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{task.task_description}</p>

                    {/* 进度条 */}
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{task.is_claimed ? '已完成' : isComplete ? '待领取' : '进行中'}</span>
                      <span className={isComplete && !task.is_claimed ? 'font-semibold text-green-600 dark:text-green-400' : ''}>
                        {task.current_count}/{task.required_count}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          task.is_claimed
                            ? 'bg-gray-300 dark:bg-gray-600'
                            : pct >= 100
                              ? 'bg-green-500'
                              : 'bg-blue-600 dark:bg-blue-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* 领取按钮 */}
                    {isComplete && !task.is_claimed && (
                      <div className="mt-3 flex justify-end">
                        <Button
                          onClick={() => handleClaimReward(task.usertask_id)}
                          disabled={isClaiming}
                          variant="primary"
                          size="sm"
                        >
                          {isClaiming ? '领取中…' : '领取奖励'}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
