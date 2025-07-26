'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/utils/auth-context';
import { supabase } from '@/utils/supabase-config';
import { Button, Card, Alert } from '@/components/ui';

export default function SettingsPage() {
  const { userProfile, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  // 检查登录状态
  useEffect(() => {
    if (!userProfile) {
      router.push('/login');
    }
  }, [userProfile, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      setMessage('登出失败，请重试');
      setMessageType('error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('确定要删除账户吗？此操作不可恢复！')) {
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未登录');

      // 删除用户资料
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // 删除用户账户（需要服务端配合）
      setMessage('账户删除请求已提交，请联系管理员完成删除');
      setMessageType('warning');

      // 登出用户
      await logout();
      router.push('/');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除失败');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userProfile?.email || '');
      if (error) throw error;

      setMessage('密码重置邮件已发送，请检查您的邮箱');
      setMessageType('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '发送失败');
      setMessageType('error');
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">需要登录</h1>
          <p className="text-gray-600 mb-4">请先登录以访问设置页面</p>
          <Button onClick={() => router.push('/login')}>前往登录</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card size="lg" variant="elevated" className="shadow-lg">
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">账户设置</h1>
            <p className="text-gray-600">管理您的账户偏好设置</p>
          </div>

          {/* 消息提示 */}
          {message && (
            <Alert variant={messageType} className="mb-6">
              {message}
            </Alert>
          )}

          {/* 设置选项 */}
          <div className="space-y-6">
            {/* 账户管理 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">账户管理</h2>

              <div className="space-y-4">
                {/* 个人资料 */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-medium text-gray-900">个人资料</h3>
                    <p className="text-sm text-gray-600">编辑您的用户名、头像等信息</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => router.push('/profile')}>
                    编辑
                  </Button>
                </div>

                {/* 更改密码 */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-medium text-gray-900">更改密码</h3>
                    <p className="text-sm text-gray-600">通过邮箱重置您的密码</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleChangePassword}>
                    重置密码
                  </Button>
                </div>

                {/* 登出 */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-medium text-gray-900">退出登录</h3>
                    <p className="text-sm text-gray-600">安全退出您的账户</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    退出登录
                  </Button>
                </div>
              </div>
            </div>

            {/* 外观设置 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">外观设置</h2>

              <div className="space-y-4">
                {/* 主题设置 */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 className="font-medium text-gray-900">主题模式</h3>
                    <p className="text-sm text-gray-600">选择浅色或深色主题</p>
                  </div>
                  <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="light">浅色</option>
                    <option value="dark">深色</option>
                    <option value="system">跟随系统</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 隐私设置 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">隐私设置</h2>

              <div className="space-y-4">
                {/* 数据导出 */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-medium text-gray-900">数据导出</h3>
                    <p className="text-sm text-gray-600">下载您的所有数据</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMessage('数据导出功能开发中...')}
                  >
                    导出数据
                  </Button>
                </div>
              </div>
            </div>

            {/* 危险区域 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-900 mb-4">危险区域</h2>

              <div className="space-y-4">
                {/* 删除账户 */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 className="font-medium text-red-900">删除账户</h3>
                    <p className="text-sm text-red-600">
                      永久删除您的账户和所有数据，此操作不可恢复
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDeleteAccount}
                    disabled={loading}
                  >
                    {loading ? '删除中...' : '删除账户'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 返回按钮 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <Button variant="ghost" size="lg" onClick={() => router.back()} className="w-full">
              返回
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
