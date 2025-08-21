'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from './supabase-config';
import { initUserTasks, updateTaskProgress } from './task';

export interface UserProfile {
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

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async () => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      // 先检查localStorage
      const profileData = localStorage.getItem('userProfile');
      if (profileData) {
        try {
          const profile = JSON.parse(profileData);
          setUserProfile(profile);
          setLoading(false);
          return;
        } catch (parseError) {
          console.error('Error parsing localStorage profile:', parseError);
          localStorage.removeItem('userProfile');
        }
      }

      // 从Supabase获取session
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profile) {
          localStorage.setItem('userProfile', JSON.stringify(profile));
          setUserProfile(profile);
        }
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadUserProfile();
  }, [loadUserProfile]);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userSession');
      }
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const initializeUserTasks = useCallback(async (userId: string) => {
    try {
      // 异步初始化用户任务，不阻塞登录流程
      await initUserTasks(userId);
      console.log('用户任务初始化完成');
      
      // 初始化完成后更新登录任务进度
      await updateTaskProgress(userId, 'login', 1);
      console.log('登录任务进度更新完成');
      
      // 刷新用户资料以反映最新状态
      await refreshProfile();
    } catch (error) {
      console.error('初始化用户任务失败:', error);
    }
  }, [refreshProfile]);

  const handleUserLogin = useCallback(async (profile: UserProfile) => {
    try {
      if (profile.user_id) {
        // 将任务初始化设为异步非阻塞操作
        // 这样用户可以立即看到登录成功，任务初始化在后台进行
        initializeUserTasks(profile.user_id).catch(error => {
          console.error('后台任务初始化失败:', error);
        });
      }
    } catch (error) {
      console.error('处理用户登录失败:', error);
    }
  }, [initializeUserTasks]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      await loadUserProfile();
    };

    if (isMounted) {
      loadProfile();
    }

    // 监听认证状态变化
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profile && isMounted) {
          localStorage.setItem('userProfile', JSON.stringify(profile));
          setUserProfile(profile);

          // 处理用户登录
          await handleUserLogin(profile);
        }
      } else if (event === 'SIGNED_OUT' && isMounted) {
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userSession');
        setUserProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile, handleUserLogin]);

  const value: AuthContextType = {
    userProfile,
    loading,
    refreshProfile,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
