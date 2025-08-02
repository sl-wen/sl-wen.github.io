'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Alert } from '@/components/ui';
import { getTaskRewardHistory, TaskRewardHistory } from '@/utils/task';
import { useAuth } from '@/utils/auth-context';

interface TaskHistoryProps {
  className?: string;
}

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

  const getActionTypeLabel = (actionType: string) => {
    switch (actionType) {
      case 'login':
        return '登录';
      case 'like':
        return '点赞';
      case 'comment':
        return '评论';
      case 'post':
        return '发帖';
      case 'be_liked':
        return '被点赞';
      case 'consecutive_login':
        return '连续登录';
      default:
        return actionType;
    }
  };

  return (
    <Card className={`p-2 ${className}`}>

      {message && (
        <Alert variant={messageType} className="mb-2">
          {message}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无任务历史记录
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((record) => (
            <div key={record.task_reward_history_id} className="border rounded-lg p-3 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      已完成
                    </span>
                    <h3 className="font-semibold text-gray-900">{record.task_name}</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-sm">
                    <div>
                      <span className="text-gray-500">任务类型:</span>
                      <span className="font-medium text-red-600">
                        {getActionTypeLabel(record.action_type || 'login')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 mb-3">{record.task_description}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">金币奖励:</span>
                      <span className="font-medium text-yellow-600">
                        +{record.coins_gained}💰
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">经验奖励:</span>
                      <span className="font-medium text-green-600">
                        +{record.experience_gained}⭐
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">领取时间:</span>
                    <span className="text-sm font-medium text-gray-600">
                      {formatDate(record.claimed_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 统计信息 */}
      {history.length > 0 && (
        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">统计信息</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{history.length}</div>
              <div className="text-gray-600">完成任务</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">
                {new Set(history.map(record => record.action_type)).size}
              </div>
              <div className="text-gray-600">任务类型</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-600">
                {history.reduce((sum, record) => sum + record.coins_gained, 0)}
              </div>
              <div className="text-gray-600">总金币</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {history.reduce((sum, record) => sum + record.experience_gained, 0)}
              </div>
              <div className="text-gray-600">总经验</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}