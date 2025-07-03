'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase-config';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

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
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

          localStorage.setItem('userProfile', JSON.stringify(profileData));
          localStorage.setItem('userSession', JSON.stringify(data));
          router.push('/');
          // 登录成功后刷新页面
          window.location.reload();
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
              id: data.user.id,
              username: email.split('@')[0],
              level: 1,
              coins: 0,
              experience: 0
            }
          ]);

          setMessage('注册成功！请检查您的邮箱进行验证。');
          setIsLogin(true);
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string): boolean => {
    const hasLength = password.length >= 8;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return hasLength && hasLower && hasUpper && hasNumber && hasSpecial;
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    ];
    
    const strength = checks.filter(Boolean).length;
    
    if (strength <= 2) return { strength, label: '弱', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: '中等', color: 'bg-yellow-500' };
    if (strength === 4) return { strength, label: '强', color: 'bg-blue-500' };
    return { strength, label: '很强', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        {/* 登录框主体 */}
        <div className="card hover-lift p-8">
          {/* 头部 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">🚀</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isLogin ? '欢迎回来' : '创建账户'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isLogin ? '登录到你的账户继续创作' : '注册新账户开始你的创作之旅'}
            </p>
          </div>

          {/* 登录/注册切换 */}
          <div className="flex mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              type="button"
              className={`interactive flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                isLogin 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setIsLogin(true)}
            >
              登录
            </button>
            <button
              type="button"
              className={`interactive flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                !isLogin 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setIsLogin(false)}
            >
              注册
            </button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-lg">📧</span>
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="请输入您的邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-12"
                  required
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-lg">🔒</span>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder={isLogin ? "请输入您的密码" : "请设置强密码（至少8位，包含大小写字母、数字和特殊字符）"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-12"
                  required
                />
              </div>

              {/* 密码强度指示器（仅注册时显示） */}
              {!isLogin && password && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">密码强度</span>
                    <span className={`text-sm font-medium ${
                      passwordStrength.strength >= 4 ? 'text-green-600 dark:text-green-400' :
                      passwordStrength.strength >= 3 ? 'text-blue-600 dark:text-blue-400' :
                      passwordStrength.strength >= 2 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    ></div>
                  </div>
                  
                  {/* 密码要求检查 */}
                  <div className="space-y-1 text-xs">
                    {[
                      { check: password.length >= 8, text: '至少8个字符' },
                      { check: /[a-z]/.test(password), text: '包含小写字母' },
                      { check: /[A-Z]/.test(password), text: '包含大写字母' },
                      { check: /\d/.test(password), text: '包含数字' },
                      { check: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: '包含特殊字符' }
                    ].map((requirement, index) => (
                      <div key={index} className={`flex items-center gap-2 ${
                        requirement.check ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        <span>{requirement.check ? '✓' : '○'}</span>
                        <span>{requirement.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 错误/成功消息 */}
            {message && (
              <div className={`p-4 rounded-lg border-l-4 ${
                message.includes('成功') 
                  ? 'bg-green-50 border-green-400 text-green-700 dark:bg-green-900/20 dark:text-green-300' 
                  : 'bg-red-50 border-red-400 text-red-700 dark:bg-red-900/20 dark:text-red-300'
              }`}>
                <div className="flex items-center">
                  <span className="mr-2">
                    {message.includes('成功') ? '✅' : '❌'}
                  </span>
                  <span className="text-sm font-medium">{message}</span>
                </div>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading || (!isLogin && !validatePassword(password))}
              className="btn-primary w-full py-3 text-base font-medium touch-feedback disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  {isLogin ? '登录中...' : '注册中...'}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-2">{isLogin ? '🎉' : '🚀'}</span>
                  {isLogin ? '立即登录' : '创建账户'}
                </div>
              )}
            </button>
          </form>

          {/* 底部链接 */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isLogin ? '还没有账户？' : '已有账户？'}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-200 interactive"
                >
                  {isLogin ? '立即注册' : '立即登录'}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* 装饰性元素 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            登录即表示您同意我们的
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline mx-1">服务条款</a>
            和
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
