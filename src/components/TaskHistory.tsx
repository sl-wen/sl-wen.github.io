'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Alert } from '@/components/ui';
import { getTaskRewardHistory, TaskRewardHistory } from '@/utils/task';
import { useAuth } from '@/utils/auth-context';

interface TaskHistoryProps {
  className?: string;
}

const ACTION_LABEL: Record<string, string> = {
  login: '登录',
  like: '点赞',
  comment: '评论',
  post: '发帖',
  be_liked: '被点赞',
  consecutive_login: '连续登录'
};

export default function TaskHistoryComponent({ className = '' }: TaskHistoryProps) {
  const { userProfile } = useAuth();
  const [history, setHistory] = useState<TaskRewardHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  const loadHistory = useCallback(async () => {
    if (!userProfile?.user_id) return;

    try {
      setLoading(true);
      const taskHistory = await getTaskRewardHistory(userProfile.user_id);
      if (taskHistory) {
        setHistory(taskHistory);
      }
    } catch (error) {
      console.error('加载任务历史失败:', error);
      setMessage('加载任务历史失败');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.user_id]);

  useEffect(() => {
    if (userProfile?.user_id) {
      loadHistory();
    }
  }, [userProfile?.user_id, loadHistory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionTypeLabel = (actionType: string) => ACTION_LABEL[actionType] || actionType;

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
      ) : history.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          暂无任务历史记录
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {history.map((record) => (
            <div key={record.task_reward_history_id} className="py-4 first:pt-0 last:pb-0">
              <div className="mb-1 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {record.task_name}
                  </h3>
                  <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                    {getActionTypeLabel(record.action_type || 'login')} · {formatDate(record.claimed_at)}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs">
                  <span className="font-medium text-amber-600 dark:text-amber-400">+{record.coins_gained} 金币</span>
                  <span className="mx-1 text-gray-300 dark:text-gray-600">·</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">+{record.experience_gained} 经验</span>
                </div>
              </div>
              {record.task_description && (
                <p className="text-xs text-gray-400 dark:text-gray-500">{record.task_description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 统计信息 */}
      {history.length > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{history.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">完成任务</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {new Set(history.map(record => record.action_type)).size}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">任务类型</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {history.reduce((sum, record) => sum + record.coins_gained, 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">总金币</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {history.reduce((sum, record) => sum + record.experience_gained, 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">总经验</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
