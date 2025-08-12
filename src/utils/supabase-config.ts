import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pcwbtcsigmjnrigkfixm.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjd2J0Y3NpZ21qbnJpZ2tmaXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NzE0MDMsImV4cCI6MjA2MzE0NzQwM30.J97Dt4tOwS0bM9vALgBTga-VyCLdHN6wfFrPse6dORg';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true
  },
  db: {
    schema: 'public'
  },
  // 添加全局配置以处理长内容
  global: {
    headers: {
      'x-client-info': 'supabase-js-web',
    },
    // 增加超时时间到60秒，适应长内容提交
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时
      
      // 如果已经有signal，需要合并
      const existingSignal = options.signal;
      if (existingSignal) {
        // 如果原signal已经被abort，直接使用原signal
        if (existingSignal.aborted) {
          clearTimeout(timeoutId);
          return Promise.reject(new Error('Request was aborted'));
        }
        // 监听原signal的abort事件
        existingSignal.addEventListener('abort', () => {
          controller.abort();
        });
      }
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      });
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
