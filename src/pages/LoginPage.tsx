'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase-config';
import { Button, Input, Card, Alert } from '../components/ui';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
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
          
          setMessage('登录成功！正在跳转...');
          setMessageType('success');
          
          setTimeout(() => {
            router.push('/');
            window.location.reload();
          }, 1000);
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

  // 图标组件
  const EmailIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
  );

  const LockIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  );

  const isPasswordInvalid = !isLogin && password && !validatePassword(password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        <Card size="lg" variant="elevated" className="shadow-2xl">
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
            <Button
              variant={isLogin ? "primary" : "ghost"}
              size="md"
              onClick={() => setIsLogin(true)}
              className="flex-1"
            >
              登录
            </Button>
            <Button
              variant={!isLogin ? "primary" : "ghost"}
              size="md"
              onClick={() => setIsLogin(false)}
              className="flex-1"
            >
              注册
            </Button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 邮箱输入 */}
            <Input
              label="邮箱地址"
              type="email"
              placeholder="请输入您的邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<EmailIcon />}
              required
              fullWidth
            />

            {/* 密码输入 */}
            <Input
              label="密码"
              type="password"
              placeholder={
                isLogin 
                  ? "请输入您的密码" 
                  : "请设置强密码（至少8位，包含大小写字母、数字和特殊字符）"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<LockIcon />}
              required
              fullWidth
              error={!!isPasswordInvalid}
              errorMessage={
                isPasswordInvalid 
                  ? "密码强度不够，请按要求设置密码" 
                  : undefined
              }
            />

            {/* 密码强度指示器（仅注册时显示） */}
            {!isLogin && password && (
              <Card variant="filled" size="sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">密码强度</span>
                    <span className={`text-sm font-medium ${
                      passwordStrength.strength >= 4 ? 'text-green-600' :
                      passwordStrength.strength >= 3 ? 'text-blue-600' :
                      passwordStrength.strength >= 2 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                  
                  {/* 密码要求检查 */}
                  <div className="space-y-1">
                    {[
                      { check: password.length >= 8, text: '至少8个字符' },
                      { check: /[a-z]/.test(password), text: '包含小写字母' },
                      { check: /[A-Z]/.test(password), text: '包含大写字母' },
                      { check: /\d/.test(password), text: '包含数字' },
                      { check: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: '包含特殊字符' }
                    ].map((requirement, index) => (
                      <div key={index} className={`flex items-center gap-2 text-xs ${
                        requirement.check ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        <span className="text-sm">{requirement.check ? '✓' : '○'}</span>
                        <span>{requirement.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* 错误/成功消息 */}
            {message && (
              <Alert 
                variant={messageType} 
                onClose={() => setMessage('')}
              >
                <strong>{messageType === 'success' ? '成功：' : '错误：'}</strong>
                {message}
              </Alert>
            )}

            {/* 提交按钮 */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || !!isPasswordInvalid}
              isLoading={loading}
              fullWidth
              leftIcon={<span>{isLogin ? '🎉' : '🚀'}</span>}
            >
              {loading 
                ? (isLogin ? '登录中...' : '注册中...') 
                : (isLogin ? '立即登录' : '创建账户')
              }
            </Button>
          </form>

          {/* 底部链接 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? '还没有账户？' : '已有账户？'}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-1 p-0 h-auto text-blue-600 hover:text-blue-800 font-medium"
                >
                  {isLogin ? '立即注册' : '立即登录'}
                </Button>
              </p>
            </div>
          </div>
        </Card>

        {/* 装饰性元素 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            登录即表示您同意我们的
            <a href="#" className="text-blue-600 hover:underline mx-1">服务条款</a>
            和
            <a href="#" className="text-blue-600 hover:underline ml-1">隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 