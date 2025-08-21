'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase-config';
import { useAuth } from '@/utils/auth-context';
import { updateProfileLastLogin, getConsecutiveLogins } from '@/utils/task';

interface userProfile {
  user_id?: string;
  username?: string;
  avatar_url?: string;
  email: string;
  level?: number;
  coins?: number;
  experience?: number;
  consecutive_logins?: number;
  last_login?: string;
}

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const router = useRouter();
  const { userProfile, refreshProfile } = useAuth();

  // 检查用户是否已经登录，如果已登录则跳转到首页
  useEffect(() => {
    if (userProfile) {
      router.replace('/');
    }
  }, [userProfile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user) {
          // 刷新auth context
          await refreshProfile();
          const consecutive_login_days = getConsecutiveLogins(userProfile?.last_login, userProfile?.consecutive_logins)
          await updateProfileLastLogin(data.user.id,consecutive_login_days);

          // 刷新auth context
          await refreshProfile();

          setMessage('登录成功！正在跳转...');
          setMessageType('success');

          // 跳转到首页
          setTimeout(() => {
            router.replace('/');
          }, 1000);
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });

        if (error) throw error;

        if (data.user) {
          await supabase.from('profiles').insert([
            {
              user_id: data.user.id,
              username: email.split('@')[0],
              level: 1,
              coins: 0,
              experience: 0
            }
          ]);

          setMessage('注册成功！请检查您的邮箱进行验证。');
          setMessageType('success');
          setIsLogin(true);
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '操作失败');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getMessageStyle = () => {
    switch (messageType) {
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-2xl rounded-lg p-8">
          {/* 头部 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">🚀</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? '欢迎回来' : '创建账户'}
            </h1>
            <p className="text-gray-600">
              {isLogin ? '登录到你的账户继续创作' : '注册新账户开始你的创作之旅'}
            </p>
          </div>

          {/* 登录/注册切换 */}
          <div className="flex mb-8 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isLogin ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isLogin ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              注册
            </button>
          </div>

          {/* 消息显示 */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${getMessageStyle()}`}>{message}</div>
          )}

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <input
                id="email"
                type="email"
                placeholder="请输入您的邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                autoComplete="email"
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                id="password"
                type="password"
                placeholder={isLogin ? '请输入您的密码' : '最少8位,大小写字母或数字其中2种以上'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isLogin ? '登录中...' : '注册中...'}
                </div>
              ) : isLogin ? (
                '立即登录'
              ) : (
                '创建账户'
              )}
            </button>
          </form>

          {/* 其他选项 */}
          <div className="mt-8 text-center">
            <div className="text-sm text-gray-600">
              {isLogin ? '还没有账户？' : '已有账户？'}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                {isLogin ? '立即注册' : '立即登录'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
