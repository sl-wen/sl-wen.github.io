'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/utils/auth-context';
import { supabase } from '@/utils/supabase-config';
import { Button, Input, Card, Alert } from '@/components/ui';

export default function ProfilePage() {
  const { userProfile, refreshProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

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
    if (!userProfile?.user_id) {
      router.push('/login');
      return;
    }

    // 填充表单数据
    setFormData({
      username: userProfile.username || '',
      email: userProfile.email || '',
      avatar_url: userProfile.avatar_url || '',
      level: userProfile.level || 0,
      coins: userProfile.coins || 0,
      experience: userProfile.experience || 0
    });
  }, [userProfile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">需要登录</h1>
          <p className="text-gray-600 mb-4">请先登录以访问个人资料页面</p>
          <Button onClick={() => router.push('/login')}>
            前往登录
          </Button>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">个人资料</h1>
            <p className="text-gray-600">管理您的账户信息</p>
          </div>

          {/* 用户头像区域 */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
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

            {/* 用户统计信息（只读） */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">账户统计</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{formData.level}</div>
                  <div className="text-sm text-gray-600">等级</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">{formData.coins}</div>
                  <div className="text-sm text-gray-600">金币</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{formData.experience}</div>
                  <div className="text-sm text-gray-600">经验值</div>
                </div>
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
      </div>
    </div>
  );
} 