import { createClient } from '@supabase/supabase-js';

// 新 Supabase 项目（2026-10-21 迁移）：环境变量优先，构建时内联
// 兼容两种命名：NEXT_PUBLIC_SUPABASE_ANON_KEY（老）/ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY（新）
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tdiknrktmgbetvcyhdav.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

if (!supabaseAnonKey) {
  console.warn('[supabase-config] NEXT_PUBLIC_SUPABASE_ANON_KEY 未配置');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'blog-app@1.0.1'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('获取当前用户失败:', error);
    return null;
  }
};

export const getUserProfile = async (user_id: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return null;
  }
};
