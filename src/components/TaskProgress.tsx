'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Alert } from '@/components/ui';
import { getUserTasks, claimTaskReward, TaskProgress, initUserTasks } from '@/utils/task';
import { useAuth } from '@/utils/auth-context';

interface TaskProgressProps {
  className?: string;
}

export default function TaskProgressComponent({ className = '' }: TaskProgressProps) {
  const { userProfile, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<TaskProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  const loadTasks = useCallback(async () => {
    if (!userProfile?.user_id) {
      console.log('用户ID不存在，跳过加载任务');
      return;
    }
    try {
      console.log('开始加载任务，用户ID:', userProfile.user_id);
      setLoading(true);
      const userTasks = await getUserTasks(userProfile.user_id);
      console.log('获取到的任务数据:', userTasks);
      if (userTasks && userTasks.length > 0) {
        setTasks(userTasks);
      } else {
        console.log('没有获取到任务数据，尝试初始化任务');
        try {
          await initUserTasks(userProfile.user_id);
          // 重新获取任务
          const retryTasks = await getUserTasks(userProfile.user_id);
          if (retryTasks && retryTasks.length > 0) {
            setTasks(retryTasks);
            setMessage('任务初始化成功');
            setMessageType('success');
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
    if (!userProfile?.user_id) return;

    try {
      setLoading(true);
      await claimTaskReward(userTaskId, userProfile.user_id);

      // 刷新用户资料以更新金币和经验值
      await refreshProfile();

      // 重新加载任务
      await loadTasks();

      setMessage('奖励领取成功！');
      setMessageType('success');
    } catch (error) {
      console.error('领取奖励失败:', error);
      setMessage(error instanceof Error ? error.message : '领取奖励失败');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getTaskTypeColor = (taskType: string) => {
    switch (taskType) {
      case 'daily':
        return 'bg-blue-100 text-blue-800';
      case 'weekly':
        return 'bg-green-100 text-green-800';
      case 'achievement':
        return 'bg-purple-100 text-purple-800';
      case 'behavior':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (current: number, required: number) => {
    return Math.min((current / required) * 100, 100);
  };

  const getProgressColor = (current: number, required: number) => {
    const percentage = getProgressPercentage(current, required);
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <Card className={`p-2 ${className}`}>

      {message && (
        <Alert variant={messageType} className="mb-6">
          {message}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无任务数据
        </div>
      ) : (
        <div className="space-y-4">
          {tasks
            .filter(task => !task.is_claimed) // 过滤掉已领取的任务
            .sort((a, b) => {
              // 优先显示可领取的任务（已完成但未领取）
              const aCanClaim = a.current_count >= a.required_count;
              const bCanClaim = b.current_count >= b.required_count;

              if (aCanClaim && !bCanClaim) return -1;
              if (!aCanClaim && bCanClaim) return 1;

              // 如果都是可领取或都不可领取，按任务类型排序
              const typeOrder = { daily: 1, weekly: 2, achievement: 3, behavior: 4 };
              const aTypeOrder = typeOrder[a.name as keyof typeof typeOrder] || 5;
              const bTypeOrder = typeOrder[b.name as keyof typeof typeOrder] || 5;

              return aTypeOrder - bTypeOrder;
            })
            .map((task) => (
              <div key={task.usertask_id} className="border rounded-lg p-3 bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskTypeColor(task.name)}`}>
                        {task.name === 'daily' ? '每日' :
                          task.name === 'weekly' ? '每周' :
                            task.name === 'achievement' ? '成就' :
                              task.name === 'behavior' ? '行为' : task.name}
                      </span>
                      <h3 className="font-semibold text-gray-900">{task.task_name}</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-sm">
                      <div>
                        <span className="text-sm text-gray-600 mb-2">{task.task_description}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">进度:</span>
                        <span className="font-medium text-red-600">
                          {task.current_count}/{task.required_count}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">金币奖励:</span>
                        <span className="font-medium text-yellow-600">
                          {task.coins_reward}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">经验奖励:</span>
                        <span className="font-medium text-green-600">
                          {task.exp_reward}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>进度</span>
                    <span>{Math.round(getProgressPercentage(task.current_count, task.required_count))}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(task.current_count, task.required_count)}`}
                      style={{ width: `${getProgressPercentage(task.current_count, task.required_count)}%` }}
                    ></div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end">
                  {task.current_count >= task.required_count ? (
                    <Button
                      onClick={() => handleClaimReward(task.usertask_id)}
                      disabled={loading}
                      variant="primary"
                      size="sm"
                    >
                      {loading ? '领取中...' : '领取奖励'}
                    </Button>
                  ) : (
                    <span className="text-gray-500 text-sm">继续完成任务</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}