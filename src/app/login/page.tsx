'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase-config';
import { useAuth } from '@/utils/auth-context';
import { updateProfileLastLogin, getConsecutiveLogins, isFirstLoginOfDay, updateTaskProgress } from '@/utils/task';



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
          // 拉取数据库里的最新 profile（闭包里的 userProfile 是登录前的旧值）
          const { data: freshProfile } = await supabase
            .from('profiles')
            .select('last_login, consecutive_logins')
            .eq('user_id', data.user.id)
            .maybeSingle();

          const consecutive_login_days = getConsecutiveLogins(
            freshProfile?.last_login ?? null,
            freshProfile?.consecutive_logins ?? 0
          );
          const isFirstToday = isFirstLoginOfDay(freshProfile?.last_login ?? null);

          await updateProfileLastLogin(data.user.id, consecutive_login_days);

          // 上报任务进度：每日登录/周活跃/初来乍到（仅当天首次登录计数）
          if (isFirstToday) {
            updateTaskProgress(data.user.id, 'login', 1).catch((e) => console.error('login task error:', e));
            updateTaskProgress(data.user.id, 'consecutive_login', consecutive_login_days, true).catch((e) => console.error('consecutive task error:', e));
          }

          // 刷新auth context
          await refreshProfile();

          setMessage('登录成功！正在跳转…');
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
          // Supabase 有 trigger trg_on_auth_user_created 会自动创建 profiles 表
          // 不需要手动 insert，手动 insert 会被 RLS 拒绝（anon 无 auth.uid()）
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
        return 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900';
      case 'error':
        return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      default:
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-sm p-8">
          {/* 头部 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
              {isLogin ? '欢迎回来' : '创建账户'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLogin ? '登录你的账户继续创作' : '注册新账户，开始你的创作之旅'}
            </p>
          </div>

          {/* 登录/注册切换 */}
          <div className="flex mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isLogin
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isLogin
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              注册
            </button>
          </div>

          {/* 消息显示 */}
          {message && (
            <div className={`mb-6 p-3.5 rounded-xl border text-sm ${getMessageStyle()}`} role="alert">
              {message}
            </div>
          )}

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                邮箱地址
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                autoComplete="email"
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                密码
              </label>
              <input
                id="password"
                type="password"
                placeholder={isLogin ? '输入密码' : '至少 8 位，含大小写字母或数字其中 2 种'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:translate-y-px"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {isLogin ? '登录中…' : '注册中…'}
                </span>
              ) : isLogin ? (
                '登录'
              ) : (
                '创建账户'
              )}
            </button>
          </form>

          {/* 其他选项 */}
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {isLogin ? '还没有账户？' : '已有账户？'}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {isLogin ? '立即注册' : '去登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
