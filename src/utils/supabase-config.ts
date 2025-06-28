import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pcwbtcsigmjnrigkfixm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjd2J0Y3NpZ21qbnJpZ2tmaXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NzE0MDMsImV4cCI6MjA2MzE0NzQwM30.J97Dt4tOwS0bM9vALgBTga-VyCLdHN6wfFrPse6dORg';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true
  },
  db: {
    schema: 'public'
  }
});

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
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