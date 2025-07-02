import { supabase } from './supabase-config';

export interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  level: number;
  avatar_url: string;
  adress: string;
  last_login: string;
  coins: number;
  experience: number;
}

export const getCurrentSession = async () => {
  try {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('获取会话失败:', error);
    return null;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    const { data: sessiondata, error: sessionerror } = await supabase.auth.getSession();
    const session = sessiondata?.session;
    // 获取用户详细信息
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session?.user?.id)
      .maybeSingle();

    localStorage.setItem('userSession', JSON.stringify(session));
    localStorage.setItem('userProfile', JSON.stringify(profile));
    return data;
  } catch (error) {
    throw error;
  }
};

export const signUp = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) throw error;
    // 创建用户资料
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          user_id: data.user.id,
          username: email.split('@')[0],
          level: 0,
          amount: 0,
          adress: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

      if (profileError) console.error('创建用户资料失败:', profileError);
    }
    return data;
  } catch (error) {
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userSession');
  } catch (error) {
    throw error;
  }
};

export const setUserProfile = async (updates: Partial<UserProfile>) => {
  try {
    const { data, error } = await supabase.from('profiles').insert(updates).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (user_id: string, updates: Partial<UserProfile>) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const validatePassword = (password: string): boolean => {
  const hasLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return hasLength && hasLower && hasUpper && hasNumber && hasSpecial;
};
