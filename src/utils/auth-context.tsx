'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase-config';

export interface UserProfile {
  id?: string;
  username?: string;
  avatar_url?: string;
  email: string;
  level?: number;
  coins?: number;
  experience?: number;
}

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
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

  const loadUserProfile = async () => {
    try {
      // 先检查localStorage
      const profileData = localStorage.getItem('userProfile');
      if (profileData) {
        const profile = JSON.parse(profileData);
        setUserProfile(profile);
        setLoading(false);
        return;
      }

      // 从Supabase获取session
      const { data: { session } } = await supabase.auth.getSession();
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
  };

  const refreshProfile = async () => {
    await loadUserProfile();
  };


  useEffect(() => {
    loadUserProfile();

    // 监听认证状态变化
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (profile) {
          localStorage.setItem('userProfile', JSON.stringify(profile));
          setUserProfile(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userSession');
        setUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    userProfile,
    loading,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 