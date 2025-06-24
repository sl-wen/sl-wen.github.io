import { supabase } from './supabase-config';

export interface Task {
  id: string;
  title: string;
  description: string;
  reward_coins: number;
  reward_exp: number;
  required_level: number;
  status: 'available' | 'in_progress' | 'completed';
  created_at: string;
  completed_at?: string;
}

export interface TaskProgress {
  id: string;
  user_id: string;
  task_id: string;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at?: string;
  task?: Task;
}

export const getAvailableTasks = async (userLevel: number) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .lte('required_level', userLevel)
      .eq('status', 'available');

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const getTaskProgress = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('task_progress')
      .select(`
        *,
        task:tasks(*)
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const startTask = async (userId: string, taskId: string) => {
  try {
    const { data, error } = await supabase
      .from('task_progress')
      .insert({
        user_id: userId,
        task_id: taskId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const completeTask = async (userId: string, taskId: string) => {
  try {
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('reward_coins, reward_exp')
      .eq('id', taskId)
      .single();

    if (taskError) throw taskError;

    const { data: progress, error: progressError } = await supabase
      .from('task_progress')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .select()
      .single();

    if (progressError) throw progressError;

    // 更新用户的金币和经验值
    const { error: updateError } = await supabase.rpc('update_user_rewards', {
      user_id: userId,
      coins: task.reward_coins,
      exp: task.reward_exp,
    });

    if (updateError) throw updateError;

    return progress;
  } catch (error) {
    throw error;
  }
};

export const calculateLevel = (experience: number): number => {
  const baseExp = 100;
  const expMultiplier = 1.5;
  let level = 1;
  let expRequired = baseExp;

  while (experience >= expRequired) {
    experience -= expRequired;
    level++;
    expRequired = Math.floor(baseExp * Math.pow(expMultiplier, level - 1));
  }

  return level;
};

export const getExpForNextLevel = (currentLevel: number): number => {
  const baseExp = 100;
  const expMultiplier = 1.5;
  return Math.floor(baseExp * Math.pow(expMultiplier, currentLevel - 1));
};