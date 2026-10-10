'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from './supabase-config';
import { initUserTasks } from './task';

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
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profile) {
          localStorage.setItem('userProfile', JSON.stringify(profile));
          setUserProfile(profile);
        } else if (!error) {
          // profiles 表里没有该用户的记录（如 Supabase 恢复后数据丢失）
          // 从 auth session 构造一个最小 profile 并写入 DB
          const fallbackProfile = {
            user_id: session.user.id,
            email: session.user.email || '',
            username: (session.user.email || 'user').split('@')[0],
            level: 1,
            coins: 0,
            experience: 0,
            consecutive_logins: 1,
            last_login: new Date().toISOString()
          };
          const { data: inserted } = await supabase
            .from('profiles')
            .upsert(fallbackProfile, { onConflict: 'user_id' })
            .select()
            .maybeSingle();

          const finalProfile = inserted || fallbackProfile;
          localStorage.setItem('userProfile', JSON.stringify(finalProfile));
          setUserProfile(finalProfile as UserProfile);
        } else {
          setUserProfile(null);
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
      // 幂等初始化：已初始化则只做每日/每周重置检查，不阻塞登录流程
      // 登录进度上报统一在登录页完成（带"当天首次"判断），此处不再上报，避免同一次登录重复计数
      await initUserTasks(userId);
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

      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profile && isMounted) {
          localStorage.setItem('userProfile', JSON.stringify(profile));
          setUserProfile(profile);

          // 处理用户登录
          await handleUserLogin(profile);
        } else if (!error && isMounted) {
          // profiles 表无记录（Supabase 恢复后数据丢失场景），自动补建
          const fallbackProfile = {
            user_id: session.user.id,
            email: session.user.email || '',
            username: (session.user.email || 'user').split('@')[0],
            level: 1,
            coins: 0,
            experience: 0,
            consecutive_logins: 1,
            last_login: new Date().toISOString()
          };
          const { data: inserted } = await supabase
            .from('profiles')
            .upsert(fallbackProfile, { onConflict: 'user_id' })
            .select()
            .maybeSingle();

          const finalProfile = inserted || fallbackProfile;
          localStorage.setItem('userProfile', JSON.stringify(finalProfile));
          setUserProfile(finalProfile as UserProfile);
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
