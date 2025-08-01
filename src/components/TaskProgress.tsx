'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Alert } from '@/components/ui';
import { getUserTasks, claimTaskReward, TaskProgress } from '@/utils/task';
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

  useEffect(() => {
    if (userProfile?.user_id) {
      loadTasks();
    }
  }, [userProfile?.user_id]);

  const loadTasks = async () => {
    if (!userProfile?.user_id) {
      return;
    }
    try {
      setLoading(true);
      const userTasks = await getUserTasks(userProfile.user_id);
      if (userTasks) {
        setTasks(userTasks);
      }
    } catch (error) {
      console.error('加载任务失败:', error);
      setMessage('加载任务失败');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

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
          {tasks.map((task) => (
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
                {!task.is_claimed && task.current_count >= task.required_count ? (
                  <Button
                    onClick={() => handleClaimReward(task.usertask_id)}
                    disabled={loading}
                    variant="primary"
                    size="sm"
                  >
                    {loading ? '领取中...' : '领取奖励'}
                  </Button>
                ) : task.is_claimed ? (
                  <span className="text-green-600 text-sm font-medium">✓ 已领取</span>
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