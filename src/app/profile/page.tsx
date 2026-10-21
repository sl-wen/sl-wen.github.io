'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/utils/auth-context';
import { supabase } from '@/utils/supabase-config';
import { Button, Input, Card, Alert } from '@/components/ui';
import TaskProgressComponent from '@/components/TaskProgress';
import TaskHistoryComponent from '@/components/TaskHistory';

export default function ProfilePage() {
  const { userProfile, refreshProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [activeTab, setActiveTab] = useState<'profile' | 'tasks' | 'history'>('profile');

  // 表单状态
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    avatar_url: '',
    level: 0,
    coins: 0,
    experience: 0
  });

  // 检查登录状态
  useEffect(() => {
    if (!authLoading && !userProfile?.user_id) {
      router.push('/login');
      return;
    }

    // 填充表单数据
    if (userProfile) {
      setFormData({
        username: userProfile.username || '',
        email: userProfile.email || '',
        avatar_url: userProfile.avatar_url || '',
        level: userProfile.level || 0,
        coins: userProfile.coins || 0,
        experience: userProfile.experience || 0
      });
    }
  }, [userProfile, router, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 读本地会话即可（零网络往返）。安全性由 RLS 保证：
      // profiles_update_own 策略以服务端校验过的 JWT uid 为准，客户端伪造无效。
      // 原实现用 auth.getUser()，每次都会走一次网络校验，遇到 token 刷新时甚至长时间挂住。
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('用户未登录');

      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          avatar_url: formData.avatar_url
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // 更新本地存储
      const updatedProfile = { ...userProfile, ...formData };
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

      // 刷新认证状态
      await refreshProfile();

      setMessage('个人资料更新成功！');
      setMessageType('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '更新失败');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // 显示加载状态
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!userProfile?.user_id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">需要登录</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">请先登录以访问个人资料页面</p>
          <Button onClick={() => router.push('/login')}>前往登录</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">个人中心</h1>
          <p className="text-gray-500 dark:text-gray-400">管理您的账户信息和任务进度</p>
        </div>

        {/* 用户统计信息 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
          <Card className="text-center py-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">等级</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{formData.level}</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">金币</div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{formData.coins}</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">经验</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formData.experience}</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">连续登录</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{userProfile.consecutive_logins || 0} 天</div>
          </Card>
        </div>

        {/* 标签页导航 */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-8 overflow-x-auto">
          {([
            ['profile', '个人资料'],
            ['tasks', '任务进度'],
            ['history', '任务历史']
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 min-w-[80px] px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === key
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 标签页内容 */}
        {activeTab === 'profile' && (
          <Card size="md">
            {/* 用户头像区域 */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {formData.avatar_url ? (
                    <Image
                      src={formData.avatar_url}
                      alt="头像"
                      width={96}
                      height={96}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    formData.username?.charAt(0)?.toUpperCase() || '用'
                  )}
                </div>
              </div>
            </div>

            {/* 消息提示 */}
            {message && (
              <Alert variant={messageType} className="mb-6">
                {message}
              </Alert>
            )}

            {/* 个人信息表单 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 用户名 */}
                <Input
                  label="用户名"
                  type="text"
                  placeholder="请输入用户名"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  fullWidth
                  required
                />

                {/* 邮箱 */}
                <Input
                  label="邮箱地址"
                  type="email"
                  placeholder="请输入邮箱"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  fullWidth
                  disabled
                  helperText="邮箱地址不可修改"
                />

                {/* 头像URL */}
                <div className="md:col-span-2">
                  <Input
                    label="头像URL"
                    type="url"
                    placeholder="请输入头像图片链接"
                    value={formData.avatar_url}
                    onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                    fullWidth
                    helperText="输入图片链接来设置头像"
                  />
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? '保存中...' : '保存更改'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </form>
          </Card>
        )}

        {activeTab === 'tasks' && (
          <TaskProgressComponent />
        )}

        {activeTab === 'history' && (
          <TaskHistoryComponent />
        )}
      </div>
    </div>
  );
}
